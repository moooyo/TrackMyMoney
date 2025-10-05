import { useEffect, useRef } from 'react';
import { message, Modal } from 'antd';
import {
  ProTable,
  ModalForm,
  ProFormText,
  ProFormSelect,
  ProFormSwitch,
  ProFormTextArea,
} from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Notification } from '@/mocks/handlers/notifications';
import logger from '@/utils/logger';

const channelLabels: Record<string, string> = {
  bark: 'Bark',
  telegram_bot: 'Telegram Bot',
  email: 'Email',
};

export default function Notifications() {
  const actionRef = useRef<ActionType>(null);
  const {
    notifications,
    fetchNotifications,
    createNotification,
    updateNotification,
    deleteNotification,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const columns: ProColumns<Notification>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      hideInSearch: true,
    },
    {
      title: '推送名称',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: '推送渠道',
      dataIndex: 'channel',
      valueType: 'select',
      valueEnum: channelLabels,
      width: 130,
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: '定时计划',
      dataIndex: 'schedule',
      hideInSearch: true,
      width: 130,
      tooltip: 'Cron 表达式格式',
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      valueType: 'select',
      width: 100,
      valueEnum: {
        true: { text: '启用', status: 'Success' },
        false: { text: '禁用', status: 'Default' },
      },
      render: (_, record) => (
        <span style={{ color: record.enabled ? '#52c41a' : '#999' }}>
          {record.enabled ? '启用' : '禁用'}
        </span>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      valueType: 'dateTime',
      hideInSearch: true,
      width: 160,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      render: (_, record) => [
        <ModalForm<Notification>
          key="edit"
          title="编辑推送配置"
          trigger={
            <a>
              <EditOutlined /> 编辑
            </a>
          }
          width={600}
          initialValues={record}
          onFinish={async (values) => {
            try {
              await updateNotification(record.id, values);
              message.success('更新成功');
              logger.info(`Notification updated: ${record.id}`);
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
            label="推送名称"
            placeholder="如: 每日资产汇总"
            rules={[{ required: true, message: '请输入推送名称' }]}
          />
          <ProFormSelect
            name="channel"
            label="推送渠道"
            disabled
            options={Object.entries(channelLabels).map(([value, label]) => ({
              label,
              value,
            }))}
            rules={[{ required: true, message: '请选择推送渠道' }]}
          />
          <ProFormTextArea
            name="description"
            label="描述"
            placeholder="简要描述推送的用途"
            fieldProps={{ rows: 3 }}
            rules={[{ required: true, message: '请输入描述' }]}
          />
          <ProFormTextArea
            name="config"
            label="渠道配置"
            placeholder='{"device_key": "your_key"}'
            tooltip="JSON格式的配置信息"
            fieldProps={{ rows: 4 }}
            rules={[{ required: true, message: '请输入渠道配置' }]}
          />
          <ProFormText
            name="schedule"
            label="定时计划"
            placeholder="0 9 * * *"
            tooltip="使用 Cron 表达式，如: 0 9 * * * 表示每天 9:00"
            rules={[{ required: true, message: '请输入定时计划' }]}
          />
          <ProFormSwitch name="enabled" label="启用状态" />
        </ModalForm>,
        <a
          key="delete"
          onClick={() => {
            Modal.confirm({
              title: '确认删除',
              content: `确定要删除推送配置 "${record.name}" 吗？`,
              okText: '确认',
              cancelText: '取消',
              onOk: async () => {
                try {
                  await deleteNotification(record.id);
                  message.success('删除成功');
                  logger.info(`Notification deleted: ${record.id}`);
                  actionRef.current?.reload();
                } catch {
                  message.error('删除失败');
                }
              },
            });
          }}
          style={{ color: 'red' }}
        >
          <DeleteOutlined /> 删除
        </a>,
      ],
    },
  ];

  return (
    <ProTable<Notification>
      columns={columns}
      actionRef={actionRef}
      request={async () => {
        await fetchNotifications();
        return {
          data: notifications,
          success: true,
          total: notifications.length,
        };
      }}
      rowKey="id"
      search={{
        labelWidth: 'auto',
      }}
      pagination={{
        pageSize: 10,
      }}
      dateFormatter="string"
      headerTitle="推送配置列表"
      toolBarRender={() => [
        <ModalForm<Notification>
          key="create"
          title="新建推送配置"
          trigger={
            <a>
              <PlusOutlined /> 新建推送配置
            </a>
          }
          width={600}
          initialValues={{ enabled: true, channel: 'bark' }}
          onFinish={async (values) => {
            try {
              await createNotification(values);
              message.success('创建成功');
              logger.info('Notification created');
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
            label="推送名称"
            placeholder="如: 每日资产汇总"
            rules={[{ required: true, message: '请输入推送名称' }]}
          />
          <ProFormSelect
            name="channel"
            label="推送渠道"
            options={Object.entries(channelLabels).map(([value, label]) => ({
              label,
              value,
            }))}
            rules={[{ required: true, message: '请选择推送渠道' }]}
          />
          <ProFormTextArea
            name="description"
            label="描述"
            placeholder="简要描述推送的用途"
            fieldProps={{ rows: 3 }}
            rules={[{ required: true, message: '请输入描述' }]}
          />
          <ProFormTextArea
            name="config"
            label="渠道配置"
            placeholder='{"device_key": "your_key"}'
            tooltip="JSON格式的配置信息"
            fieldProps={{ rows: 4 }}
            rules={[{ required: true, message: '请输入渠道配置' }]}
          />
          <ProFormText
            name="schedule"
            label="定时计划"
            placeholder="0 9 * * *"
            tooltip="使用 Cron 表达式，如: 0 9 * * * 表示每天 9:00"
            rules={[{ required: true, message: '请输入定时计划' }]}
          />
          <ProFormSwitch name="enabled" label="启用状态" />
        </ModalForm>,
      ]}
    />
  );
}
