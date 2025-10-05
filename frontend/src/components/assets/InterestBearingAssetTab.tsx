import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import { message, Modal, Empty, Space, Button } from 'antd';
import {
  ProTable,
  ModalForm,
  ProFormText,
  ProFormDigit,
  ProFormTextArea,
  ProFormDatePicker,
} from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { EditOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import { useInterestBearingAssetStore } from '@/stores';
import type {
  ModelsInterestBearingAsset,
  HandlersCreateInterestBearingAssetRequest,
} from '@/types/generated/data-contracts';
import logger from '@/utils/logger';
import dayjs from 'dayjs';

const InterestBearingAssetTab = forwardRef<{ openCreateModal: () => void }>((_, ref) => {
  const actionRef = useRef<ActionType>(null);
  const { assets, fetchAssets, createAsset, updateAsset, deleteAsset } =
    useInterestBearingAssetStore();
  const [createModalVisible, setCreateModalVisible] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const { totalAmount, count } = useMemo(() => {
    const total = assets.reduce((sum, asset) => sum + (asset.amount || 0), 0);
    return {
      totalAmount: total,
      count: assets.length,
    };
  }, [assets]);

  useImperativeHandle(ref, () => ({
    openCreateModal: () => setCreateModalVisible(true),
    getStatistics: () => ({ totalAmount, count }),
  }));

  const columns: ProColumns<ModelsInterestBearingAsset>[] = [
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
      width: 200,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      valueType: 'money',
      width: 150,
      align: 'right',
    },
    {
      title: '年利率(%)',
      dataIndex: 'interest_rate',
      width: 120,
      align: 'right',
      render: (text) => `${text}%`,
    },
    {
      title: '起息日',
      dataIndex: 'start_date',
      valueType: 'date',
      width: 130,
      align: 'center',
    },
    {
      title: '到期日',
      dataIndex: 'maturity_date',
      valueType: 'date',
      width: 130,
      align: 'center',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      align: 'center',
      render: (_, record) => (
        <Space size="middle">
          <ModalForm<ModelsInterestBearingAsset>
            key="edit"
            title="编辑计息资产"
            trigger={
              <Button type="link" size="small" icon={<EditOutlined />}>
                编辑
              </Button>
            }
            width={600}
            initialValues={{
              ...record,
              start_date: record.start_date ? dayjs(record.start_date) : undefined,
              maturity_date: record.maturity_date ? dayjs(record.maturity_date) : undefined,
            }}
            onFinish={async (values) => {
              try {
                const assetData = {
                  ...values,
                  start_date: values.start_date
                    ? dayjs(values.start_date).toISOString()
                    : undefined,
                  maturity_date: values.maturity_date
                    ? dayjs(values.maturity_date).toISOString()
                    : undefined,
                };
                await updateAsset(record.id!, assetData);
                message.success('更新成功');
                logger.info(`Interest-bearing asset updated: ${record.id}`);
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
              placeholder="如: 一年期定存"
              rules={[{ required: true, message: '请输入资产名称' }]}
            />
            <ProFormDigit
              name="amount"
              label="金额"
              min={0}
              fieldProps={{ precision: 2 }}
              rules={[{ required: true, message: '请输入金额' }]}
            />
            <ProFormText
              name="currency"
              label="货币"
              placeholder="如: CNY, USD"
              rules={[{ required: true, message: '请选择货币' }]}
            />
            <ProFormDigit
              name="interest_rate"
              label="年利率 (%)"
              min={0}
              max={100}
              fieldProps={{ precision: 2 }}
              rules={[{ required: true, message: '请输入年利率' }]}
            />
            <ProFormDatePicker
              name="start_date"
              label="起息日期"
              width="lg"
              rules={[{ required: true, message: '请选择起息日期' }]}
            />
            <ProFormDatePicker name="maturity_date" label="到期日期" width="lg" />
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
                content: `确定要删除计息资产 "${record.name}" 吗？`,
                okText: '确认',
                cancelText: '取消',
                okType: 'danger',
                onOk: async () => {
                  try {
                    await deleteAsset(record.id!);
                    message.success('删除成功');
                    logger.info(`Interest-bearing asset deleted: ${record.id}`);
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
      <ProTable<ModelsInterestBearingAsset>
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
                  暂无计息资产数据
                  <br />
                  点击右上角"新增资产"按钮添加
                </span>
              }
            />
          ),
        }}
      />

      <ModalForm<HandlersCreateInterestBearingAssetRequest>
        title="新建计息资产"
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        width={600}
        initialValues={{ currency: 'CNY', start_date: dayjs() }}
        onFinish={async (values) => {
          try {
            const assetData = {
              ...values,
              start_date: values.start_date ? dayjs(values.start_date).toISOString() : undefined,
              maturity_date: values.maturity_date
                ? dayjs(values.maturity_date).toISOString()
                : undefined,
            };
            await createAsset(assetData as HandlersCreateInterestBearingAssetRequest);
            message.success('创建成功');
            logger.info('Interest-bearing asset created');
            actionRef.current?.reload();
            return true;
          } catch {
            message.error('创建失败');
            return false;
          }
        }}
      >
        <ProFormText
          name="name"
          label="资产名称"
          placeholder="如: 一年期定存"
          rules={[{ required: true, message: '请输入资产名称' }]}
        />
        <ProFormDigit
          name="amount"
          label="金额"
          min={0}
          fieldProps={{ precision: 2 }}
          rules={[{ required: true, message: '请输入金额' }]}
        />
        <ProFormText
          name="currency"
          label="货币"
          placeholder="如: CNY, USD"
          rules={[{ required: true, message: '请选择货币' }]}
        />
        <ProFormDigit
          name="interest_rate"
          label="年利率 (%)"
          min={0}
          max={100}
          fieldProps={{ precision: 2 }}
          rules={[{ required: true, message: '请输入年利率' }]}
        />
        <ProFormDatePicker
          name="start_date"
          label="起息日期"
          width="lg"
          rules={[{ required: true, message: '请选择起息日期' }]}
        />
        <ProFormDatePicker name="maturity_date" label="到期日期" width="lg" />
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

InterestBearingAssetTab.displayName = 'InterestBearingAssetTab';

export default InterestBearingAssetTab;
