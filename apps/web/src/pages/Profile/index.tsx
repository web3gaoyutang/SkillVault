import React from 'react';
import { Card, Tabs, Typography, Spin, Table, Button, Space, Modal, Form, Input, message, Empty, Avatar } from 'antd';
import { PlusOutlined, DeleteOutlined, KeyOutlined, CopyOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '../../api/auth';
import { tokenAPI } from '../../api/token';
import PageHeader from '../../components/PageHeader';
import type { APIToken } from '../../types';

const { Text } = Typography;

const Profile: React.FC = () => {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [newTokenValue, setNewTokenValue] = React.useState('');
  const [form] = Form.useForm();

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authAPI.getMe(),
  });

  const { data: tokens } = useQuery({
    queryKey: ['tokens'],
    queryFn: () => tokenAPI.list(),
  });

  const createToken = useMutation({
    mutationFn: (values: { name: string }) => tokenAPI.create(values.name),
    onSuccess: (data) => {
      setNewTokenValue(data.token);
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
    },
    onError: (e: Error) => message.error(e.message),
  });

  const deleteToken = useMutation({
    mutationFn: (id: number) => tokenAPI.delete(id),
    onSuccess: () => {
      message.success('Token deleted');
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
    },
    onError: (e: Error) => message.error(e.message),
  });

  const copyToken = () => {
    navigator.clipboard.writeText(newTokenValue);
    message.success('Token copied to clipboard');
  };

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  const tokenColumns = [
    { title: 'Name', dataIndex: 'name', render: (v: string) => <Text style={{ color: '#0F172A', fontWeight: 500 }}>{v}</Text> },
    { title: 'Prefix', dataIndex: 'token_prefix', render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}...</Text> },
    { title: 'Last Used', dataIndex: 'last_used_at', render: (v: string) => v ? new Date(v).toLocaleDateString() : <Text style={{ color: '#94A3B8' }}>Never</Text> },
    { title: 'Created', dataIndex: 'created_at', render: (v: string) => new Date(v).toLocaleDateString() },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, record: APIToken) => (
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => deleteToken.mutate(record.id)} />
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Profile" />

      <Tabs items={[
        {
          key: 'info',
          label: 'Profile Info',
          children: (
            <Card style={{ borderRadius: 12, maxWidth: 560 }}>
              {/* User identity block */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #F1F5F9' }}>
                <Avatar
                  size={56}
                  style={{ background: 'linear-gradient(135deg, #6366F1, #A78BFA)', fontSize: 22, fontWeight: 700, flexShrink: 0 }}
                >
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </Avatar>
                <div>
                  <Text strong style={{ fontSize: 17, color: '#0F172A', display: 'block' }}>
                    {user?.display_name || user?.username}
                  </Text>
                  <Text style={{ color: '#64748B', fontSize: 13 }}>@{user?.username}</Text>
                </div>
              </div>

              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div>
                  <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                    Username
                  </Text>
                  <Text style={{ color: '#1E293B', fontSize: 14 }}>{user?.username}</Text>
                </div>
                <div>
                  <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                    Email
                  </Text>
                  <Text style={{ color: '#1E293B', fontSize: 14 }}>{user?.email}</Text>
                </div>
                <div>
                  <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                    Display Name
                  </Text>
                  <Text style={{ color: '#1E293B', fontSize: 14 }}>{user?.display_name || '—'}</Text>
                </div>
              </Space>
            </Card>
          ),
        },
        {
          key: 'tokens',
          label: <><KeyOutlined /> API Tokens</>,
          children: (
            <Card style={{ borderRadius: 12 }}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ color: '#0F172A' }}>API Tokens</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 13, display: 'block' }}>
                    Tokens for CLI and automation access
                  </Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setCreateModalOpen(true); setNewTokenValue(''); }}>
                  Create Token
                </Button>
              </div>
              {!tokens?.length ? (
                <Empty description="No API tokens yet" style={{ margin: '40px 0' }} />
              ) : (
                <Table
                  dataSource={tokens}
                  columns={tokenColumns}
                  rowKey="id"
                  pagination={false}
                />
              )}
            </Card>
          ),
        },
      ]} />

      <Modal
        title={newTokenValue ? 'Token Created' : 'Create API Token'}
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
        footer={newTokenValue ? [
          <Button key="close" onClick={() => { setCreateModalOpen(false); form.resetFields(); }}>Close</Button>
        ] : undefined}
        onOk={newTokenValue ? undefined : () => form.submit()}
        confirmLoading={createToken.isPending}
      >
        {newTokenValue ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px' }}>
              <Text style={{ color: '#92400E', fontSize: 13 }}>
                Copy this token now — you won't be able to see it again.
              </Text>
            </div>
            <div className="code-block">
              <code style={{ wordBreak: 'break-all' }}>{newTokenValue}</code>
              <button className="copy-btn" onClick={copyToken}><CopyOutlined /> Copy</button>
            </div>
          </Space>
        ) : (
          <Form form={form} layout="vertical" onFinish={(v) => createToken.mutate(v)}>
            <Form.Item name="name" label="Token Name" rules={[{ required: true, message: 'Please enter a name' }]}>
              <Input placeholder="e.g., CI/CD Pipeline" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default Profile;
