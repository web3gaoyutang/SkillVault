import React from 'react';
import { Form, Input, Button, Card, Typography, message, Space, Progress } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../api/auth';
import type { RegisterParams } from '../../types';

const { Title, Text } = Typography;

const getPasswordStrength = (password: string): { percent: number; status: 'exception' | 'active' | 'success' } => {
  if (!password) return { percent: 0, status: 'exception' };
  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 20;
  if (/\d/.test(password)) score += 20;
  if (/[^a-zA-Z0-9]/.test(password)) score += 20;
  if (score < 40) return { percent: score, status: 'exception' };
  if (score < 70) return { percent: score, status: 'active' };
  return { percent: score, status: 'success' };
};

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = React.useState('');

  const onFinish = async (values: RegisterParams) => {
    try {
      await authAPI.register(values);
      message.success('Registration successful! Please sign in.');
      navigate('/login');
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Registration failed');
    }
  };

  const strength = getPasswordStrength(password);

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
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Create Account</Title>
          <Text type="secondary">Join SkillVault today</Text>
        </Space>
        <Form onFinish={onFinish} size="large" layout="vertical">
          <Form.Item name="username" rules={[{ required: true, message: 'Please enter username' }]}>
            <Input prefix={<UserOutlined style={{ color: '#9CA3AF' }} />} placeholder="Username" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
            <Input prefix={<MailOutlined style={{ color: '#9CA3AF' }} />} placeholder="Email" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, min: 8, message: 'Password must be at least 8 characters' }]}>
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
              placeholder="Password"
              style={{ borderRadius: 8 }}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>
          {password && (
            <div style={{ marginTop: -16, marginBottom: 16 }}>
              <Progress percent={strength.percent} status={strength.status} showInfo={false} size="small" />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {strength.percent < 40 ? 'Weak' : strength.percent < 70 ? 'Fair' : 'Strong'}
              </Text>
            </div>
          )}
          <Form.Item>
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
              Create Account
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">Already have an account? </Text>
            <Link to="/login" style={{ fontWeight: 500 }}>Sign in</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
