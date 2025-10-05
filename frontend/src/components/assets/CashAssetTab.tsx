import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import { message, Modal, Empty, Space, Button } from 'antd';
import {
  ProTable,
  ModalForm,
  ProFormText,
  ProFormDigit,
  ProFormTextArea,
} from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { EditOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import { useCashAssetStore } from '@/stores';
import type {
  ModelsCashAsset,
  HandlersCreateCashAssetRequest,
} from '@/types/generated/data-contracts';
import logger from '@/utils/logger';

const CashAssetTab = forwardRef<{ openCreateModal: () => void }>((_, ref) => {
  const actionRef = useRef<ActionType>(null);
  const { assets, fetchAssets, createAsset, updateAsset, deleteAsset } = useCashAssetStore();
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

  const columns: ProColumns<ModelsCashAsset>[] = [
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
      title: '货币',
      dataIndex: 'currency',
      width: 100,
      align: 'center',
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      width: 300,
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      valueType: 'dateTime',
      width: 180,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      align: 'center',
      render: (_, record) => (
        <Space size="middle">
          <ModalForm<ModelsCashAsset>
            key="edit"
            title="编辑现金资产"
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
                logger.info(`Cash asset updated: ${record.id}`);
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
              placeholder="如: 工资卡"
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
                content: `确定要删除现金资产 "${record.name}" 吗？`,
                okText: '确认',
                cancelText: '取消',
                okType: 'danger',
                onOk: async () => {
                  try {
                    await deleteAsset(record.id!);
                    message.success('删除成功');
                    logger.info(`Cash asset deleted: ${record.id}`);
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
      <ProTable<ModelsCashAsset>
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
                  暂无现金资产数据
                  <br />
                  点击右上角"新增资产"按钮添加
                </span>
              }
            />
          ),
        }}
      />

      <ModalForm<HandlersCreateCashAssetRequest>
        title="新建现金资产"
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        width={600}
        initialValues={{ currency: 'CNY' }}
        onFinish={async (values) => {
          try {
            await createAsset(values);
            message.success('创建成功');
            logger.info('Cash asset created');
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
          placeholder="如: 工资卡"
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

CashAssetTab.displayName = 'CashAssetTab';

export default CashAssetTab;
