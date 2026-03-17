import React from 'react';
import { Form, Input, Button, Card, Typography, message, Progress } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../api/auth';
import type { RegisterParams } from '../../types';

const { Title, Text } = Typography;

const getPasswordStrength = (password: string): { percent: number; status: 'exception' | 'active' | 'success'; label: string; color: string } => {
  if (!password) return { percent: 0, status: 'exception', label: '', color: '#E2E8F0' };
  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 20;
  if (/\d/.test(password)) score += 20;
  if (/[^a-zA-Z0-9]/.test(password)) score += 20;
  if (score < 40) return { percent: score, status: 'exception', label: 'Weak', color: '#EF4444' };
  if (score < 70) return { percent: score, status: 'active', label: 'Fair', color: '#F59E0B' };
  return { percent: score, status: 'success', label: 'Strong', color: '#10B981' };
};

// Minimal logo mark
const LogoMark: React.FC = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="5" fill="#6366F1" fillOpacity="0.12" stroke="#6366F1" strokeWidth="1.8"/>
    <rect x="14" y="14" width="20" height="20" rx="5" fill="#10B981" fillOpacity="0.12" stroke="#10B981" strokeWidth="1.8"/>
  </svg>
);

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
      <div style={{ width: '100%', maxWidth: 400, padding: '0 16px' }}>
        {/* Brand mark */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <LogoMark />
          <Title level={3} style={{ margin: '12px 0 4px', fontWeight: 700, color: '#0F172A' }}>
            Create Account
          </Title>
          <Text style={{ color: '#64748B', fontSize: 14 }}>Join SkillVault today</Text>
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
            <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]} style={{ marginBottom: 16 }}>
              <Input
                prefix={<MailOutlined style={{ color: '#CBD5E1' }} />}
                placeholder="Email"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, min: 8, message: 'Password must be at least 8 characters' }]} style={{ marginBottom: 8 }}>
              <Input.Password
                prefix={<LockOutlined style={{ color: '#CBD5E1' }} />}
                placeholder="Password"
                style={{ borderRadius: 8 }}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Item>

            {password && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ height: 4, borderRadius: 4, background: '#E2E8F0', overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{
                    height: '100%',
                    width: `${strength.percent}%`,
                    background: strength.color,
                    borderRadius: 4,
                    transition: 'width 0.3s ease, background 0.3s ease',
                  }} />
                </div>
                <Text style={{ fontSize: 12, color: strength.color, fontWeight: 500 }}>
                  {strength.label}
                </Text>
              </div>
            )}

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                style={{ height: 42, borderRadius: 8, fontWeight: 600, fontSize: 14 }}
              >
                Create Account
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', paddingTop: 4 }}>
            <Text style={{ color: '#94A3B8', fontSize: 13 }}>Already have an account? </Text>
            <Link to="/login" style={{ fontWeight: 500, fontSize: 13 }}>Sign in</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;
