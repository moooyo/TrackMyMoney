import { useRef, useMemo } from 'react';
import { ProCard, PageContainer } from '@ant-design/pro-components';
import { Space, Button, Dropdown, Tag } from 'antd';
import {
  PlusOutlined,
  DownOutlined,
  WalletOutlined,
  BankOutlined,
  StockOutlined,
  CreditCardOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import CashAssetTab from '@/components/assets/CashAssetTab';
import InterestBearingAssetTab from '@/components/assets/InterestBearingAssetTab';
import StockAssetTab from '@/components/assets/StockAssetTab';
import DebtAssetTab from '@/components/assets/DebtAssetTab';
import CryptoAssetTab from '@/components/assets/CryptoAssetTab';
import {
  useCashAssetStore,
  useInterestBearingAssetStore,
  useStockAssetStore,
  useDebtAssetStore,
  useCryptoAssetStore,
} from '@/stores';

export default function Assets() {
  const cashRef = useRef<{ openCreateModal: () => void }>(null);
  const interestBearingRef = useRef<{ openCreateModal: () => void }>(null);
  const stockRef = useRef<{ openCreateModal: () => void }>(null);
  const debtRef = useRef<{ openCreateModal: () => void }>(null);
  const cryptoRef = useRef<{ openCreateModal: () => void }>(null);

  const cashAssets = useCashAssetStore((state) => state.assets);
  const interestBearingAssets = useInterestBearingAssetStore((state) => state.assets);
  const stockAssets = useStockAssetStore((state) => state.assets);
  const debtAssets = useDebtAssetStore((state) => state.assets);
  const cryptoAssets = useCryptoAssetStore((state) => state.assets);

  const cashStats = useMemo(() => {
    const total = cashAssets.reduce((sum, asset) => sum + (asset.amount || 0), 0);
    return { count: cashAssets.length, total };
  }, [cashAssets]);

  const interestBearingStats = useMemo(() => {
    const total = interestBearingAssets.reduce((sum, asset) => sum + (asset.amount || 0), 0);
    return { count: interestBearingAssets.length, total };
  }, [interestBearingAssets]);

  const stockStats = useMemo(() => {
    const total = stockAssets.reduce(
      (sum, asset) => sum + (asset.current_price || 0) * (asset.quantity || 0),
      0,
    );
    return { count: stockAssets.length, total };
  }, [stockAssets]);

  const debtStats = useMemo(() => {
    const total = debtAssets.reduce((sum, asset) => sum + (asset.amount || 0), 0);
    return { count: debtAssets.length, total };
  }, [debtAssets]);

  const cryptoStats = useMemo(() => {
    const total = cryptoAssets.reduce(
      (sum, asset) => sum + (asset.current_price || 0) * (asset.quantity || 0),
      0,
    );
    return { count: cryptoAssets.length, total };
  }, [cryptoAssets]);

  const menuItems: MenuProps['items'] = [
    {
      key: 'cash',
      label: '现金资产',
      onClick: () => cashRef.current?.openCreateModal(),
    },
    {
      key: 'interest-bearing',
      label: '计息资产',
      onClick: () => interestBearingRef.current?.openCreateModal(),
    },
    {
      key: 'stock',
      label: '股票资产',
      onClick: () => stockRef.current?.openCreateModal(),
    },
    {
      key: 'debt',
      label: '债务资产',
      onClick: () => debtRef.current?.openCreateModal(),
    },
    {
      key: 'crypto',
      label: '加密货币',
      onClick: () => cryptoRef.current?.openCreateModal(),
    },
  ];

  return (
    <PageContainer
      title="资产管理"
      subTitle="管理您的各类资产"
      ghost={false}
      extra={[
        <Dropdown key="add" menu={{ items: menuItems }} placement="bottomRight">
          <Button type="primary" icon={<PlusOutlined />}>
            新增资产 <DownOutlined />
          </Button>
        </Dropdown>,
      ]}
    >
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        {/* 现金资产 */}
        <ProCard
          title={
            <span>
              <WalletOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              现金资产
            </span>
          }
          extra={
            <Space size="large">
              <Tag color="blue">{cashStats.count} 项</Tag>
              <Tag color="green">
                ¥
                {cashStats.total.toLocaleString('zh-CN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Tag>
            </Space>
          }
          headerBordered
          collapsible
          defaultCollapsed={false}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 8 }}
          bodyStyle={{ padding: '16px 24px' }}
        >
          <CashAssetTab ref={cashRef} />
        </ProCard>

        {/* 计息资产 */}
        <ProCard
          title={
            <span>
              <BankOutlined style={{ marginRight: 8, color: '#52c41a' }} />
              计息资产
            </span>
          }
          extra={
            <Space size="large">
              <Tag color="blue">{interestBearingStats.count} 项</Tag>
              <Tag color="green">
                ¥
                {interestBearingStats.total.toLocaleString('zh-CN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Tag>
            </Space>
          }
          headerBordered
          collapsible
          defaultCollapsed={true}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 8 }}
          bodyStyle={{ padding: '16px 24px' }}
        >
          <InterestBearingAssetTab ref={interestBearingRef} />
        </ProCard>

        {/* 股票资产 */}
        <ProCard
          title={
            <span>
              <StockOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
              股票资产
            </span>
          }
          extra={
            <Space size="large">
              <Tag color="blue">{stockStats.count} 项</Tag>
              <Tag color="green">
                ¥
                {stockStats.total.toLocaleString('zh-CN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Tag>
            </Space>
          }
          headerBordered
          collapsible
          defaultCollapsed={true}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 8 }}
          bodyStyle={{ padding: '16px 24px' }}
        >
          <StockAssetTab ref={stockRef} />
        </ProCard>

        {/* 债务资产 */}
        <ProCard
          title={
            <span>
              <CreditCardOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
              债务资产
            </span>
          }
          extra={
            <Space size="large">
              <Tag color="blue">{debtStats.count} 项</Tag>
              <Tag color="red">
                ¥
                {debtStats.total.toLocaleString('zh-CN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Tag>
            </Space>
          }
          headerBordered
          collapsible
          defaultCollapsed={true}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 8 }}
          bodyStyle={{ padding: '16px 24px' }}
        >
          <DebtAssetTab ref={debtRef} />
        </ProCard>

        {/* 加密货币 */}
        <ProCard
          title={
            <span>
              <DollarOutlined style={{ marginRight: 8, color: '#722ed1' }} />
              加密货币资产
            </span>
          }
          extra={
            <Space size="large">
              <Tag color="blue">{cryptoStats.count} 项</Tag>
              <Tag color="green">
                ¥
                {cryptoStats.total.toLocaleString('zh-CN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Tag>
            </Space>
          }
          headerBordered
          collapsible
          defaultCollapsed={true}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 8 }}
          bodyStyle={{ padding: '16px 24px' }}
        >
          <CryptoAssetTab ref={cryptoRef} />
        </ProCard>
      </Space>
    </PageContainer>
  );
}
