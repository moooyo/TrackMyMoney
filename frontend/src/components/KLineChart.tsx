import { useState, useEffect, useMemo, useCallback } from 'react';
import { Radio, Select, Tag, Skeleton, Button, Space, Tooltip } from 'antd';
import ReactECharts from 'echarts-for-react';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';
import { marketService } from '@/services/MarketService';
import { useMarketWebSocket } from '@/hooks/useMarketWebSocket';
import type { ModelsHistoryResponse, ModelsQuote } from '@/types/generated/Api';
import type { MarketDataMessage } from '@/hooks/useMarketWebSocket';
import {
  type TradingSession,
  type ViewMode,
  type MainViewMode,
  getIntervalForViewMode,
  getPeriodForViewMode,
  getMarketForSymbol,
  getSessionTimeRange,
  isTradingSessionView,
  isIntradayView,
} from '@/utils/tradingSession';
import logger from '@/utils/logger';

export interface KLineChartProps {
  symbol: string; // 股票代码
  assetType: string; // 资产类型
  isWatched?: boolean; // 是否已关注
  onWatchToggle?: () => void; // 关注切换回调
  showWatchButton?: boolean; // 是否显示关注按钮
  quote?: ModelsQuote | null; // 实时报价（可选，用于WebSocket更新）
  onQuoteUpdate?: (quote: ModelsQuote) => void; // 报价更新回调
}

