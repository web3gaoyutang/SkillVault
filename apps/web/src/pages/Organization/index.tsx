import React from 'react';
import { Card, Row, Col, Button, Typography, Empty, Spin, Modal, Form, Input, message, Space } from 'antd';
import { PlusOutlined, TeamOutlined, RightOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { organizationAPI } from '../../api/organization';
import PageHeader from '../../components/PageHeader';

const { Text, Paragraph } = Typography;

const Organization: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [form] = Form.useForm();

  const { data: orgs, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationAPI.list(),
  });

  const createMutation = useMutation({
    mutationFn: (values: { name: string; display_name: string; description: string }) =>
      organizationAPI.create(values),
    onSuccess: () => {
      message.success('Organization created');
      setModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: (e: Error) => message.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="My Organizations"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            New Organization
          </Button>
        }
      />

      {isLoading ? (
        <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />
      ) : !orgs?.length ? (
        <Empty description="No organizations yet" style={{ margin: '80px 0' }}>
          <Button type="primary" onClick={() => setModalOpen(true)}>Create your first organization</Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {orgs.map((org) => (
            <Col xs={24} sm={12} lg={8} key={org.id}>
              <Card
                hoverable
                className="skill-card"
                onClick={() => navigate(`/organizations/${org.name}`)}
                style={{ borderRadius: 12, border: '1px solid #E2E8F0' }}
                bodyStyle={{ padding: 24 }}
              >
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  <Space size={12} align="start">
                    {/* Soft mint icon badge */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: '#ECFDF5',
                      border: '1px solid #D1FAE5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <TeamOutlined style={{ color: '#059669', fontSize: 18 }} />
                    </div>
                    <div>
                      <Text strong style={{ fontSize: 15, color: '#0F172A' }}>
                        {org.display_name || org.name}
                      </Text>
                      <br />
                      <Text style={{ fontSize: 12, color: '#94A3B8' }}>@{org.name}</Text>
                    </div>
                  </Space>
                  <Paragraph ellipsis={{ rows: 2 }} style={{ color: '#64748B', margin: 0, fontSize: 13 }}>
                    {org.description || 'No description'}
                  </Paragraph>
                  <div style={{ textAlign: 'right' }}>
                    <RightOutlined style={{ color: '#CBD5E1', fontSize: 12 }} />
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title="Create Organization"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate(v)}>
          <Form.Item name="name" label="Name" rules={[{ required: true, pattern: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers, and hyphens only' }]}>
            <Input placeholder="my-org" />
          </Form.Item>
          <Form.Item name="display_name" label="Display Name">
            <Input placeholder="My Organization" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Organization description" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Organization;
