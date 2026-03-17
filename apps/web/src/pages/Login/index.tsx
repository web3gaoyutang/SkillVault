import React from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../api/auth';
import { useAuthStore } from '../../store/auth';
import type { LoginParams } from '../../types';

const { Title, Text } = Typography;

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
      <Card
        style={{
          width: 420,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: 'none',
        }}
        bodyStyle={{ padding: 40 }}
      >
        <Space direction="vertical" size={4} style={{ width: '100%', textAlign: 'center', marginBottom: 32 }}>
          <SafetyCertificateOutlined style={{ fontSize: 40, color: '#4F46E5' }} />
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>SkillVault</Title>
          <Text type="secondary">Sign in to your account</Text>
        </Space>
        <Form onFinish={onFinish} size="large" layout="vertical">
          <Form.Item name="username" rules={[{ required: true, message: 'Please enter username' }]}>
            <Input prefix={<UserOutlined style={{ color: '#9CA3AF' }} />} placeholder="Username" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Please enter password' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#9CA3AF' }} />} placeholder="Password" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              style={{
                height: 44,
                borderRadius: 8,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                border: 'none',
              }}
            >
              Sign In
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">Don't have an account? </Text>
            <Link to="/register" style={{ fontWeight: 500 }}>Create one</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
