import { useEffect } from 'react';
import { message } from 'antd';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import logger from '@/utils/logger';

interface LoginFormValues {
  username: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onFinish = async (values: LoginFormValues) => {
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      logger.info('User logged in, redirecting to home');
      navigate('/');
      return true;
    } catch (error) {
      message.error('登录失败，请检查用户名和密码');
      logger.error('Login failed', error);
      return false;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div
        style={{
          width: 400,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          borderRadius: 8,
          background: '#fff',
          padding: '32px',
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: 8, fontSize: 24 }}>TrackMyMoney</h2>
        <div style={{ textAlign: 'center', marginBottom: 32, color: '#999' }}>财务资产跟踪系统</div>
        <LoginForm<LoginFormValues>
          onFinish={onFinish}
          submitter={{
            searchConfig: {
              submitText: '登录',
            },
          }}
        >
          <ProFormText
            name="username"
            placeholder="用户名"
            fieldProps={{
              size: 'large',
              prefix: <UserOutlined />,
            }}
            rules={[{ required: true, message: '请输入用户名' }]}
          />
          <ProFormText.Password
            name="password"
            placeholder="密码"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />,
            }}
            rules={[{ required: true, message: '请输入密码' }]}
          />
        </LoginForm>
        <div style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: 16 }}>
          默认账号：admin / admin123
        </div>
      </div>
    </div>
  );
}
