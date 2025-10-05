import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Segmented,
  Skeleton,
  Tag,
  Space,
  Button,
  Radio,
  Switch,
  Descriptions,
  Statistic,
  Row,
  Col,
  Select,
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
  RiseOutlined,
  FallOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { ProCard, StatisticCard, PageContainer } from '@ant-design/pro-components';
import { Line, Pie } from '@ant-design/charts';
import ReactECharts from 'echarts-for-react';
import { useAssetsStore } from '@/stores/assetsStore';
import {
  useCashAssetStore,
  useInterestBearingAssetStore,
  useStockAssetStore,
  useDebtAssetStore,
  useCryptoAssetStore,
  useWatchlistStore,
} from '@/stores';
import { marketService } from '@/services/MarketService';
import type { ModelsQuote, ModelsHistoryResponse, ModelsInfoResponse } from '@/types/generated/Api';
import type { WatchlistWithQuote } from '@/services/WatchlistService';
import logger from '@/utils/logger';
import { useNavigate } from 'react-router-dom';
import { useMarketWebSocket } from '@/hooks/useMarketWebSocket';
import type { MarketDataMessage } from '@/hooks/useMarketWebSocket';
import {
  type TradingSession,
  type ViewMode,
  type MainViewMode,
  VIEW_MODE_LABELS,
  MAIN_VIEW_LABELS,
  SESSION_LABELS,
  getIntervalForViewMode,
  getPeriodForViewMode,
  getMarketForSymbol,
  getSessionTimeRange,
  isInSession,
  isTradingSessionView,
  isIntradayView,
  isMainViewMode,
} from '@/utils/tradingSession';

const assetTypeLabels: Record<string, string> = {
  cash: '现金资产',
  interest_bearing: '计息资产',
  stock: '股票资产',
  debt: '债务资产',
  crypto: '加密货币',
};

