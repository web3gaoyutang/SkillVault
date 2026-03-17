import React from 'react';
import { Table, Card, Space, Select, Typography, Tag, DatePicker } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { auditAPI } from '../../api/audit';
import PageHeader from '../../components/PageHeader';
import type { AuditLog as AuditLogType } from '../../types';

const { Text } = Typography;

const actionColors: Record<string, string> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  publish: 'purple',
  review: 'orange',
  login: 'cyan',
};

const AuditLog: React.FC = () => {
  const [page, setPage] = React.useState(1);
  const [action, setAction] = React.useState('');
  const [resourceType, setResourceType] = React.useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, action, resourceType],
    queryFn: () => auditAPI.list({ page, page_size: 20, action: action || undefined, resource_type: resourceType || undefined }),
  });

  const columns = [
    {
      title: 'Action',
      dataIndex: 'action',
      render: (v: string) => <Tag color={actionColors[v] || 'default'}>{v}</Tag>,
    },
    {
      title: 'Resource',
      key: 'resource',
      render: (_: unknown, record: AuditLogType) => (
        <Space>
          <Tag>{record.resource_type}</Tag>
          <Text type="secondary">#{record.resource_id}</Text>
        </Space>
      ),
    },
    { title: 'User ID', dataIndex: 'user_id' },
    { title: 'IP', dataIndex: 'ip', render: (v: string) => v || '-' },
    {
      title: 'Detail',
      dataIndex: 'detail',
      ellipsis: true,
      render: (v: Record<string, unknown>) => v ? <Text type="secondary" style={{ fontSize: 12 }}>{JSON.stringify(v)}</Text> : '-',
    },
    {
      title: 'Time',
      dataIndex: 'created_at',
      render: (v: string) => v ? new Date(v).toLocaleString() : '-',
    },
  ];

  return (
    <div>
      <PageHeader title="Audit Log" />

      <Card style={{ borderRadius: 12 }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="Action"
            allowClear
            style={{ width: 140 }}
            onChange={(v) => { setAction(v || ''); setPage(1); }}
            options={[
              { label: 'Create', value: 'create' },
              { label: 'Update', value: 'update' },
              { label: 'Delete', value: 'delete' },
              { label: 'Publish', value: 'publish' },
              { label: 'Review', value: 'review' },
              { label: 'Login', value: 'login' },
            ]}
          />
          <Select
            placeholder="Resource Type"
            allowClear
            style={{ width: 140 }}
            onChange={(v) => { setResourceType(v || ''); setPage(1); }}
            options={[
              { label: 'Skill', value: 'skill' },
              { label: 'Version', value: 'version' },
              { label: 'Organization', value: 'org' },
              { label: 'User', value: 'user' },
            ]}
          />
        </Space>

        <Table
          dataSource={data?.items || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.total || 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>
    </div>
  );
};

export default AuditLog;
