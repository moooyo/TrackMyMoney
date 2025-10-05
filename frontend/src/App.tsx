import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import BasicLayout from '@/layouts/BasicLayout';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import Assets from '@/pages/Assets';
import Notifications from '@/pages/Notifications';
import Watchlist from '@/pages/Watchlist';

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          colorBgContainer: '#ffffff',
        },
        algorithm: theme.defaultAlgorithm,
        components: {
          Button: {
            borderRadius: 6,
            controlHeight: 32,
          },
          Input: {
            borderRadius: 6,
            controlHeight: 32,
          },
          Select: {
            borderRadius: 6,
            controlHeight: 32,
          },
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <BasicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="assets" element={<Assets />} />
            <Route path="watchlist" element={<Watchlist />} />
            <Route path="market" element={<Navigate to="/watchlist" replace />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