export default function Home() {
  const navigate = useNavigate();

  // 使用 selector 选择性订阅 store 状态，避免不必要的重新渲染
  const summary = useAssetsStore((state) => state.summary);
  const history = useAssetsStore((state) => state.history);
  const loading = useAssetsStore((state) => state.loading);
  const fetchSummary = useAssetsStore((state) => state.fetchSummary);
  const fetchHistory = useAssetsStore((state) => state.fetchHistory);

  const cashAssets = useCashAssetStore((state) => state.assets);
  const fetchCashAssets = useCashAssetStore((state) => state.fetchAssets);

  const interestBearingAssets = useInterestBearingAssetStore((state) => state.assets);
  const fetchInterestBearingAssets = useInterestBearingAssetStore((state) => state.fetchAssets);

  const stockAssets = useStockAssetStore((state) => state.assets);
  const fetchStockAssets = useStockAssetStore((state) => state.fetchAssets);

  const debtAssets = useDebtAssetStore((state) => state.assets);
  const fetchDebtAssets = useDebtAssetStore((state) => state.fetchAssets);

  const cryptoAssets = useCryptoAssetStore((state) => state.assets);
  const fetchCryptoAssets = useCryptoAssetStore((state) => state.fetchAssets);

  const { watchlist, fetchWatchlistWithQuotes } = useWatchlistStore();

  const [period, setPeriod] = useState<string>('30d');
  const [nasdaqQuote, setNasdaqQuote] = useState<ModelsQuote | null>(null);
  const [nasdaqHistory, setNasdaqHistory] = useState<ModelsHistoryResponse | null>(null);
  const [marketRefreshing, setMarketRefreshing] = useState(false);
  const [klineLoading, setKlineLoading] = useState(false);
  const [mainViewMode, setMainViewMode] = useState<MainViewMode>('all-sessions'); // 主视图模式
  const [subSession, setSubSession] = useState<TradingSession>('regular'); // 子时段（用于全部分时）
  const [autoRefreshKline, setAutoRefreshKline] = useState(false);

  // 自选资产展开状态
  const [expandedAssetId, setExpandedAssetId] = useState<number | null>(null);
  const [assetQuote, setAssetQuote] = useState<ModelsQuote | null>(null);
  const [assetHistory, setAssetHistory] = useState<ModelsHistoryResponse | null>(null);
  const [assetInfo, setAssetInfo] = useState<ModelsInfoResponse | null>(null);
  const [assetMainViewMode, setAssetMainViewMode] = useState<MainViewMode>('all-sessions'); // 资产主视图模式
  const [assetSubSession, setAssetSubSession] = useState<TradingSession>('regular'); // 资产子时段
  const [assetLoading, setAssetLoading] = useState(false);
  const [assetInitialLoad, setAssetInitialLoad] = useState(true); // 是否为首次加载

  // 计算实际使用的视图模式（当主视图为"全部分时"时使用子时段，否则使用主视图）
  const viewMode: ViewMode = mainViewMode === 'all-sessions' ? subSession : mainViewMode;
  const assetViewMode: ViewMode = assetMainViewMode === 'all-sessions' ? assetSubSession : assetMainViewMode;

  // WebSocket 状态
  const [wsEnabled, setWsEnabled] = useState(false);
  const [wsSymbol, setWsSymbol] = useState<string>('');
  const [wsConnected, setWsConnected] = useState(false);

  // WebSocket 连接 - 实时行情（仅在分时图模式下启用）
  const { lastMessage: wsLastMessage, connected: wsConnectionStatus } = useMarketWebSocket(
    wsSymbol || 'AAPL',
    {
      enabled: wsEnabled && wsSymbol !== '' && assetMainViewMode === 'all-sessions',
      onMessage: useCallback((data: MarketDataMessage) => {
        logger.debug('Real-time market data:', data);

        // 更新报价数据
        if (assetQuote && data.symbol === wsSymbol) {
          setAssetQuote({
            ...assetQuote,
            price: data.price ?? assetQuote.price,
            change: data.change ?? assetQuote.change,
            change_percent: data.change_percent ?? assetQuote.change_percent,
            volume: data.volume ? Number(data.volume) : assetQuote.volume,
            timestamp: data.timestamp ? Number(data.timestamp) : assetQuote.timestamp,
          });
        }

        // 实时更新K线数据（仅交易时段视图）
        if (assetHistory && isTradingSessionView(assetViewMode)) {
          const newDataPoint = {
            date: new Date(data.timestamp || Date.now()).toISOString(),
            timestamp: data.timestamp,
            open: data.price,
            high: data.price,
            low: data.price,
            close: data.price,
            volume: data.volume ? Number(data.volume) : undefined,
          };

          setAssetHistory({
            ...assetHistory,
            data_points: [...(assetHistory.data_points || []), newDataPoint],
          });
        }
      }, [assetQuote, assetHistory, assetViewMode, wsSymbol]),
      onConnectionChange: useCallback((connected: boolean) => {
        setWsConnected(connected);
        logger.info(`WebSocket connection ${connected ? 'established' : 'closed'}`);
      }, []),
    },
  );

  // 同步 WebSocket 连接状态
  useEffect(() => {
    setWsConnected(wsConnectionStatus);
  }, [wsConnectionStatus]);

  // 获取市场数据
  const fetchMarketData = useCallback(async () => {
    setKlineLoading(true);
    try {
      // 根据视图模式获取对应的interval和period
      const interval = getIntervalForViewMode(viewMode);
      const period = getPeriodForViewMode(viewMode);

      // 获取纳斯达克指数报价和历史数据
      const [nasdaq, history] = await Promise.all([
        marketService.getQuote('^IXIC'),
        marketService.getHistory('^IXIC', period, interval),
      ]);
      setNasdaqQuote(nasdaq);
      setNasdaqHistory(history);
    } catch (error) {
      logger.error('Failed to fetch market data', error);
    } finally {
      setKlineLoading(false);
    }
  }, [viewMode]);

  // 刷新市场行情
  const handleRefreshMarket = useCallback(async () => {
    setMarketRefreshing(true);
    try {
      await Promise.all([fetchMarketData(), fetchWatchlistWithQuotes()]);
    } catch (error) {
      logger.error('Failed to refresh market', error);
    } finally {
      setMarketRefreshing(false);
    }
  }, [fetchMarketData, fetchWatchlistWithQuotes]);

  // 初始加载数据
  useEffect(() => {
    fetchSummary();
    fetchCashAssets();
    fetchInterestBearingAssets();
    fetchStockAssets();
    fetchDebtAssets();
    fetchCryptoAssets();
    fetchMarketData();
    fetchWatchlistWithQuotes();
  }, [
    fetchSummary,
    fetchCashAssets,
    fetchInterestBearingAssets,
    fetchStockAssets,
    fetchDebtAssets,
    fetchCryptoAssets,
    fetchMarketData,
    fetchWatchlistWithQuotes,
  ]);

  // period 变化时重新获取历史数据
  useEffect(() => {
    fetchHistory(period);
  }, [period, fetchHistory]);

  // 视图模式变化时重新获取市场数据
  useEffect(() => {
    fetchMarketData();
  }, [viewMode, fetchMarketData]);

  // K线图自动刷新（仅交易时段视图）
  useEffect(() => {
    if (!autoRefreshKline || !isTradingSessionView(viewMode) || mainViewMode !== 'all-sessions') return;

    // 根据交易时段设置刷新间隔
    const refreshIntervalMs: Record<TradingSession, number> = {
      'pre-market': 60000, // 盘前1分钟刷新一次
      regular: 60000, // 盘内1分钟刷新一次
      'after-hours': 60000, // 盘后1分钟刷新一次
      extended: 120000, // 夜盘2分钟刷新一次
    };

    const interval = refreshIntervalMs[viewMode as TradingSession];

    const timer = setInterval(() => {
      fetchMarketData();
    }, interval);

    return () => clearInterval(timer);
  }, [autoRefreshKline, viewMode, mainViewMode, fetchMarketData]);

  const handlePeriodChange = useCallback((value: string | number) => {
    logger.info(`Period changed to: ${value}`);
    setPeriod(value as string);
  }, []);

  // 切换资产详情展开/收起
  const handleAssetClick = useCallback(
    async (asset: WatchlistWithQuote) => {
      // 如果点击的是已展开的资产，则收起
      if (expandedAssetId === asset.id) {
        setExpandedAssetId(null);
        setAssetQuote(null);
        setAssetHistory(null);
        setAssetInfo(null);
        setAssetInitialLoad(true); // 重置为初始加载状态
        // 禁用 WebSocket
        setWsEnabled(false);
        setWsSymbol('');
        return;
      }

      // 展开新的资产
      setExpandedAssetId(asset.id || null);
      setAssetInitialLoad(true); // 首次展开，标记为初始加载
      setAssetLoading(true);

      // 启用 WebSocket 连接（仅在"全部分时"模式下需要实时数据）
      if (asset.symbol && assetMainViewMode === 'all-sessions') {
        setWsSymbol(asset.symbol);
        setWsEnabled(true);
      } else {
        setWsEnabled(false);
      }

      try {
        // 根据视图模式获取对应的interval和period
        const interval = getIntervalForViewMode(assetViewMode);
        const period = getPeriodForViewMode(assetViewMode);

        // 并行获取报价、历史数据和详细信息
        const [quote, history, info] = await Promise.all([
          marketService.getQuote(asset.symbol || ''),
          marketService.getHistory(asset.symbol || '', period, interval),
          marketService.getInfo(asset.symbol || ''),
        ]);

        setAssetQuote(quote);
        setAssetHistory(history);
        setAssetInfo(info);
        setAssetInitialLoad(false); // 首次加载完成
      } catch (error) {
        logger.error('Failed to fetch asset details', error);
      } finally {
        setAssetLoading(false);
      }
    },
    [assetViewMode, assetMainViewMode, expandedAssetId],
  );

  // 使用 useMemo 缓存图表数据计算结果
  const categoryPieData = useMemo(() => {
    if (!summary?.categories) return [];
    return Object.entries(summary.categories)
      .filter(([, value]) => value > 0)
      .map(([type, value]) => ({
        type: assetTypeLabels[type] || type,
        value,
      }));
  }, [summary]);

  const assetCountData = useMemo(() => {
    return [
      { type: '现金资产', count: cashAssets.length },
      { type: '计息资产', count: interestBearingAssets.length },
      { type: '股票资产', count: stockAssets.length },
      { type: '债务资产', count: debtAssets.length },
      { type: '加密货币', count: cryptoAssets.length },
    ].filter((item) => item.count > 0);
  }, [cashAssets, interestBearingAssets, stockAssets, debtAssets, cryptoAssets]);

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

  // 资产视图模式变化时重新获取数据
  useEffect(() => {
    if (expandedAssetId === null) return;
    const asset = watchlist.find((item) => item.id === expandedAssetId);
    if (!asset) return;

    // 控制WebSocket启用状态（仅在"全部分时"模式下启用）
    if (asset.symbol && assetMainViewMode === 'all-sessions') {
      setWsSymbol(asset.symbol);
      setWsEnabled(true);
    } else {
      setWsEnabled(false);
    }

    // 只重新获取数据，不切换展开状态
    const fetchAssetData = async () => {
      setAssetLoading(true);
      try {
        // 根据视图模式获取对应的interval和period
        const interval = getIntervalForViewMode(assetViewMode);
        const period = getPeriodForViewMode(assetViewMode);

        const [quote, history, info] = await Promise.all([
          marketService.getQuote(asset.symbol || ''),
          marketService.getHistory(asset.symbol || '', period, interval),
          marketService.getInfo(asset.symbol || ''),
        ]);

        setAssetQuote(quote);
        setAssetHistory(history);
        setAssetInfo(info);
        setAssetInitialLoad(false); // 加载完成后，不再是初始加载
      } catch (error) {
        logger.error('Failed to fetch asset details', error);
      } finally {
        setAssetLoading(false);
      }
    };

    fetchAssetData();
  }, [assetViewMode, assetMainViewMode, expandedAssetId, watchlist]);

  // 资产K线图配置
  const assetKlineOption = useMemo(() => {
    if (!assetHistory?.data_points || assetHistory.data_points.length === 0) {
      return null;
    }

    // 判断是否为分时图视图
    const isIntraday = isIntradayView(assetViewMode);
    const isSessionView = isTradingSessionView(assetViewMode);

    // 准备数据
    let finalDates: string[];
    const closePrices: number[] = [];
    const volumeData: number[] = [];

    if (isSessionView) {
      // 交易时段视图：生成完整时间序列
      const asset = watchlist.find((item) => item.id === expandedAssetId);
      const market = asset?.symbol ? getMarketForSymbol(asset.symbol) : 'US';
      const sessionTimeRange = getSessionTimeRange(assetViewMode as TradingSession, market);

      const allTimeLabels: string[] = [];
      if (sessionTimeRange) {
        const interval = getIntervalForViewMode(assetViewMode);
        const intervalMinutes = interval === '1m' ? 1 : interval === '5m' ? 5 : interval === '15m' ? 15 : 1;

        const currentTime = Date.now();
        const endTime = Math.min(currentTime, sessionTimeRange.end);

        for (let time = sessionTimeRange.start; time <= endTime; time += intervalMinutes * 60 * 1000) {
          const date = new Date(time);
          allTimeLabels.push(
            `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
          );
        }
      }

      // 格式化实际数据的时间标签
      const dates = assetHistory.data_points.map((point) => {
        if (point.timestamp) {
          const date = new Date(point.timestamp);
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        return point.date || '';
      });

      finalDates = allTimeLabels.length > dates.length ? allTimeLabels : dates;
    } else {
      // 日/周/年视图：直接使用数据点的日期
      finalDates = assetHistory.data_points.map((point) => point.date || '');
    }

    // 提取收盘价和成交量
    assetHistory.data_points.forEach((point) => {
      closePrices.push(point.close || 0);
      volumeData.push(point.volume || 0);
    });

    // 计算MA线（仅分时图）
    const ma5Data = isIntraday ? calculateMA(closePrices, 5) : [];

    // 构建图表配置
    const symbolName = watchlist.find((item) => item.id === expandedAssetId)?.symbol || '';

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
          { left: '5%', right: '5%', top: '12%', height: '60%' }, // 价格图
          { left: '5%', right: '5%', top: '77%', height: '18%' }, // 成交量图
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
          { scale: true, gridIndex: 0, splitLine: { show: true } }, // 价格Y轴
          { scale: true, gridIndex: 1, splitLine: { show: false } }, // 成交量Y轴
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
      const klineData = assetHistory.data_points.map((point) => [
        point.open || 0,
        point.close || 0,
        point.low || 0,
        point.high || 0,
      ]);

      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' },
          formatter: (params: any) => {
            const kline = params.find((p: any) => p.seriesName === symbolName);
            const volume = params.find((p: any) => p.seriesName === '成交量');
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
          data: [symbolName, '成交量'],
          top: 0,
        },
        grid: [
          { left: '5%', right: '5%', top: '12%', height: '60%' }, // K线图
          { left: '5%', right: '5%', top: '77%', height: '18%' }, // 成交量图
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
          { scale: true, gridIndex: 0, splitLine: { show: true } }, // K线Y轴
          { scale: true, gridIndex: 1, splitLine: { show: false } }, // 成交量Y轴
        ],
        series: [
          {
            name: symbolName,
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
  }, [assetHistory, assetViewMode, expandedAssetId, watchlist, calculateMA]);

  // 纳斯达克K线图配置
  const klineOption = useMemo(() => {
    if (!nasdaqHistory?.data_points || nasdaqHistory.data_points.length === 0) {
      return null;
    }

    // 判断是否为分时图视图
    const isIntraday = isIntradayView(viewMode);
    const isSessionView = isTradingSessionView(viewMode);

    // 格式化时间标签
    const dates = nasdaqHistory.data_points.map((point) => {
      if (isSessionView && point.timestamp) {
        const date = new Date(point.timestamp);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
      return point.date || '';
    });

    // 提取收盘价和成交量
    const closePrices = nasdaqHistory.data_points.map((point) => point.close || 0);
    const volumeData = nasdaqHistory.data_points.map((point) => point.volume || 0);

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
            data: dates,
            gridIndex: 0,
            axisLabel: { interval: Math.floor(dates.length / 10), rotate: 45 },
          },
          {
            type: 'category',
            data: dates,
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
      const klineData = nasdaqHistory.data_points.map((point) => [
        point.open || 0,
        point.close || 0,
        point.low || 0,
        point.high || 0,
      ]);

      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' },
          formatter: (params: any) => {
            const kline = params.find((p: any) => p.seriesName === '纳斯达克');
            const volume = params.find((p: any) => p.seriesName === '成交量');
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
          data: ['纳斯达克', '成交量'],
          top: 0,
        },
        grid: [
          { left: '5%', right: '5%', top: '12%', height: '60%' },
          { left: '5%', right: '5%', top: '77%', height: '18%' },
        ],
        xAxis: [
          {
            type: 'category',
            data: dates,
            gridIndex: 0,
            axisLabel: { interval: Math.floor(dates.length / 10), rotate: 45 },
            boundaryGap: true,
          },
          {
            type: 'category',
            data: dates,
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
            name: '纳斯达克',
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
  }, [nasdaqHistory, viewMode, calculateMA]);

  // 计算投资资产的总收益和收益率
  const investmentStats = useMemo(() => {
    let totalCost = 0;
    let totalMarketValue = 0;

    // 计算股票资产
    stockAssets.forEach((asset) => {
      const cost = (asset.purchase_price || 0) * (asset.quantity || 0);
      const marketValue = (asset.current_price || 0) * (asset.quantity || 0);
      totalCost += cost;
      totalMarketValue += marketValue;
    });

    // 计算加密货币资产
    cryptoAssets.forEach((asset) => {
      const cost = (asset.purchase_price || 0) * (asset.quantity || 0);
      const marketValue = (asset.current_price || 0) * (asset.quantity || 0);
      totalCost += cost;
      totalMarketValue += marketValue;
    });

    const totalProfit = totalMarketValue - totalCost;
    const profitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return {
      totalCost,
      totalMarketValue,
      totalProfit,
      profitRate,
      isProfit: totalProfit >= 0,
    };
  }, [stockAssets, cryptoAssets]);

  // 使用 useMemo 缓存图表配置
  const lineChartConfig = useMemo(
    () => ({
      data: history,
      xField: 'date',
      yField: 'net_assets',
      point: {
        size: 3,
        shape: 'circle',
      },
      label: {
        style: {
          fill: '#aaa',
        },
      },
      smooth: true,
      animation: {
        appear: {
          animation: 'path-in',
          duration: 1000,
        },
      },
    }),
    [history],
  );

  const categoryPieConfig = useMemo(
    () => ({
      data: categoryPieData,
      angleField: 'value',
      colorField: 'type',
      radius: 0.8,
      innerRadius: 0.6,
      label: {
        text: (d: { value: number }) => `¥${d.value.toLocaleString()}`,
        style: {
          fontWeight: 'bold',
          fontSize: 12,
        },
        position: 'spider' as const,
      },
      legend: {
        color: {
          title: false,
          position: 'bottom',
          rowPadding: 5,
        },
      },
      animation: {
        appear: {
          animation: 'fade-in',
          duration: 1000,
        },
      },
      interaction: {
        tooltip: {
          render: (
            _e: unknown,
            { title, items }: { title: string; items: Array<{ name: string; value: string }> },
          ) => {
            return (
              <div>
                <h4>{title}</h4>
                {items.map((item) => (
                  <div key={item.name}>
                    {item.name}: ¥{Number(item.value).toLocaleString()}
                  </div>
                ))}
              </div>
            );
          },
        },
      },
    }),
    [categoryPieData],
  );

  const assetDebtPieConfig = useMemo(
    () => ({
      data: summary
        ? [
            { type: '总资产', value: summary.total_assets },
            { type: '总负债', value: summary.total_debt || 0.01 },
          ]
        : [],
      angleField: 'value',
      colorField: 'type',
      radius: 0.8,
      innerRadius: 0.6,
      color: ['#52c41a', '#ff4d4f'],
      label: {
        text: (d: { value: number }) => `¥${d.value.toLocaleString()}`,
        style: {
          fontWeight: 'bold',
          fontSize: 12,
        },
        position: 'spider' as const,
      },
      legend: {
        color: {
          title: false,
          position: 'bottom',
          rowPadding: 5,
        },
      },
      animation: {
        appear: {
          animation: 'fade-in',
          duration: 1000,
        },
      },
    }),
    [summary],
  );

  const assetCountPieConfig = useMemo(
    () => ({
      data: assetCountData,
      angleField: 'count',
      colorField: 'type',
      radius: 0.8,
      innerRadius: 0.6,
      label: {
        text: (d: { count: number }) => `${d.count}项`,
        style: {
          fontWeight: 'bold',
          fontSize: 12,
        },
        position: 'spider' as const,
      },
      legend: {
        color: {
          title: false,
          position: 'bottom',
          rowPadding: 5,
        },
      },
      animation: {
        appear: {
          animation: 'fade-in',
          duration: 1000,
        },
      },
    }),
    [assetCountData],
  );

  if (loading && !summary) {
    return (
      <PageContainer title="资产概览">
        <Skeleton active paragraph={{ rows: 8 }} />
      </PageContainer>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <PageContainer title="资产概览" subTitle="实时跟踪您的财务状况" ghost={false}>
        {/* 市场概况 */}
        <ProCard
          title="市场概况"
          headerBordered
          style={{ marginBottom: 24 }}
          extra={
            <Space>
              <Button
                icon={<ReloadOutlined spin={marketRefreshing} />}
                loading={marketRefreshing}
                onClick={handleRefreshMarket}
                size="small"
              >
                刷新
              </Button>
            </Space>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* 纳斯达克指数 */}
            {nasdaqQuote && (
              <div>
                <StatisticCard.Group direction="row">
                  <StatisticCard
                    statistic={{
                      title: '纳斯达克指数',
                      value: nasdaqQuote.price || 0,
                      precision: 2,
                      valueStyle: { fontSize: '24px' },
                    }}
                  />
                  <StatisticCard
                    statistic={{
                      title: '涨跌额',
                      value: Math.abs(nasdaqQuote.change || 0),
                      precision: 2,
                      valueStyle: {
                        color: (nasdaqQuote.change || 0) >= 0 ? '#52c41a' : '#ff4d4f',
                      },
                      prefix:
                        (nasdaqQuote.change || 0) >= 0 ? (
                          <ArrowUpOutlined />
                        ) : (
                          <ArrowDownOutlined />
                        ),
                    }}
                  />
                  <StatisticCard
                    statistic={{
                      title: '涨跌幅',
                      value: Math.abs(nasdaqQuote.changePercent || 0),
                      precision: 2,
                      valueStyle: {
                        color: (nasdaqQuote.changePercent || 0) >= 0 ? '#52c41a' : '#ff4d4f',
                      },
                      prefix: (nasdaqQuote.changePercent || 0) >= 0 ? '+' : '-',
                      suffix: '%',
                    }}
                  />
                </StatisticCard.Group>

                {/* K线图 */}
                <div style={{ marginTop: 16 }}>
                  {/* K线图控制器 */}
                  <div style={{ marginBottom: 12 }}>
                    {/* 主视图选择 */}
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
                        <Radio.Button value="all-sessions">全部分时</Radio.Button>
                        <Radio.Button value="5d">5日</Radio.Button>
                        <Radio.Button value="1d">日K</Radio.Button>
                        <Radio.Button value="1wk">周K</Radio.Button>
                        <Radio.Button value="1mo">月K</Radio.Button>
                        <Radio.Button value="3mo">季K</Radio.Button>
                        <Radio.Button value="1y">年K</Radio.Button>
                      </Radio.Group>
                      {mainViewMode === 'all-sessions' && (
                        <Space>
                          <span style={{ fontSize: '12px', color: '#666' }}>自动刷新</span>
                          <Switch
                            size="small"
                            checked={autoRefreshKline}
                            onChange={setAutoRefreshKline}
                          />
                        </Space>
                      )}
                    </div>

                    {/* 子时段选择（仅在全部分时模式下显示） */}
                    {mainViewMode === 'all-sessions' && (
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
                      </div>
                    )}
                  </div>

                  {/* K线图显示 */}
                  {klineLoading ? (
                    <Skeleton.Node active style={{ width: '100%', height: 300 }} />
                  ) : klineOption ? (
                    <ReactECharts option={klineOption} style={{ height: 300 }} />
                  ) : null}
                </div>
              </div>
            )}

            {/* 自选资产行情 */}
            {watchlist.length > 0 && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <h4 style={{ margin: 0 }}>自选关注</h4>
                  <Button type="link" size="small" onClick={() => navigate('/watchlist')}>
                    查看全部 →
                  </Button>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {watchlist.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleAssetClick(item)}
                      style={{
                        flex: '1 1 calc(33.333% - 12px)',
                        minWidth: '200px',
                        padding: '12px',
                        border:
                          expandedAssetId === item.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        background: expandedAssetId === item.id ? '#e6f7ff' : '#fff',
                        boxShadow:
                          expandedAssetId === item.id
                            ? '0 2px 12px rgba(24, 144, 255, 0.3)'
                            : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (expandedAssetId !== item.id) {
                          e.currentTarget.style.borderColor = '#1890ff';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 144, 255, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (expandedAssetId !== item.id) {
                          e.currentTarget.style.borderColor = '#f0f0f0';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px',
                        }}
                      >
                        <Space>
                          <strong>{item.symbol}</strong>
                          <Tag
                            color={
                              item.asset_type === 'crypto'
                                ? 'purple'
                                : item.asset_type === 'etf'
                                  ? 'cyan'
                                  : 'blue'
                            }
                            style={{ fontSize: '11px' }}
                          >
                            {item.asset_type?.toUpperCase()}
                          </Tag>
                        </Space>
                        {item.quote?.changePercent !== undefined && (
                          <Tag
                            color={item.quote.changePercent >= 0 ? 'success' : 'error'}
                            style={{ margin: 0 }}
                          >
                            {item.quote.changePercent >= 0 ? '+' : ''}
                            {item.quote.changePercent.toFixed(2)}%
                          </Tag>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{item.name}</div>
                      {item.quote?.price !== undefined && (
                        <div style={{ fontSize: '18px', fontWeight: 500, marginTop: '4px' }}>
                          ${item.quote.price.toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 展开的资产详情 */}
                {expandedAssetId !== null && (
                  <div
                    style={{
                      marginTop: '24px',
                      padding: '24px',
                      background: 'linear-gradient(135deg, #f5f7fa 0%, #fafbfc 100%)',
                      borderRadius: '12px',
                      border: '1px solid #d9d9d9',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      animation: 'fadeIn 0.3s ease-in',
                      position: 'relative',
                    }}
                  >
                    {assetLoading && assetInitialLoad ? (
                      <Skeleton active paragraph={{ rows: 8 }} />
                    ) : (
                      <>
                        {/* 加载指示器 - 仅在切换视图时显示 */}
                        {assetLoading && !assetInitialLoad && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '12px',
                              right: '12px',
                              zIndex: 10,
                            }}
                          >
                            <Skeleton.Button active size="small" />
                          </div>
                        )}
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                          {/* 标题栏with关闭按钮 */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingBottom: '12px',
                              borderBottom: '1px solid #e0e0e0',
                            }}
                          >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h3 style={{ margin: 0 }}>
                              {watchlist.find((item) => item.id === expandedAssetId)?.symbol} -{' '}
                              {watchlist.find((item) => item.id === expandedAssetId)?.name}
                            </h3>
                            {/* WebSocket 连接状态指示器 */}
                            {wsEnabled && (
                              <Tag
                                color={wsConnected ? 'success' : 'default'}
                                style={{ margin: 0 }}
                              >
                                {wsConnected ? '● 实时' : '○ 未连接'}
                              </Tag>
                            )}
                          </div>
                          <Button
                            size="small"
                            onClick={() => {
                              setExpandedAssetId(null);
                              setAssetQuote(null);
                              setAssetHistory(null);
                              setAssetInfo(null);
                              // 禁用 WebSocket
                              setWsEnabled(false);
                              setWsSymbol('');
                            }}
                          >
                            收起
                          </Button>
                        </div>

                        {/* 实时报价 */}
                        {assetQuote && (
                          <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} md={8}>
                              <Statistic
                                title="当前价格"
                                value={assetQuote.price}
                                precision={2}
                                prefix="$"
                                valueStyle={{
                                  color: (assetQuote.change || 0) >= 0 ? '#3f8600' : '#cf1322',
                                  fontSize: '28px',
                                }}
                              />
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                              <Statistic
                                title="涨跌幅"
                                value={assetQuote.change_percent}
                                precision={2}
                                suffix="%"
                                prefix={
                                  (assetQuote.change_percent || 0) >= 0 ? (
                                    <ArrowUpOutlined />
                                  ) : (
                                    <ArrowDownOutlined />
                                  )
                                }
                                valueStyle={{
                                  color:
                                    (assetQuote.change_percent || 0) >= 0 ? '#3f8600' : '#cf1322',
                                }}
                              />
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                              <Statistic
                                title="涨跌额"
                                value={Math.abs(assetQuote.change || 0)}
                                precision={2}
                                prefix={(assetQuote.change || 0) >= 0 ? '+' : '-'}
                                valueStyle={{
                                  color: (assetQuote.change || 0) >= 0 ? '#3f8600' : '#cf1322',
                                }}
                              />
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                              <Statistic
                                title="昨收"
                                value={assetQuote.previous_close}
                                precision={2}
                                prefix="$"
                              />
                            </Col>
                            {assetQuote.volume !== undefined && assetQuote.volume > 0 && (
                              <Col xs={24} sm={12} md={8}>
                                <Statistic
                                  title="成交量"
                                  value={assetQuote.volume}
                                  formatter={(value) => `${Number(value).toLocaleString()}`}
                                />
                              </Col>
                            )}
                            {assetQuote.market_cap !== undefined && assetQuote.market_cap > 0 && (
                              <Col xs={24} sm={12} md={8}>
                                <Statistic
                                  title="市值"
                                  value={assetQuote.market_cap}
                                  formatter={(value) =>
                                    `$${(Number(value) / 1000000000).toFixed(2)}B`
                                  }
                                />
                              </Col>
                            )}
                          </Row>
                        )}

                        {/* K线图 */}
                        <div>
                          <h4 style={{ marginBottom: '12px' }}>K线图</h4>

                          {/* 主视图选择 */}
                          <div style={{ marginBottom: '12px' }}>
                            {(() => {
                              const currentAsset = watchlist.find((item) => item.id === expandedAssetId);
                              const market = currentAsset?.symbol ? getMarketForSymbol(currentAsset.symbol) : 'US';
                              const isCrypto = market === 'CRYPTO';
                              const allSessionsLabel = isCrypto ? '行情' : '全部分时';

                              return (
                                <Radio.Group
                                  value={assetMainViewMode}
                                  onChange={(e) => setAssetMainViewMode(e.target.value as MainViewMode)}
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
                              );
                            })()}
                          </div>

                          {/* 子时段选择（仅在全部分时模式下显示，加密货币除外） */}
                          {assetMainViewMode === 'all-sessions' && (() => {
                            const currentAsset = watchlist.find((item) => item.id === expandedAssetId);
                            const market = currentAsset?.symbol ? getMarketForSymbol(currentAsset.symbol) : 'US';
                            const isCrypto = market === 'CRYPTO';

                            // 加密货币不显示时段选择，只显示实时更新状态
                            if (isCrypto) {
                              return wsConnected ? (
                                <div style={{ marginBottom: '12px' }}>
                                  <Tag color="success">● 实时更新</Tag>
                                </div>
                              ) : null;
                            }

                            // 股票等其他资产显示时段选择
                            return (
                              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '12px', color: '#666' }}>时段：</span>
                                <Select
                                  value={assetSubSession}
                                  onChange={(value) => setAssetSubSession(value as TradingSession)}
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
                            );
                          })()}
                          {assetKlineOption ? (
                            <div
                              style={{ background: '#fff', padding: '16px', borderRadius: '6px' }}
                            >
                              <ReactECharts option={assetKlineOption} style={{ height: 400 }} />
                            </div>
                          ) : (
                            <Skeleton.Node active style={{ width: '100%', height: 400 }} />
                          )}
                        </div>

                        {/* 详细信息 */}
                        {assetInfo && (
                          <div>
                            <h4 style={{ marginBottom: '12px' }}>详细信息</h4>
                            <div
                              style={{ background: '#fff', padding: '16px', borderRadius: '6px' }}
                            >
                              <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                                <Descriptions.Item label="名称">{assetInfo.name}</Descriptions.Item>
                                <Descriptions.Item label="代码">
                                  {assetInfo.symbol}
                                </Descriptions.Item>
                                {assetInfo.sector && (
                                  <Descriptions.Item label="行业">
                                    {assetInfo.sector}
                                  </Descriptions.Item>
                                )}
                                {assetInfo.industry && (
                                  <Descriptions.Item label="细分行业">
                                    {assetInfo.industry}
                                  </Descriptions.Item>
                                )}
                                {assetInfo.country && (
                                  <Descriptions.Item label="国家/地区">
                                    {assetInfo.country}
                                  </Descriptions.Item>
                                )}
                                {assetInfo.website && (
                                  <Descriptions.Item label="网站">
                                    <a href={assetInfo.website} target="_blank" rel="noreferrer">
                                      {assetInfo.website}
                                    </a>
                                  </Descriptions.Item>
                                )}
                              </Descriptions>
                              {assetInfo.description && (
                                <div style={{ marginTop: '12px', color: '#666', lineHeight: 1.6 }}>
                                  <strong>简介：</strong>
                                  {assetInfo.description}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 备注 */}
                        {watchlist.find((item) => item.id === expandedAssetId)?.notes && (
                          <div>
                            <h4 style={{ marginBottom: '12px' }}>备注</h4>
                            <div
                              style={{
                                background: '#fff',
                                padding: '16px',
                                borderRadius: '6px',
                                color: '#666',
                                lineHeight: 1.6,
                              }}
                            >
                              {watchlist.find((item) => item.id === expandedAssetId)?.notes}
                            </div>
                          </div>
                        )}
                      </Space>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </Space>
        </ProCard>

        {/* 统计卡片组 */}
        <StatisticCard.Group direction="row" style={{ marginBottom: 24 }}>
          <StatisticCard
            statistic={{
              title: '总资产',
              value: summary?.total_assets || 0,
              precision: 2,
              valueStyle: { color: '#3f8600' },
              prefix: <ArrowUpOutlined />,
              suffix: '元',
            }}
          />
          <StatisticCard
            statistic={{
              title: '总负债',
              value: summary?.total_debt || 0,
              precision: 2,
              valueStyle: { color: '#cf1322' },
              prefix: <ArrowDownOutlined />,
              suffix: '元',
            }}
          />
          <StatisticCard
            statistic={{
              title: '净资产',
              value: summary?.net_assets || 0,
              precision: 2,
              valueStyle: { color: '#1890ff' },
              prefix: <WalletOutlined />,
              suffix: '元',
            }}
          />
        </StatisticCard.Group>

        {/* 投资收益统计卡片组 */}
        {(stockAssets.length > 0 || cryptoAssets.length > 0) && (
          <StatisticCard.Group direction="row" style={{ marginBottom: 24 }}>
            <StatisticCard
              statistic={{
                title: '投资成本',
                value: investmentStats.totalCost,
                precision: 2,
                valueStyle: { color: '#8c8c8c' },
                suffix: '元',
                description: '股票 + 加密货币',
              }}
            />
            <StatisticCard
              statistic={{
                title: '投资市值',
                value: investmentStats.totalMarketValue,
                precision: 2,
                valueStyle: { color: '#1890ff' },
                suffix: '元',
              }}
            />
            <StatisticCard
              statistic={{
                title: '投资收益',
                value: Math.abs(investmentStats.totalProfit),
                precision: 2,
                valueStyle: {
                  color: investmentStats.isProfit ? '#52c41a' : '#ff4d4f',
                },
                prefix: investmentStats.isProfit ? <RiseOutlined /> : <FallOutlined />,
                suffix: '元',
                description: investmentStats.isProfit ? '盈利' : '亏损',
              }}
            />
            <StatisticCard
              statistic={{
                title: '收益率',
                value: Math.abs(investmentStats.profitRate),
                precision: 2,
                valueStyle: {
                  color: investmentStats.isProfit ? '#52c41a' : '#ff4d4f',
                },
                prefix: investmentStats.isProfit ? '+' : '-',
                suffix: '%',
              }}
            />
          </StatisticCard.Group>
        )}

        {/* 趋势图卡片 */}
        <ProCard
          title="净资产趋势"
          headerBordered
          style={{ marginBottom: 24 }}
          extra={
            <Segmented
              value={period}
              onChange={handlePeriodChange}
              options={[
                { label: '近7天', value: '7d' },
                { label: '近30天', value: '30d' },
                { label: '近90天', value: '90d' },
                { label: '近1年', value: '1y' },
              ]}
            />
          }
        >
          {history.length > 0 ? (
            <div style={{ height: 360 }}>
              <Line {...lineChartConfig} />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
              暂无历史数据
            </div>
          )}
        </ProCard>

        {/* 分布图卡片组 */}
        <ProCard ghost gutter={[24, 24]}>
          <ProCard colSpan={{ xs: 24, md: 12, xl: 8 }} title="资产分类分布" headerBordered>
            {categoryPieData.length > 0 ? (
              <div style={{ height: 280 }}>
                <Pie {...categoryPieConfig} />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                暂无分类数据
              </div>
            )}
          </ProCard>

          <ProCard colSpan={{ xs: 24, md: 12, xl: 8 }} title="资产负债对比" headerBordered>
            {summary ? (
              <div style={{ height: 280 }}>
                <Pie {...assetDebtPieConfig} />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>暂无数据</div>
            )}
          </ProCard>

          <ProCard colSpan={{ xs: 24, md: 12, xl: 8 }} title="资产数量分布" headerBordered>
            {assetCountData.length > 0 ? (
              <div style={{ height: 280 }}>
                <Pie {...assetCountPieConfig} />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                暂无资产数据
              </div>
            )}
          </ProCard>
        </ProCard>
      </PageContainer>
    </>
  );
}
