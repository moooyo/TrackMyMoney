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
import { useDebtAssetStore } from '@/stores';
import type {
  ModelsDebtAsset,
  HandlersCreateDebtAssetRequest,
} from '@/types/generated/data-contracts';
import logger from '@/utils/logger';
import dayjs from 'dayjs';

const DebtAssetTab = forwardRef<{ openCreateModal: () => void }>((_, ref) => {
  const actionRef = useRef<ActionType>(null);
  const { assets, fetchAssets, createAsset, updateAsset, deleteAsset } = useDebtAssetStore();
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

  const columns: ProColumns<ModelsDebtAsset>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      hideInTable: true,
    },
    {
      title: '债务名称',
      dataIndex: 'name',
      ellipsis: true,
      width: 200,
    },
    {
      title: '债务金额',
      dataIndex: 'amount',
      valueType: 'money',
      width: 150,
      align: 'right',
    },
    {
      title: '债权人',
      dataIndex: 'creditor',
      ellipsis: true,
      width: 150,
    },
    {
      title: '利率(%)',
      dataIndex: 'interest_rate',
      width: 100,
      align: 'right',
      render: (text) => (text ? `${text}%` : '-'),
    },
    {
      title: '到期日',
      dataIndex: 'due_date',
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
          <ModalForm<ModelsDebtAsset>
            key="edit"
            title="编辑债务资产"
            trigger={
              <Button type="link" size="small" icon={<EditOutlined />}>
                编辑
              </Button>
            }
            width={600}
            initialValues={{
              ...record,
              due_date: record.due_date ? dayjs(record.due_date) : undefined,
            }}
            onFinish={async (values) => {
              try {
                const assetData = {
                  ...values,
                  due_date: values.due_date ? dayjs(values.due_date).toISOString() : undefined,
                };
                await updateAsset(record.id!, assetData);
                message.success('更新成功');
                logger.info(`Debt asset updated: ${record.id}`);
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
              label="债务名称"
              placeholder="如: 房贷"
              rules={[{ required: true, message: '请输入债务名称' }]}
            />
            <ProFormDigit
              name="amount"
              label="债务金额"
              min={0}
              fieldProps={{ precision: 2 }}
              rules={[{ required: true, message: '请输入债务金额' }]}
            />
            <ProFormText
              name="currency"
              label="货币"
              placeholder="如: CNY, USD"
              rules={[{ required: true, message: '请选择货币' }]}
            />
            <ProFormText
              name="creditor"
              label="债权人"
              placeholder="如: 工商银行"
              rules={[{ required: true, message: '请输入债权人' }]}
            />
            <ProFormDigit
              name="interest_rate"
              label="年利率 (%)"
              min={0}
              max={100}
              fieldProps={{ precision: 2 }}
            />
            <ProFormDatePicker name="due_date" label="到期日期" width="lg" />
            <ProFormTextArea
              name="description"
              label="描述"
              placeholder="债务描述"
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
                content: `确定要删除债务资产 "${record.name}" 吗？`,
                okText: '确认',
                cancelText: '取消',
                okType: 'danger',
                onOk: async () => {
                  try {
                    await deleteAsset(record.id!);
                    message.success('删除成功');
                    logger.info(`Debt asset deleted: ${record.id}`);
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
      <ProTable<ModelsDebtAsset>
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
                  暂无债务资产数据
                  <br />
                  点击右上角"新增资产"按钮添加
                </span>
              }
            />
          ),
        }}
      />

      <ModalForm<HandlersCreateDebtAssetRequest>
        title="新建债务资产"
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        width={600}
        initialValues={{ currency: 'CNY' }}
        onFinish={async (values) => {
          try {
            const assetData = {
              ...values,
              due_date: values.due_date ? dayjs(values.due_date).toISOString() : undefined,
            };
            await createAsset(assetData as HandlersCreateDebtAssetRequest);
            message.success('创建成功');
            logger.info('Debt asset created');
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
          label="债务名称"
          placeholder="如: 房贷"
          rules={[{ required: true, message: '请输入债务名称' }]}
        />
        <ProFormDigit
          name="amount"
          label="债务金额"
          min={0}
          fieldProps={{ precision: 2 }}
          rules={[{ required: true, message: '请输入债务金额' }]}
        />
        <ProFormText
          name="currency"
          label="货币"
          placeholder="如: CNY, USD"
          rules={[{ required: true, message: '请选择货币' }]}
        />
        <ProFormText
          name="creditor"
          label="债权人"
          placeholder="如: 工商银行"
          rules={[{ required: true, message: '请输入债权人' }]}
        />
        <ProFormDigit
          name="interest_rate"
          label="年利率 (%)"
          min={0}
          max={100}
          fieldProps={{ precision: 2 }}
        />
        <ProFormDatePicker name="due_date" label="到期日期" width="lg" />
        <ProFormTextArea
          name="description"
          label="描述"
          placeholder="债务描述"
          fieldProps={{ rows: 3 }}
        />
      </ModalForm>
    </>
  );
});

DebtAssetTab.displayName = 'DebtAssetTab';

export default DebtAssetTab;
