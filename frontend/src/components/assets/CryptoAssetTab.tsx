import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import { message, Modal, Empty, Space, Button, Tag, Tooltip } from 'antd';
import {
  ProTable,
  ModalForm,
  ProFormText,
  ProFormDigit,
  ProFormTextArea,
  ProFormSelect,
} from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  EditOutlined,
  DeleteOutlined,
  InboxOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useCryptoAssetStore } from '@/stores';
import type {
  ModelsCryptoAsset,
  HandlersCreateCryptoAssetRequest,
} from '@/types/generated/data-contracts';
import logger from '@/utils/logger';
import { marketService } from '@/services/MarketService';
import cryptoAssetService from '@/services/CryptoAssetService';

const CryptoAssetTab = forwardRef<{ openCreateModal: () => void }>((_, ref) => {
  const actionRef = useRef<ActionType>(null);
  const { assets, fetchAssets, createAsset, updateAsset, deleteAsset } = useCryptoAssetStore();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // 刷新所有加密货币价格
  const handleRefreshPrices = async () => {
    setRefreshing(true);
    try {
      const result = await cryptoAssetService.refreshPrices();
      message.success(
        `价格刷新成功：更新 ${result.updated} 个资产${result.failed && result.failed.length > 0 ? `，失败 ${result.failed.length} 个` : ''}`,
      );
      logger.info('Crypto prices refreshed', result);
      actionRef.current?.reload();
      await fetchAssets(); // 重新获取数据
    } catch (error) {
      message.error('价格刷新失败');
      logger.error('Failed to refresh crypto prices', error);
    } finally {
      setRefreshing(false);
    }
  };

  const { totalAmount, count } = useMemo(() => {
    const total = assets.reduce(
      (sum, asset) => sum + (asset.current_price || 0) * (asset.quantity || 0),
      0,
    );
    return {
      totalAmount: total,
      count: assets.length,
    };
  }, [assets]);

  useImperativeHandle(ref, () => ({
    openCreateModal: () => setCreateModalVisible(true),
    getStatistics: () => ({ totalAmount, count }),
  }));

  const columns: ProColumns<ModelsCryptoAsset>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      hideInTable: true,
    },
    {
      title: '资产名称',
      dataIndex: 'name',
      ellipsis: true,
      width: 180,
    },
    {
      title: '代币符号',
      dataIndex: 'symbol',
      width: 110,
      align: 'center',
    },
    {
      title: '持仓数量',
      dataIndex: 'quantity',
      width: 120,
      align: 'right',
      render: (_, record) => {
        return record.quantity?.toFixed(8);
      },
    },
    {
      title: '买入价',
      dataIndex: 'purchase_price',
      valueType: 'money',
      width: 120,
      align: 'right',
    },
    {
      title: '当前价',
      dataIndex: 'current_price',
      valueType: 'money',
      width: 120,
      align: 'right',
    },
    {
      title: '市值',
      key: 'market_value',
      width: 130,
      align: 'right',
      render: (_, record) => {
        const marketValue = (record.current_price || 0) * (record.quantity || 0);
        return `$${marketValue.toFixed(2)}`;
      },
    },
    {
      title: '成本',
      key: 'cost',
      width: 130,
      align: 'right',
      render: (_, record) => {
        const cost = (record.purchase_price || 0) * (record.quantity || 0);
        return `$${cost.toFixed(2)}`;
      },
    },
    {
      title: '收益',
      key: 'profit',
      width: 130,
      align: 'right',
      render: (_, record) => {
        const cost = (record.purchase_price || 0) * (record.quantity || 0);
        const marketValue = (record.current_price || 0) * (record.quantity || 0);
        const profit = marketValue - cost;
        const isProfit = profit >= 0;
        return (
          <span style={{ color: isProfit ? '#52c41a' : '#ff4d4f', fontWeight: 500 }}>
            {isProfit ? '+' : ''}${profit.toFixed(2)}
          </span>
        );
      },
    },
    {
      title: '收益率',
      key: 'profit_rate',
      width: 100,
      align: 'right',
      render: (_, record) => {
        const purchasePrice = record.purchase_price || 0;
        const currentPrice = record.current_price || 0;
        if (purchasePrice === 0) return '-';
        const rate = ((currentPrice - purchasePrice) / purchasePrice) * 100;
        const isProfit = rate >= 0;
        return (
          <Tag color={isProfit ? 'success' : 'error'} style={{ fontWeight: 500 }}>
            {isProfit ? '+' : ''}
            {rate.toFixed(2)}%
          </Tag>
        );
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 160,
      align: 'center',
      render: (text: string) => {
        if (!text) return '-';
        const date = new Date(text);
        return (
          <Tooltip title={date.toLocaleString('zh-CN')}>
            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
              {date.toLocaleDateString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      align: 'center',
      render: (_, record) => (
        <Space size="middle">
          <ModalForm<ModelsCryptoAsset>
            key="edit"
            title="编辑加密货币资产"
            trigger={
              <Button type="link" size="small" icon={<EditOutlined />}>
                编辑
              </Button>
            }
            width={600}
            initialValues={record}
            onFinish={async (values) => {
              try {
                await updateAsset(record.id!, values);
                message.success('更新成功');
                logger.info(`Crypto asset updated: ${record.id}`);
                actionRef.current?.reload();
                return true;
              } catch {
                message.error('更新失败');
                return false;
              }
            }}
          >
            <ProFormText
              name="name"
              label="资产名称"
              placeholder="如: 比特币"
              rules={[{ required: true, message: '请输入资产名称' }]}
            />
            <ProFormText
              name="symbol"
              label="代币符号"
              placeholder="如: BTC"
              rules={[{ required: true, message: '请输入代币符号' }]}
            />
            <ProFormDigit
              name="quantity"
              label="持仓数量"
              min={0}
              fieldProps={{ precision: 8 }}
              rules={[{ required: true, message: '请输入持仓数量' }]}
            />
            <ProFormDigit
              name="purchase_price"
              label="买入价格"
              min={0}
              fieldProps={{ precision: 2 }}
              rules={[{ required: true, message: '请输入买入价格' }]}
            />
            <ProFormDigit
              name="current_price"
              label="当前价格"
              min={0}
              fieldProps={{ precision: 2 }}
            />
            <ProFormText name="currency" label="计价货币" placeholder="如: USD, CNY" />
            <ProFormTextArea
              name="description"
              label="描述"
              placeholder="资产描述"
              fieldProps={{ rows: 3 }}
            />
          </ModalForm>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: `确定要删除加密货币资产 "${record.name}" 吗？`,
                okText: '确认',
                cancelText: '取消',
                okType: 'danger',
                onOk: async () => {
                  try {
                    await deleteAsset(record.id!);
                    message.success('删除成功');
                    logger.info(`Crypto asset deleted: ${record.id}`);
                    actionRef.current?.reload();
                  } catch {
                    message.error('删除失败');
                  }
                },
              });
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<ModelsCryptoAsset>
        columns={columns}
        actionRef={actionRef}
        request={async () => {
          await fetchAssets();
          return {
            data: assets,
            success: true,
            total: assets.length,
          };
        }}
        rowKey="id"
        search={false}
        options={false}
        toolBarRender={() => [
          <Tooltip title="从市场数据源刷新所有加密货币价格" key="refresh-tooltip">
            <Button
              key="refresh"
              type="primary"
              icon={<ReloadOutlined spin={refreshing} />}
              loading={refreshing}
              onClick={handleRefreshPrices}
            >
              刷新价格
            </Button>
          </Tooltip>,
        ]}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        dateFormatter="string"
        locale={{
          emptyText: (
            <Empty
              image={<InboxOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />}
              description={
                <span style={{ color: '#8c8c8c' }}>
                  暂无加密货币资产数据
                  <br />
                  点击右上角"新增资产"按钮添加
                </span>
              }
            />
          ),
        }}
      />

      <ModalForm<HandlersCreateCryptoAssetRequest>
        title="新建加密货币资产"
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        width={600}
        initialValues={{ currency: 'USD' }}
        onFinish={async (values) => {
          try {
            await createAsset(values as HandlersCreateCryptoAssetRequest);
            message.success('创建成功');
            logger.info('Crypto asset created');
            actionRef.current?.reload();
            return true;
          } catch {
            message.error('创建失败');
            return false;
          }
        }}
      >
        <ProFormSelect
          name="market_search"
          label="搜索加密货币"
          placeholder="输入加密货币名称或符号搜索"
          showSearch
          fieldProps={{
            suffixIcon: <SearchOutlined />,
            filterOption: false,
            onSearch: async (_value: string) => {
              // 搜索逻辑已在request中处理
            },
            labelInValue: true,
            onSelect: async (
              _: unknown,
              option: { data?: { symbol: string; name: string; currency: string; type: string } },
            ) => {
              if (option?.data) {
                // 自动填充表单字段
                const form = document.querySelector('form');
                if (form) {
                  // 使用ProForm的方式设置字段值
                  const event = new Event('input', { bubbles: true });
                  const symbolInput = form.querySelector('[id*="symbol"]') as HTMLInputElement;
                  const nameInput = form.querySelector('[id*="name"]') as HTMLInputElement;
                  const currencyInput = form.querySelector('[id*="currency"]') as HTMLInputElement;

                  // 对于加密货币，Yahoo Finance 使用 BTC-USD 格式
                  // 我们需要从 BTC-USD 中提取 BTC
                  const cryptoSymbol = option.data.symbol.split('-')[0];

                  if (symbolInput) {
                    symbolInput.value = cryptoSymbol;
                    symbolInput.dispatchEvent(event);
                  }
                  if (nameInput) {
                    nameInput.value = option.data.name;
                    nameInput.dispatchEvent(event);
                  }
                  if (currencyInput) {
                    currencyInput.value = 'USD';
                    currencyInput.dispatchEvent(event);
                  }
                }

                // 获取最新价格（使用完整的 symbol 如 BTC-USD）
                try {
                  const quoteData = await marketService.getQuote(option.data.symbol);
                  const priceInput = form?.querySelector(
                    '[id*="current_price"]',
                  ) as HTMLInputElement;
                  if (priceInput && quoteData.price) {
                    priceInput.value = quoteData.price.toString();
                    priceInput.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                  message.success(
                    `已获取 ${option.data.name} 最新价格: $${quoteData.price || 'N/A'}`,
                  );
                } catch (error) {
                  logger.warn('Failed to fetch current price', error);
                }
              }
            },
          }}
          request={async ({ keyWords }) => {
            if (!keyWords || keyWords.length < 1) {
              return [];
            }
            try {
              const response = await marketService.search(keyWords);
              // 只返回加密货币
              return (response.results || [])
                .filter((item) => item.asset_type === 'crypto')
                .map((item) => ({
                  label: `${item.name || item.symbol} (${item.symbol})`,
                  value: item.symbol,
                  data: {
                    symbol: item.symbol || '',
                    name: item.name || '',
                    currency: 'USD',
                    type: item.asset_type || 'crypto',
                  },
                }));
            } catch (error) {
              logger.error('Market search failed', error);
              return [];
            }
          }}
        />
        <ProFormText
          name="name"
          label="资产名称"
          placeholder="如: 比特币"
          rules={[{ required: true, message: '请输入资产名称' }]}
        />
        <ProFormText
          name="symbol"
          label="代币符号"
          placeholder="如: BTC"
          rules={[{ required: true, message: '请输入代币符号' }]}
        />
        <ProFormDigit
          name="quantity"
          label="持仓数量"
          min={0}
          fieldProps={{ precision: 8 }}
          rules={[{ required: true, message: '请输入持仓数量' }]}
        />
        <ProFormDigit
          name="purchase_price"
          label="买入价格"
          min={0}
          fieldProps={{ precision: 2 }}
          rules={[{ required: true, message: '请输入买入价格' }]}
        />
        <ProFormDigit name="current_price" label="当前价格" min={0} fieldProps={{ precision: 2 }} />
        <ProFormText name="currency" label="计价货币" placeholder="如: USD, CNY" />
        <ProFormTextArea
          name="description"
          label="描述"
          placeholder="资产描述"
          fieldProps={{ rows: 3 }}
        />
      </ModalForm>
    </>
  );
});

CryptoAssetTab.displayName = 'CryptoAssetTab';

export default CryptoAssetTab;
