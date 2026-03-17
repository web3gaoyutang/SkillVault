import React from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../api/auth';
import { useAuthStore } from '../../store/auth';
import type { LoginParams } from '../../types';

const { Title, Text } = Typography;

// Minimal logo mark
const LogoMark: React.FC = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="5" fill="#6366F1" fillOpacity="0.12" stroke="#6366F1" strokeWidth="1.8"/>
    <rect x="14" y="14" width="20" height="20" rx="5" fill="#10B981" fillOpacity="0.12" stroke="#10B981" strokeWidth="1.8"/>
  </svg>
);

const Login: React.FC = () => {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);

  const onFinish = async (values: LoginParams) => {
    try {
      const res = await authAPI.login(values);
      setTokens(res.access_token, res.refresh_token);
      navigate('/');
    } catch {
      message.error('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="auth-bg">
      <div style={{ width: '100%', maxWidth: 400, padding: '0 16px' }}>
        {/* Brand mark */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <LogoMark />
          <Title level={3} style={{ margin: '12px 0 4px', fontWeight: 700, color: '#0F172A' }}>
            SkillVault
          </Title>
          <Text style={{ color: '#64748B', fontSize: 14 }}>Sign in to your account</Text>
        </div>

        <Card
          style={{
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 24px rgba(99, 102, 241, 0.08)',
          }}
          bodyStyle={{ padding: 32 }}
        >
          <Form onFinish={onFinish} size="large" layout="vertical">
            <Form.Item name="username" rules={[{ required: true, message: 'Please enter username' }]} style={{ marginBottom: 16 }}>
              <Input
                prefix={<UserOutlined style={{ color: '#CBD5E1' }} />}
                placeholder="Username"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: 'Please enter password' }]} style={{ marginBottom: 20 }}>
              <Input.Password
                prefix={<LockOutlined style={{ color: '#CBD5E1' }} />}
                placeholder="Password"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                style={{ height: 42, borderRadius: 8, fontWeight: 600, fontSize: 14 }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', paddingTop: 4 }}>
            <Text style={{ color: '#94A3B8', fontSize: 13 }}>Don't have an account? </Text>
            <Link to="/register" style={{ fontWeight: 500, fontSize: 13 }}>Create one</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
