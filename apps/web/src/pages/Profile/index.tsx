import React from 'react';
import { Card, Tabs, Descriptions, Typography, Spin, Table, Button, Space, Modal, Form, Input, message, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, KeyOutlined, CopyOutlined } from '@ant-design/icons';
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
    { title: 'Name', dataIndex: 'name' },
    { title: 'Prefix', dataIndex: 'token_prefix', render: (v: string) => <Text code>{v}...</Text> },
    { title: 'Last Used', dataIndex: 'last_used_at', render: (v: string) => v ? new Date(v).toLocaleDateString() : 'Never' },
    { title: 'Created', dataIndex: 'created_at', render: (v: string) => new Date(v).toLocaleDateString() },
    { title: '', key: 'actions', render: (_: unknown, record: APIToken) => (
      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => deleteToken.mutate(record.id)} />
    )},
  ];

  return (
    <div>
      <PageHeader title="Profile" />

      <Tabs items={[
        {
          key: 'info',
          label: 'Profile Info',
          children: (
            <Card style={{ borderRadius: 12 }}>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Username">{user?.username}</Descriptions.Item>
                <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
                <Descriptions.Item label="Display Name">{user?.display_name || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>
          ),
        },
        {
          key: 'tokens',
          label: <><KeyOutlined /> API Tokens</>,
          children: (
            <Card style={{ borderRadius: 12 }}>
              <div style={{ marginBottom: 16, textAlign: 'right' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setCreateModalOpen(true); setNewTokenValue(''); }}>
                  Create Token
                </Button>
              </div>
              {!tokens?.length ? (
                <Empty description="No API tokens" />
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
            <Text type="warning" strong>Copy this token now. You won't be able to see it again.</Text>
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
