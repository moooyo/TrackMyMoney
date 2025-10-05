import { useState, useEffect } from 'react';
import {
  message,
  Input,
  Empty,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Spin,
  List,
  Typography,
  Button,
  Modal,
} from 'antd';
import {
  ProCard,
  StatisticCard,
  PageContainer,
  ProFormText,
  ProFormTextArea,
  ProFormSelect,
  ModalForm,
} from '@ant-design/pro-components';
import {
  SearchOutlined,
  StockOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { marketService } from '@/services/MarketService';
import { useWatchlistStore } from '@/stores';
import { useNavigate } from 'react-router-dom';
import type {
  ModelsQuote,
  ModelsInfoResponse,
  ModelsSearchResult,
  HandlersCreateWatchlistRequest,
} from '@/types/generated/Api';
import type { WatchlistWithQuote } from '@/services/WatchlistService';
import logger from '@/utils/logger';
import KLineChart from '@/components/KLineChart';

const { Text } = Typography;

export default function Watchlist() {
  const navigate = useNavigate();
  const { watchlist, fetchWatchlistWithQuotes, createItem, deleteItem } = useWatchlistStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<ModelsSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

  const [selectedItem, setSelectedItem] = useState<WatchlistWithQuote | null>(null);
  const [quote, setQuote] = useState<ModelsQuote | null>(null);
  const [info, setInfo] = useState<ModelsInfoResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // 初始加载自选列表
  useEffect(() => {
    fetchWatchlistWithQuotes();
  }, [fetchWatchlistWithQuotes]);

  // 自动选择第一个自选或显示纳斯达克
  useEffect(() => {
    const loadDefaultItem = async () => {
      if (selectedItem) return; // 已经有选中项，不重复加载

      if (watchlist.length > 0) {
        // 有自选列表，选择第一个
        const firstItem = watchlist[0];
        setSelectedItem(firstItem);
        setLoading(true);
        try {
          const [quoteData, infoData] = await Promise.all([
            marketService.getQuote(firstItem.symbol || ''),
            marketService.getInfo(firstItem.symbol || ''),
          ]);
          setQuote(quoteData);
          setInfo(infoData);
        } catch (error) {
          logger.error('Failed to fetch default market data', error);
        } finally {
          setLoading(false);
        }
      } else if (watchlist.length === 0 && !loading) {
        // 没有自选列表，显示纳斯达克
        const nasdaqSymbol = '^IXIC';
        setLoading(true);
        try {
          const [quoteData, infoData] = await Promise.all([
            marketService.getQuote(nasdaqSymbol),
            marketService.getInfo(nasdaqSymbol),
          ]);
          setSelectedItem({
            symbol: nasdaqSymbol,
            name: 'NASDAQ Composite',
            asset_type: 'index',
          } as WatchlistWithQuote);
          setQuote(quoteData);
          setInfo(infoData);
        } catch (error) {
          logger.error('Failed to fetch NASDAQ data', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadDefaultItem();
  }, [watchlist, selectedItem, loading]);

  // 搜索股票/加密货币
  const handleSearch = async (value: string) => {
    if (!value || value.length < 1) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const response = await marketService.search(value);
      setSearchResults(response.results || []);
    } catch (error) {
      logger.error('Search failed', error);
      message.error('搜索失败');
    } finally {
      setSearching(false);
    }
  };

  // 从搜索结果选择
  const handleSelectFromSearch = async (result: ModelsSearchResult) => {
    setLoading(true);
    try {
      const [quoteData, infoData] = await Promise.all([
        marketService.getQuote(result.symbol || ''),
        marketService.getInfo(result.symbol || ''),
      ]);

      setSelectedItem({
        symbol: result.symbol,
        name: result.name,
        asset_type: result.asset_type,
      } as WatchlistWithQuote);
      setQuote(quoteData);
      setInfo(infoData);
      setSearchKeyword('');
      setSearchResults([]);
    } catch (error) {
      logger.error('Failed to fetch market data', error);
      message.error('获取行情数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 从自选列表选择
  const handleSelectFromWatchlist = async (item: WatchlistWithQuote) => {
    if (selectedItem?.symbol === item.symbol) {
      // 如果点击的是当前选中项，不做任何操作
      return;
    }

    setSelectedItem(item);
    setLoading(true);
    try {
      const [quoteData, infoData] = await Promise.all([
        marketService.getQuote(item.symbol || ''),
        marketService.getInfo(item.symbol || ''),
      ]);
      setQuote(quoteData);
      setInfo(infoData);
    } catch (error) {
      logger.error('Failed to fetch market data', error);
      message.error('获取行情数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 关注切换
  const handleWatchToggle = async () => {
    if (!selectedItem?.symbol) return;

    const isWatched = watchlist.some((item) => item.symbol === selectedItem.symbol);

    try {
      if (isWatched) {
        // 取消关注
        const item = watchlist.find((w) => w.symbol === selectedItem.symbol);
        if (item?.id) {
          await deleteItem(item.id);
          message.success('已取消关注');

          // 刷新列表后，选择下一个自选或显示纳斯达克
          await fetchWatchlistWithQuotes();

          // 等待列表更新后，重新设置选中项
          setTimeout(async () => {
            const updatedList = watchlist.filter((w) => w.id !== item.id);
            if (updatedList.length > 0) {
              // 选择第一个自选
              const nextItem = updatedList[0];
              setSelectedItem(nextItem);
              setLoading(true);
              try {
                const [quoteData, infoData] = await Promise.all([
                  marketService.getQuote(nextItem.symbol || ''),
                  marketService.getInfo(nextItem.symbol || ''),
                ]);
                setQuote(quoteData);
                setInfo(infoData);
              } catch (error) {
                logger.error('Failed to fetch next item data', error);
              } finally {
                setLoading(false);
              }
            } else {
              // 显示纳斯达克
              const nasdaqSymbol = '^IXIC';
              setLoading(true);
              try {
                const [quoteData, infoData] = await Promise.all([
                  marketService.getQuote(nasdaqSymbol),
                  marketService.getInfo(nasdaqSymbol),
                ]);
                setSelectedItem({
                  symbol: nasdaqSymbol,
                  name: 'NASDAQ Composite',
                  asset_type: 'index',
                } as WatchlistWithQuote);
                setQuote(quoteData);
                setInfo(infoData);
              } catch (error) {
                logger.error('Failed to fetch NASDAQ data', error);
              } finally {
                setLoading(false);
              }
            }
          }, 100);
        }
      } else {
        // 添加关注
        await createItem({
          symbol: selectedItem.symbol || '',
          name: selectedItem.name || '',
          asset_type: selectedItem.asset_type || 'stock',
          notes: '',
        });
        message.success('已添加关注');
        await fetchWatchlistWithQuotes();
      }
    } catch (error) {
      logger.error('Failed to toggle watch', error);
      message.error('操作失败');
    }
  };

  // 快速建仓
  const handleQuickTrade = () => {
    if (!selectedItem?.symbol) {
      message.error('请先选择一个股票或加密货币');
      return;
    }
    const assetType = selectedItem.asset_type === 'crypto' ? 'crypto' : 'stock';
    navigate(`/assets?type=${assetType}&symbol=${selectedItem.symbol}`);
  };

  // 删除自选
  const handleDeleteWatchlist = async (item: WatchlistWithQuote) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要从自选中移除 "${item.name}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          if (item.id) {
            await deleteItem(item.id);
            message.success('删除成功');
            await fetchWatchlistWithQuotes();

            // 如果删除的是当前选中项，选择下一个自选或显示纳斯达克
            if (selectedItem?.symbol === item.symbol) {
              setTimeout(async () => {
                const updatedList = watchlist.filter((w) => w.id !== item.id);
                if (updatedList.length > 0) {
                  // 选择第一个自选
                  const nextItem = updatedList[0];
                  setSelectedItem(nextItem);
                  setLoading(true);
                  try {
                    const [quoteData, infoData] = await Promise.all([
                      marketService.getQuote(nextItem.symbol || ''),
                      marketService.getInfo(nextItem.symbol || ''),
                    ]);
                    setQuote(quoteData);
                    setInfo(infoData);
                  } catch (error) {
                    logger.error('Failed to fetch next item data', error);
                  } finally {
                    setLoading(false);
                  }
                } else {
                  // 显示纳斯达克
                  const nasdaqSymbol = '^IXIC';
                  setLoading(true);
                  try {
                    const [quoteData, infoData] = await Promise.all([
                      marketService.getQuote(nasdaqSymbol),
                      marketService.getInfo(nasdaqSymbol),
                    ]);
                    setSelectedItem({
                      symbol: nasdaqSymbol,
                      name: 'NASDAQ Composite',
                      asset_type: 'index',
                    } as WatchlistWithQuote);
                    setQuote(quoteData);
                    setInfo(infoData);
                  } catch (error) {
                    logger.error('Failed to fetch NASDAQ data', error);
                  } finally {
                    setLoading(false);
                  }
                }
              }, 100);
            }
          }
        } catch {
          message.error('删除失败');
        }
      },
    });
  };

  // 判断是否已关注
  const isWatched = watchlist.some((item) => item.symbol === selectedItem?.symbol);

  return (
    <PageContainer title="自选关注" subTitle="追踪您关注的股票、ETF、加密货币">
      <Row gutter={[24, 24]}>
        {/* 左侧：搜索 + 自选列表 */}
        <Col xs={24} md={8} lg={6}>
          <Card
            title={
              <Space>
                <StockOutlined style={{ color: '#1890ff' }} />
                <span>自选列表</span>
              </Space>
            }
            extra={
              <Button
                type="link"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setAddModalVisible(true)}
              >
                添加
              </Button>
            }
            bodyStyle={{ padding: '16px' }}
            style={{
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* 搜索框 */}
              <Input
                placeholder="搜索股票、ETF、加密货币..."
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  handleSearch(e.target.value);
                }}
                allowClear
                size="large"
                style={{ borderRadius: '8px' }}
              />

              {/* 搜索结果 */}
              {searching ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Spin size="large" tip="搜索中..." />
                </div>
              ) : searchResults.length > 0 ? (
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', marginBottom: '8px' }}>
                    搜索结果
                  </Text>
                  <List
                    size="small"
                    dataSource={searchResults.slice(0, 5)}
                    style={{ maxHeight: '30vh', overflowY: 'auto', overflowX: 'hidden' }}
                    renderItem={(item) => (
                      <List.Item
                        onClick={() => handleSelectFromSearch(item)}
                        style={{
                          cursor: 'pointer',
                          padding: '12px',
                          borderRadius: '8px',
                          marginBottom: '8px',
                          border: '1px solid #f0f0f0',
                          transition: 'all 0.3s ease',
                          overflow: 'hidden',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <List.Item.Meta
                          style={{ overflow: 'hidden', width: '100%' }}
                          avatar={
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: '8px',
                                background:
                                  item.asset_type === 'crypto'
                                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                    : item.asset_type === 'etf'
                                      ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                                      : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '16px',
                              }}
                            >
                              {item.symbol?.charAt(0)}
                            </div>
                          }
                          title={
                            <div
                              style={{
                                overflow: 'hidden',
                                width: '100%',
                              }}
                            >
                              <Text
                                strong
                                style={{
                                  fontSize: '14px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-block',
                                  maxWidth: '60%',
                                  verticalAlign: 'middle',
                                }}
                              >
                                {item.symbol}
                              </Text>
                              <Tag
                                style={{
                                  marginLeft: '8px',
                                  fontSize: '11px',
                                  borderRadius: '4px',
                                }}
                                color={
                                  item.asset_type === 'crypto'
                                    ? 'purple'
                                    : item.asset_type === 'etf'
                                      ? 'magenta'
                                      : 'blue'
                                }
                              >
                                {item.asset_type?.toUpperCase()}
                              </Tag>
                            </div>
                          }
                          description={
                            <div>
                              <div
                                style={{
                                  fontSize: '12px',
                                  color: '#595959',
                                  marginBottom: '2px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item.name}
                              </div>
                              <Text type="secondary" style={{ fontSize: '11px' }}>
                                {item.exchange}
                              </Text>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </div>
              ) : null}

              {/* 自选列表 */}
              {!searchKeyword && (
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', marginBottom: '8px' }}>
                    我的自选 ({watchlist.length})
                  </Text>
                  {watchlist.length > 0 ? (
                    <List
                      size="small"
                      dataSource={watchlist}
                      style={{ maxHeight: '60vh', overflowY: 'auto', overflowX: 'hidden' }}
                      renderItem={(item) => (
                        <List.Item
                          onClick={() => handleSelectFromWatchlist(item)}
                          style={{
                            cursor: 'pointer',
                            backgroundColor:
                              selectedItem?.symbol === item.symbol ? '#e6f4ff' : 'transparent',
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            border:
                              selectedItem?.symbol === item.symbol
                                ? '2px solid #1890ff'
                                : '1px solid #f0f0f0',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                          onMouseEnter={(e) => {
                            if (selectedItem?.symbol !== item.symbol) {
                              e.currentTarget.style.backgroundColor = '#f5f5f5';
                              e.currentTarget.style.transform = 'translateX(4px)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedItem?.symbol !== item.symbol) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.transform = 'translateX(0)';
                            }
                          }}
                        >
                          <List.Item.Meta
                            style={{ overflow: 'hidden', width: '100%' }}
                            avatar={
                              <div
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '8px',
                                  background:
                                    item.asset_type === 'crypto'
                                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                      : item.asset_type === 'etf'
                                        ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                                        : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '16px',
                                }}
                              >
                                {item.symbol?.charAt(0)}
                              </div>
                            }
                            title={
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  width: '100%',
                                }}
                              >
                                <div
                                  style={{
                                    flex: 1,
                                    overflow: 'hidden',
                                    marginRight: '8px',
                                  }}
                                >
                                  <Text
                                    strong
                                    style={{
                                      fontSize: '14px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      display: 'inline-block',
                                      maxWidth: '60%',
                                      verticalAlign: 'middle',
                                    }}
                                  >
                                    {item.symbol}
                                  </Text>
                                  <Tag
                                    style={{
                                      marginLeft: '8px',
                                      fontSize: '11px',
                                      borderRadius: '4px',
                                    }}
                                    color={
                                      item.asset_type === 'crypto'
                                        ? 'purple'
                                        : item.asset_type === 'etf'
                                          ? 'magenta'
                                          : 'blue'
                                    }
                                  >
                                    {item.asset_type?.toUpperCase()}
                                  </Tag>
                                </div>
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteWatchlist(item);
                                  }}
                                  style={{ flexShrink: 0 }}
                                />
                              </div>
                            }
                            description={
                              <div>
                                <div
                                  style={{
                                    fontSize: '12px',
                                    color: '#595959',
                                    marginBottom: '4px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {item.name}
                                </div>
                                {item.quote?.price !== undefined && (
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      width: '100%',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    <Text
                                      strong
                                      style={{
                                        fontSize: '14px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1,
                                        marginRight: '8px',
                                      }}
                                    >
                                      ${item.quote.price.toFixed(2)}
                                    </Text>
                                    {item.quote?.changePercent !== undefined && (
                                      <Tag
                                        color={item.quote.changePercent >= 0 ? 'success' : 'error'}
                                        style={{
                                          margin: 0,
                                          fontSize: '11px',
                                          flexShrink: 0,
                                        }}
                                      >
                                        {item.quote.changePercent >= 0 ? '+' : ''}
                                        {item.quote.changePercent.toFixed(2)}%
                                      </Tag>
                                    )}
                                  </div>
                                )}
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <Space direction="vertical" size="small">
                          <Text type="secondary">暂无自选</Text>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            使用搜索框添加关注
                          </Text>
                        </Space>
                      }
                    />
                  )}
                </div>
              )}
            </Space>
          </Card>
        </Col>

        {/* 右侧：K线图 + 详情 */}
        <Col xs={24} md={16} lg={18}>
          {loading ? (
            <Card
              style={{
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                minHeight: '400px',
              }}
            >
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" tip="加载行情数据中..." />
              </div>
            </Card>
          ) : selectedItem ? (
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 标题栏 */}
              <Card
                bodyStyle={{ padding: '16px 24px' }}
                style={{
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              >
                <Row justify="space-between" align="middle">
                  <Col>
                    <Space>
                      <h2 style={{ margin: 0 }}>
                        {info?.name || selectedItem.name}
                        <span style={{ fontSize: '16px', color: '#666', marginLeft: '12px' }}>
                          {selectedItem.symbol}
                        </span>
                      </h2>
                      <Tag
                        color={selectedItem.asset_type === 'crypto' ? 'purple' : 'blue'}
                        style={{ fontSize: '12px' }}
                      >
                        {selectedItem.asset_type?.toUpperCase()}
                      </Tag>
                    </Space>
                  </Col>
                  <Col>
                    <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleQuickTrade}>
                      快速建仓
                    </Button>
                  </Col>
                </Row>
              </Card>

              {/* 实时报价 */}
              {quote && (
                <StatisticCard.Group
                  direction="row"
                  style={{
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <StatisticCard
                    statistic={{
                      title: '最新价',
                      value: quote.price || 0,
                      precision: 2,
                      valueStyle: { fontSize: '32px' },
                      prefix: '$',
                    }}
                  />
                  <StatisticCard
                    statistic={{
                      title: '涨跌额',
                      value: Math.abs(quote.change || 0),
                      precision: 2,
                      valueStyle: {
                        color: (quote.change || 0) >= 0 ? '#52c41a' : '#ff4d4f',
                      },
                      prefix:
                        (quote.change || 0) >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />,
                    }}
                  />
                  <StatisticCard
                    statistic={{
                      title: '涨跌幅',
                      value: Math.abs(quote.changePercent || 0),
                      precision: 2,
                      valueStyle: {
                        color: (quote.changePercent || 0) >= 0 ? '#52c41a' : '#ff4d4f',
                      },
                      prefix: (quote.changePercent || 0) >= 0 ? '+' : '-',
                      suffix: '%',
                    }}
                  />
                  <StatisticCard
                    statistic={{
                      title: '成交量',
                      value:
                        quote.volume && quote.volume >= 1000000
                          ? (quote.volume / 1000000).toFixed(2)
                          : quote.volume && quote.volume >= 1000
                            ? (quote.volume / 1000).toFixed(2)
                            : quote.volume || 0,
                      suffix:
                        quote.volume && quote.volume >= 1000000
                          ? 'M'
                          : quote.volume && quote.volume >= 1000
                            ? 'K'
                            : '',
                    }}
                  />
                </StatisticCard.Group>
              )}

              {/* K线图 */}
              <ProCard
                title="价格走势"
                headerBordered
                style={{
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              >
                <KLineChart
                  symbol={selectedItem.symbol || ''}
                  assetType={selectedItem.asset_type || 'stock'}
                  isWatched={isWatched}
                  onWatchToggle={handleWatchToggle}
                  showWatchButton={true}
                  quote={quote}
                  onQuoteUpdate={setQuote}
                />
              </ProCard>

              {/* 基本信息 */}
              {info && (
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <ProCard
                      title="基本信息"
                      headerBordered
                      style={{
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        height: '100%',
                      }}
                    >
                      <Statistic title="交易所" value={info.exchange || '-'} />
                      <Statistic
                        title="行业"
                        value={info.sector || '-'}
                        style={{ marginTop: 16 }}
                      />
                      <Statistic
                        title="板块"
                        value={info.industry || '-'}
                        style={{ marginTop: 16 }}
                      />
                      {info.country && (
                        <Statistic title="国家" value={info.country} style={{ marginTop: 16 }} />
                      )}
                    </ProCard>
                  </Col>
                  <Col xs={24} md={12}>
                    <ProCard
                      title="价格区间"
                      headerBordered
                      style={{
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        height: '100%',
                      }}
                    >
                      {quote && (
                        <>
                          <Statistic title="今日最高" value={quote.high || 0} prefix="$" />
                          <Statistic
                            title="今日最低"
                            value={quote.low || 0}
                            prefix="$"
                            style={{ marginTop: 16 }}
                          />
                          <Statistic
                            title="开盘价"
                            value={quote.open || 0}
                            prefix="$"
                            style={{ marginTop: 16 }}
                          />
                          <Statistic
                            title="昨收价"
                            value={quote.previousClose || 0}
                            prefix="$"
                            style={{ marginTop: 16 }}
                          />
                        </>
                      )}
                    </ProCard>
                  </Col>
                  {info.description && (
                    <Col xs={24}>
                      <ProCard
                        title="公司简介"
                        headerBordered
                        style={{
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        }}
                      >
                        <p style={{ color: '#666', lineHeight: '1.8' }}>{info.description}</p>
                        {info.website && (
                          <p style={{ marginTop: 16 }}>
                            <strong>官网：</strong>
                            <a href={info.website} target="_blank" rel="noopener noreferrer">
                              {info.website}
                            </a>
                          </p>
                        )}
                      </ProCard>
                    </Col>
                  )}
                </Row>
              )}
            </Space>
          ) : null}
        </Col>
      </Row>

      {/* 添加自选弹窗 */}
      <ModalForm
        title="添加自选"
        open={addModalVisible}
        onOpenChange={setAddModalVisible}
        width={600}
        onFinish={async (values: HandlersCreateWatchlistRequest) => {
          try {
            await createItem(values);
            message.success('添加成功');
            await fetchWatchlistWithQuotes();
            return true;
          } catch {
            message.error('添加失败');
            return false;
          }
        }}
      >
        <ProFormText
          name="symbol"
          label="代码"
          placeholder="如: AAPL, BTC-USD"
          rules={[{ required: true, message: '请输入代码' }]}
        />
        <ProFormText
          name="name"
          label="名称"
          placeholder="如: Apple Inc."
          rules={[{ required: true, message: '请输入名称' }]}
        />
        <ProFormSelect
          name="asset_type"
          label="类型"
          options={[
            { label: '股票', value: 'stock' },
            { label: 'ETF', value: 'etf' },
            { label: '加密货币', value: 'crypto' },
          ]}
          rules={[{ required: true, message: '请选择类型' }]}
        />
        <ProFormTextArea
          name="notes"
          label="备注"
          placeholder="添加备注信息（可选）"
          fieldProps={{ rows: 3 }}
        />
      </ModalForm>
    </PageContainer>
  );
}
