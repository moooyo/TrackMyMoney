import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ProLayout } from '@ant-design/pro-components';
import {
  DashboardOutlined,
  WalletOutlined,
  BellOutlined,
  LogoutOutlined,
  StarOutlined,
} from '@ant-design/icons';
import type { MenuDataItem } from '@ant-design/pro-components';
import { useAuthStore } from '@/stores/authStore';
import { message } from 'antd';
import logger from '@/utils/logger';

export default function BasicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [pathname, setPathname] = useState(location.pathname);

  const menuData: MenuDataItem[] = [
    {
      path: '/',
      name: '资产概览',
      icon: <DashboardOutlined />,
    },
    {
      path: '/assets',
      name: '资产管理',
      icon: <WalletOutlined />,
    },
    {
      path: '/watchlist',
      name: '自选关注',
      icon: <StarOutlined />,
    },
    {
      path: '/notifications',
      name: '推送管理',
      icon: <BellOutlined />,
    },
  ];

  const handleMenuClick = (path: string) => {
    setPathname(path);
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    logger.info('User logged out');
    navigate('/login');
  };

  return (
    <ProLayout
      title="TrackMyMoney"
      logo={false}
      layout="mix"
      contentWidth="Fluid"
      fixedHeader
      fixSiderbar
      route={{
        path: '/',
        routes: menuData,
      }}
      location={{ pathname }}
      menuItemRender={(item, dom) => {
        // If item has children, just return dom without custom click handler
        if (item.children && item.children.length > 0) {
          return dom;
        }
        // For leaf nodes with path, add click handler
        return <div onClick={() => item.path && handleMenuClick(item.path)}>{dom}</div>;
      }}
      avatarProps={{
        src: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
        title: user?.username || '用户',
        size: 'small',
      }}
      actionsRender={() => [
        <LogoutOutlined
          key="logout"
          onClick={handleLogout}
          style={{ cursor: 'pointer', fontSize: 16 }}
        />,
      ]}
      contentStyle={{
        margin: 0,
        padding: 24,
      }}
      style={{
        height: '100vh',
      }}
    >
      <div style={{ maxWidth: '100%', width: '100%' }}>
        <Outlet />
      </div>
    </ProLayout>
  );
}