export default function KLineChart({
  symbol,
  assetType,
  isWatched = false,
  onWatchToggle,
  showWatchButton = true,
  quote,
  onQuoteUpdate,
}: KLineChartProps) {
  const [history, setHistory] = useState<ModelsHistoryResponse | null>(null);
  const [mainViewMode, setMainViewMode] = useState<MainViewMode>('all-sessions');
  const [subSession, setSubSession] = useState<TradingSession>('regular');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // WebSocket 状态
  const [wsEnabled, setWsEnabled] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // 计算实际使用的视图模式
  const viewMode: ViewMode = mainViewMode === 'all-sessions' ? subSession : mainViewMode;

  // 判断市场类型
  const market = getMarketForSymbol(symbol);
  const isCrypto = market === 'CRYPTO';
  const allSessionsLabel = isCrypto ? '行情' : '全部分时';

  // WebSocket 连接
  const { lastMessage, connected: wsConnectionStatus } = useMarketWebSocket(symbol, {
    enabled: wsEnabled && mainViewMode === 'all-sessions',
    onMessage: useCallback(
      (data: MarketDataMessage) => {
        logger.debug('Real-time market data:', data);

        // 更新报价数据
        if (quote && data.symbol === symbol && onQuoteUpdate) {
          onQuoteUpdate({
            ...quote,
            price: data.price ?? quote.price,
            change: data.change ?? quote.change,
            change_percent: data.change_percent ?? quote.change_percent,
            volume: data.volume ? Number(data.volume) : quote.volume,
            timestamp: data.timestamp ? Number(data.timestamp) : quote.timestamp,
          });
        }

        // 实时更新K线数据（仅交易时段视图）
        if (history && isTradingSessionView(viewMode)) {
          const newDataPoint = {
            date: new Date(data.timestamp || Date.now()).toISOString(),
            timestamp: data.timestamp,
            open: data.price,
            high: data.price,
            low: data.price,
            close: data.price,
            volume: data.volume ? Number(data.volume) : undefined,
          };

          setHistory({
            ...history,
            data_points: [...(history.data_points || []), newDataPoint],
          });
        }
      },
      [quote, history, viewMode, symbol, onQuoteUpdate],
    ),
    onConnectionChange: useCallback((connected: boolean) => {
      setWsConnected(connected);
      logger.info(`WebSocket connection ${connected ? 'established' : 'closed'}`);
    }, []),
  });

  // 同步 WebSocket 连接状态
  useEffect(() => {
    setWsConnected(wsConnectionStatus);
  }, [wsConnectionStatus]);

  // 获取历史数据
  const fetchHistory = useCallback(async () => {
    if (!symbol) return;

    setLoading(true);
    try {
      const interval = getIntervalForViewMode(viewMode);
      const period = getPeriodForViewMode(viewMode);
      const historyData = await marketService.getHistory(symbol, period, interval);
      setHistory(historyData);
      setInitialLoad(false);
    } catch (error) {
      logger.error('Failed to fetch history', error);
    } finally {
      setLoading(false);
    }
  }, [symbol, viewMode]);

  // 初始加载和视图模式变化时重新获取数据
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // 控制WebSocket启用状态
  useEffect(() => {
    if (mainViewMode === 'all-sessions') {
      setWsEnabled(true);
    } else {
      setWsEnabled(false);
    }
  }, [mainViewMode]);

  // 计算移动平均线（MA）
  const calculateMA = useCallback((data: number[], period: number = 5): (number | null)[] => {
    const result: (number | null)[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(null);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
      }
    }
    return result;
  }, []);

  // K线图配置
  const klineOption = useMemo(() => {
    if (!history?.data_points || history.data_points.length === 0) {
      return null;
    }

    const isIntraday = isIntradayView(viewMode);
    const isSessionView = isTradingSessionView(viewMode);

    // 准备数据
    let finalDates: string[];
    const closePrices: number[] = [];
    const volumeData: number[] = [];

    if (isSessionView) {
      // 交易时段视图：生成完整时间序列
      const sessionTimeRange = getSessionTimeRange(viewMode as TradingSession, market);

      const allTimeLabels: string[] = [];
      if (sessionTimeRange) {
        const interval = getIntervalForViewMode(viewMode);
        const intervalMinutes =
          interval === '1m' ? 1 : interval === '5m' ? 5 : interval === '15m' ? 15 : 1;

        const currentTime = Date.now();
        const endTime = Math.min(currentTime, sessionTimeRange.end);

        for (
          let time = sessionTimeRange.start;
          time <= endTime;
          time += intervalMinutes * 60 * 1000
        ) {
          const date = new Date(time);
          allTimeLabels.push(
            `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
          );
        }
      }

      const dates = history.data_points.map((point) => {
        if (point.timestamp) {
          const date = new Date(point.timestamp);
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        return point.date || '';
      });

      finalDates = allTimeLabels.length > dates.length ? allTimeLabels : dates;
    } else {
      finalDates = history.data_points.map((point) => point.date || '');
    }

    // 提取收盘价和成交量
    history.data_points.forEach((point) => {
      closePrices.push(point.close || 0);
      volumeData.push(point.volume || 0);
    });

    // 计算MA线（仅分时图）
    const ma5Data = isIntraday ? calculateMA(closePrices, 5) : [];

    if (isIntraday) {
      // 分时图：折线图 + MA线 + 成交量
      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' },
        },
        legend: {
          data: ['价格', 'MA5'],
          top: 0,
        },
        grid: [
          { left: '5%', right: '5%', top: '12%', height: '60%' },
          { left: '5%', right: '5%', top: '77%', height: '18%' },
        ],
        xAxis: [
          {
            type: 'category',
            data: finalDates,
            gridIndex: 0,
            axisLabel: { interval: Math.floor(finalDates.length / 10), rotate: 45 },
          },
          {
            type: 'category',
            data: finalDates,
            gridIndex: 1,
            axisLabel: { show: false },
          },
        ],
        yAxis: [
          { scale: true, gridIndex: 0, splitLine: { show: true } },
          { scale: true, gridIndex: 1, splitLine: { show: false } },
        ],
        series: [
          {
            name: '价格',
            type: 'line',
            data: closePrices,
            smooth: true,
            lineStyle: { color: '#1890ff', width: 2 },
            itemStyle: { color: '#1890ff' },
            xAxisIndex: 0,
            yAxisIndex: 0,
          },
          {
            name: 'MA5',
            type: 'line',
            data: ma5Data,
            smooth: true,
            lineStyle: { color: '#ff7a00', width: 1.5 },
            itemStyle: { color: '#ff7a00' },
            xAxisIndex: 0,
            yAxisIndex: 0,
          },
          {
            name: '成交量',
            type: 'bar',
            data: volumeData,
            itemStyle: { color: '#c0c0c0' },
            xAxisIndex: 1,
            yAxisIndex: 1,
          },
        ],
        dataZoom: [
          { type: 'inside', xAxisIndex: [0, 1], start: 0, end: 100 },
          { show: true, xAxisIndex: [0, 1], type: 'slider', bottom: 0, start: 0, end: 100 },
        ],
      };
    } else {
      // K线图：蜡烛图 + 成交量
      const klineData = history.data_points.map((point) => [
        point.open || 0,
        point.close || 0,
        point.low || 0,
        point.high || 0,
      ]);

      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' },
          formatter: (params: { seriesName: string; name: string; value: number[] }[]) => {
            const kline = params.find((p) => p.seriesName === symbol);
            const volume = params.find((p) => p.seriesName === '成交量');
            if (!kline) return '';
            const values = kline.value;
            return `
              ${kline.name}<br/>
              开盘: ${values[1]}<br/>
              收盘: ${values[2]}<br/>
              最低: ${values[3]}<br/>
              最高: ${values[4]}<br/>
              成交量: ${volume ? volume.value.toLocaleString() : 'N/A'}
            `;
          },
        },
        legend: {
          data: [symbol, '成交量'],
          top: 0,
        },
        grid: [
          { left: '5%', right: '5%', top: '12%', height: '60%' },
          { left: '5%', right: '5%', top: '77%', height: '18%' },
        ],
        xAxis: [
          {
            type: 'category',
            data: finalDates,
            gridIndex: 0,
            axisLabel: { interval: Math.floor(finalDates.length / 10), rotate: 45 },
            boundaryGap: true,
          },
          {
            type: 'category',
            data: finalDates,
            gridIndex: 1,
            axisLabel: { show: false },
            boundaryGap: true,
          },
        ],
        yAxis: [
          { scale: true, gridIndex: 0, splitLine: { show: true } },
          { scale: true, gridIndex: 1, splitLine: { show: false } },
        ],
        series: [
          {
            name: symbol,
            type: 'candlestick',
            data: klineData,
            itemStyle: {
              color: '#ef5350',
              color0: '#26a69a',
              borderColor: '#ef5350',
              borderColor0: '#26a69a',
            },
            xAxisIndex: 0,
            yAxisIndex: 0,
          },
          {
            name: '成交量',
            type: 'bar',
            data: volumeData,
            itemStyle: { color: '#c0c0c0' },
            xAxisIndex: 1,
            yAxisIndex: 1,
          },
        ],
        dataZoom: [
          { type: 'inside', xAxisIndex: [0, 1], start: 0, end: 100 },
          { show: true, xAxisIndex: [0, 1], type: 'slider', bottom: 0, start: 0, end: 100 },
        ],
      };
    }
  }, [history, viewMode, symbol, market, calculateMA]);

  return (
    <div>
      {/* 控制栏 */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <Radio.Group
            value={mainViewMode}
            onChange={(e) => setMainViewMode(e.target.value as MainViewMode)}
            size="small"
            buttonStyle="solid"
          >
            <Radio.Button value="all-sessions">{allSessionsLabel}</Radio.Button>
            <Radio.Button value="5d">5日</Radio.Button>
            <Radio.Button value="1d">日K</Radio.Button>
            <Radio.Button value="1wk">周K</Radio.Button>
            <Radio.Button value="1mo">月K</Radio.Button>
            <Radio.Button value="3mo">季K</Radio.Button>
            <Radio.Button value="1y">年K</Radio.Button>
          </Radio.Group>

          {/* 关注按钮 */}
          {showWatchButton && onWatchToggle && (
            <Tooltip title={isWatched ? '取消关注' : '添加关注'}>
              <Button
                type="text"
                icon={
                  isWatched ? (
                    <HeartFilled style={{ color: '#ff4d4f', fontSize: '20px' }} />
                  ) : (
                    <HeartOutlined style={{ color: '#d9d9d9', fontSize: '20px' }} />
                  )
                }
                onClick={onWatchToggle}
              />
            </Tooltip>
          )}
        </div>

        {/* 子时段选择（仅在全部分时模式下显示，加密货币除外） */}
        {mainViewMode === 'all-sessions' && !isCrypto && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>时段：</span>
            <Select
              value={subSession}
              onChange={(value) => setSubSession(value as TradingSession)}
              size="small"
              style={{ width: '120px' }}
              options={[
                { value: 'pre-market', label: '盘前分时' },
                { value: 'regular', label: '盘中分时' },
                { value: 'after-hours', label: '盘后分时' },
                { value: 'extended', label: '夜盘分时' },
              ]}
            />
            {wsConnected && (
              <Tag color="success" style={{ marginLeft: '4px' }}>
                ● 实时更新
              </Tag>
            )}
          </div>
        )}

        {/* 加密货币实时更新标签 */}
        {mainViewMode === 'all-sessions' && isCrypto && wsConnected && (
          <div style={{ marginBottom: '8px' }}>
            <Tag color="success">● 实时更新</Tag>
          </div>
        )}
      </div>

      {/* K线图 */}
      {loading && initialLoad ? (
        <Skeleton.Node active style={{ width: '100%', height: 400 }} />
      ) : klineOption ? (
        <div style={{ background: '#fff', padding: '16px', borderRadius: '8px' }}>
          <ReactECharts option={klineOption} style={{ height: 400 }} />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>暂无历史数据</div>
      )}
    </div>
  );
}
