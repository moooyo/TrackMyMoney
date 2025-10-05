import { useEffect, useState, useMemo, useCallback } from 'react';
import { PageContainer, ProCard, StatisticCard } from '@ant-design/pro-components';
import { Radio, Segmented, Skeleton, Button, Tag } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
  BarChartOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useAssetsStore } from '@/stores/assetsStore';
import logger from '@/utils/logger';
import dayjs from 'dayjs';

type Dimension = 'daily' | 'weekly' | 'monthly';
type ViewType = 'calendar' | 'chart';
type DisplayMode = 'amount' | 'percentage';

export default function Statistics() {
  const statistics = useAssetsStore((state) => state.statistics);
  const loading = useAssetsStore((state) => state.loading);
  const fetchStatistics = useAssetsStore((state) => state.fetchStatistics);

  const [dimension, setDimension] = useState<Dimension>('daily');
  const [period, setPeriod] = useState<string>('30d');
  const [viewType, setViewType] = useState<ViewType>('calendar');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('amount');
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  // 加载数据
  useEffect(() => {
    fetchStatistics(dimension, period);
  }, [dimension, period, fetchStatistics]);

  // 维度切换处理
  const handleDimensionChange = useCallback((value: Dimension) => {
    logger.info(`Dimension changed to: ${value}`);
    setDimension(value);
  }, []);

  // 时段切换处理
  const handlePeriodChange = useCallback((value: string | number) => {
    logger.info(`Period changed to: ${value}`);
    setPeriod(value as string);
  }, []);

  // 月份切换
  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => prev.subtract(1, 'month'));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => prev.add(1, 'month'));
  }, []);

  // 计算统计指标
  const statsMetrics = useMemo(() => {
    if (!statistics || statistics.length === 0) {
      return {
        totalProfit: 0,
        avgProfit: 0,
        maxProfit: 0,
        minProfit: 0,
        totalProfitRate: 0,
        avgProfitRate: 0,
        maxProfitRate: 0,
        positiveCount: 0,
        negativeCount: 0,
      };
    }

    const profits = statistics.slice(1).map((item) => item.profit || 0);
    const profitRates = statistics.slice(1).map((item) => item.profit_rate || 0);

    const totalProfit = profits.reduce((sum, p) => sum + p, 0);
    const avgProfit = totalProfit / profits.length;
    const maxProfit = Math.max(...profits);
    const minProfit = Math.min(...profits);

    const avgProfitRate = profitRates.reduce((sum, r) => sum + r, 0) / profitRates.length;
    const maxProfitRate = Math.max(...profitRates);

    const positiveCount = profits.filter((p) => p > 0).length;
    const negativeCount = profits.filter((p) => p < 0).length;

    const firstValue = statistics[0]?.total_assets || 0;
    const lastValue = statistics[statistics.length - 1]?.total_assets || 0;
    const totalProfitRate = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    return {
      totalProfit,
      avgProfit,
      maxProfit,
      minProfit,
      totalProfitRate,
      avgProfitRate,
      maxProfitRate,
      positiveCount,
      negativeCount,
    };
  }, [statistics]);

  // 生成日历数据
  const calendarData = useMemo(() => {
    if (!statistics || statistics.length <= 1) return [];

    const monthStart = currentMonth.startOf('month');
    const monthEnd = currentMonth.endOf('month');
    const calendarStart = monthStart.startOf('week');
    const calendarEnd = monthEnd.endOf('week');

    const days = [];
    let current = calendarStart;

    while (current.isBefore(calendarEnd) || current.isSame(calendarEnd, 'day')) {
      const dateStr = current.format('YYYY-MM-DD');

      // 根据维度查找对应的数据点
      let dataPoint;
      if (dimension === 'daily') {
        dataPoint = statistics.find((item) => item.date === dateStr);
      } else if (dimension === 'weekly') {
        // 周维度：找到包含当前日期的那一周的数据
        dataPoint = statistics.find((item) => {
          const itemDate = dayjs(item.date);
          const weekStart = itemDate.startOf('week');
          const weekEnd = itemDate.endOf('week');
          return current.isSameOrAfter(weekStart, 'day') && current.isSameOrBefore(weekEnd, 'day');
        });
      } else if (dimension === 'monthly') {
        // 月维度：找到当前日期所在月份的数据
        dataPoint = statistics.find((item) => {
          const itemDate = dayjs(item.date);
          return current.year() === itemDate.year() && current.month() === itemDate.month();
        });
      }

      days.push({
        date: current.toDate(),
        dateStr,
        isCurrentMonth: current.month() === currentMonth.month(),
        isToday: current.isSame(dayjs(), 'day'),
        profit: dataPoint?.profit || 0,
        profitRate: dataPoint?.profit_rate || 0,
      });

      current = current.add(1, 'day');
    }

    return days;
  }, [statistics, currentMonth, dimension]);

  // 计算颜色 - 根据参考图片的配色方案
  const getColor = useCallback((profit: number) => {
    if (profit === 0) return '#FAFAFA'; // 无数据 - 浅灰色
    if (profit > 0) return '#FFE5E5'; // 盈利 - 浅粉色
    return '#D9F7E8'; // 亏损 - 浅绿色
  }, []);

  // 计算文字颜色
  const getTextColor = useCallback((profit: number, isToday: boolean) => {
    if (isToday) return '#FFFFFF'; // 当日 - 白色
    if (profit === 0) return '#BFBFBF'; // 无数据 - 灰色
    if (profit > 0) return '#FF4D4F'; // 盈利 - 红色
    return '#00B578'; // 亏损 - 深绿色
  }, []);

  // 资产趋势图表配置
  const assetsChartOption = useMemo(() => {
    if (!statistics || statistics.length === 0) return null;

    const dates = statistics.map((item) => item.date);
    const totalAssets = statistics.map((item) => item.total_assets || 0);
    const netAssets = statistics.map((item) => item.net_assets || 0);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['总资产', '净资产'],
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '12%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          rotate: dimension === 'daily' ? 45 : 0,
        },
      },
      yAxis: {
        type: 'value',
        name: '金额(元)',
      },
      series: [
        {
          name: '总资产',
          type: 'line',
          data: totalAssets,
          smooth: true,
          itemStyle: {
            color: '#1890ff',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
              ],
            },
          },
        },
        {
          name: '净资产',
          type: 'line',
          data: netAssets,
          smooth: true,
          itemStyle: {
            color: '#52c41a',
          },
        },
      ],
    };
  }, [statistics, dimension]);

  // 收益趋势图表配置
  const profitChartOption = useMemo(() => {
    if (!statistics || statistics.length <= 1) return null;

    const data = statistics.slice(1);
    const dates = data.map((item) => item.date);
    const profits = data.map((item) => item.profit || 0);
    const profitRates = data.map((item) => item.profit_rate || 0);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['收益', '收益率'],
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '12%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          rotate: dimension === 'daily' ? 45 : 0,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '收益(元)',
          position: 'left',
        },
        {
          type: 'value',
          name: '收益率(%)',
          position: 'right',
        },
      ],
      series: [
        {
          name: '收益',
          type: 'bar',
          yAxisIndex: 0,
          data: profits,
          itemStyle: {
            color: (params: { value: number }) => (params.value >= 0 ? '#ff4d4f' : '#52c41a'),
          },
        },
        {
          name: '收益率',
          type: 'line',
          yAxisIndex: 1,
          data: profitRates,
          smooth: true,
          itemStyle: {
            color: '#faad14',
          },
        },
      ],
    };
  }, [statistics, dimension]);

  if (loading && statistics.length === 0) {
    return (
      <PageContainer title="收益统计">
        <Skeleton active paragraph={{ rows: 8 }} />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="收益统计" subTitle="按不同维度分析您的资产收益情况">
      {/* 统计卡片组 */}
      <StatisticCard.Group direction="row" style={{ marginBottom: 24 }}>
        <StatisticCard
          statistic={{
            title: '总收益',
            value: Math.abs(statsMetrics.totalProfit),
            precision: 2,
            valueStyle: {
              color: statsMetrics.totalProfit >= 0 ? '#ff4d4f' : '#52c41a',
            },
            prefix: statsMetrics.totalProfit >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />,
            suffix: '元',
          }}
        />
        <StatisticCard
          statistic={{
            title: '总收益率',
            value: Math.abs(statsMetrics.totalProfitRate),
            precision: 2,
            valueStyle: {
              color: statsMetrics.totalProfitRate >= 0 ? '#ff4d4f' : '#52c41a',
            },
            prefix: statsMetrics.totalProfitRate >= 0 ? '+' : '-',
            suffix: '%',
          }}
        />
        <StatisticCard
          statistic={{
            title: `平均${dimension === 'daily' ? '日' : dimension === 'weekly' ? '周' : '月'}收益`,
            value: Math.abs(statsMetrics.avgProfit),
            precision: 2,
            valueStyle: {
              color: statsMetrics.avgProfit >= 0 ? '#ff4d4f' : '#52c41a',
            },
            suffix: '元',
          }}
        />
        <StatisticCard
          statistic={{
            title: `最大${dimension === 'daily' ? '日' : dimension === 'weekly' ? '周' : '月'}收益`,
            value: Math.abs(statsMetrics.maxProfit),
            precision: 2,
            valueStyle: { color: '#1890ff' },
            suffix: '元',
          }}
        />
      </StatisticCard.Group>

      {/* 资产趋势 */}
      <ProCard
        title="资产趋势"
        headerBordered
        style={{ marginBottom: 24 }}
        extra={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Segmented
              value={period}
              onChange={handlePeriodChange}
              options={[
                { label: '7天', value: '7d' },
                { label: '30天', value: '30d' },
                { label: '90天', value: '90d' },
                { label: '1年', value: '1y' },
              ]}
            />
          </div>
        }
      >
        {assetsChartOption ? (
          <ReactECharts option={assetsChartOption} style={{ height: 350 }} />
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
            暂无数据
          </div>
        )}
      </ProCard>

      {/* 收益分布 */}
      <ProCard
        title="收益分布"
        headerBordered
      >
        {/* 视图切换控制栏 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Radio.Group
              value={viewType}
              onChange={(e) => setViewType(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="calendar">
                <CalendarOutlined /> 日历
              </Radio.Button>
              <Radio.Button value="chart">
                <BarChartOutlined /> 图表
              </Radio.Button>
            </Radio.Group>

            <Radio.Group value={dimension} onChange={(e) => handleDimensionChange(e.target.value)}>
              <Radio.Button value="daily">日</Radio.Button>
              <Radio.Button value="weekly">周</Radio.Button>
              <Radio.Button value="monthly">月</Radio.Button>
            </Radio.Group>

            <Radio.Group value={displayMode} onChange={(e) => setDisplayMode(e.target.value)}>
              <Radio.Button value="amount">¥</Radio.Button>
              <Radio.Button value="percentage">%</Radio.Button>
            </Radio.Group>
          </div>

          {/* 月份导航（仅日历视图显示） */}
          {viewType === 'calendar' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Button
                type="text"
                icon={<LeftOutlined />}
                onClick={handlePrevMonth}
                size="small"
              />
              <Tag color="blue" style={{ margin: 0, fontSize: 14, padding: '4px 12px' }}>
                {currentMonth.format('YYYY年MM月')}
              </Tag>
              <Button
                type="text"
                icon={<RightOutlined />}
                onClick={handleNextMonth}
                size="small"
              />
            </div>
          )}
        </div>

        {/* 内容区域 */}
        {viewType === 'calendar' ? (
          /* 日历视图 */
          <div>
            {/* 星期标题 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 8,
                marginBottom: 8,
              }}
            >
              {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                <div
                  key={day}
                  style={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#666',
                    padding: '8px 0',
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 日历网格 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 8,
              }}
            >
              {calendarData.map((day) => {
                const displayValue =
                  displayMode === 'amount'
                    ? day.profit === 0
                      ? '0.00'
                      : (day.profit > 0 ? '+' : '') + day.profit.toFixed(2)
                    : day.profitRate === 0
                      ? '0.00%'
                      : (day.profitRate > 0 ? '+' : '') + day.profitRate.toFixed(2) + '%';

                return (
                  <div
                    key={day.dateStr}
                    style={{
                      backgroundColor: day.isToday ? '#E3342F' : getColor(day.profit),
                      borderRadius: 8,
                      padding: 12,
                      minHeight: 70,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      opacity: day.isCurrentMonth ? 1 : 0.4,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: '1px solid #f0f0f0',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 'bold',
                        color: getTextColor(day.profit, day.isToday),
                      }}
                    >
                      {dayjs(day.date).date()}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: getTextColor(day.profit, day.isToday),
                        fontWeight: 500,
                        textAlign: 'right',
                      }}
                    >
                      {displayValue}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* 图表视图 */
          <div>
            {profitChartOption ? (
              <ReactECharts option={profitChartOption} style={{ height: 400 }} />
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                暂无数据
              </div>
            )}
          </div>
        )}
      </ProCard>
    </PageContainer>
  );
}
