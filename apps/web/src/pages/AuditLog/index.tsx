import React from 'react';
import { Table, Card, Space, Select, Typography, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { auditAPI } from '../../api/audit';
import PageHeader from '../../components/PageHeader';
import type { AuditLog as AuditLogType } from '../../types';

const { Text } = Typography;

const actionStyle: Record<string, { bg: string; color: string; border: string }> = {
  create: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  update: { bg: '#EFF6FF', color: '#3B82F6', border: '#BFDBFE' },
  delete: { bg: '#FFF1F2', color: '#E11D48', border: '#FECDD3' },
  publish: { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  review: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  login: { bg: '#ECFEFF', color: '#0891B2', border: '#A5F3FC' },
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
      render: (v: string) => {
        const s = actionStyle[v] || { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' };
        return (
          <Tag style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, margin: 0, fontWeight: 500, fontSize: 12 }}>
            {v}
          </Tag>
        );
      },
    },
    {
      title: 'Resource',
      key: 'resource',
      render: (_: unknown, record: AuditLogType) => (
        <Space size={6}>
          <Tag style={{ background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 20, margin: 0, fontSize: 12 }}>
            {record.resource_type}
          </Tag>
          <Text style={{ color: '#94A3B8', fontSize: 12 }}>#{record.resource_id}</Text>
        </Space>
      ),
    },
    {
      title: 'User ID',
      dataIndex: 'user_id',
      render: (v: number) => <Text style={{ color: '#475569', fontSize: 13 }}>{v}</Text>,
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      render: (v: string) => <Text style={{ color: '#94A3B8', fontSize: 13, fontFamily: 'monospace' }}>{v || '—'}</Text>,
    },
    {
      title: 'Detail',
      dataIndex: 'detail',
      ellipsis: true,
      render: (v: Record<string, unknown>) =>
        v ? <Text style={{ color: '#94A3B8', fontSize: 12, fontFamily: 'monospace' }}>{JSON.stringify(v)}</Text> : '—',
    },
    {
      title: 'Time',
      dataIndex: 'created_at',
      render: (v: string) => v
        ? <Text style={{ color: '#64748B', fontSize: 13 }}>{new Date(v).toLocaleString()}</Text>
        : '—',
    },
  ];

  return (
    <div>
      <PageHeader title="Audit Log" />

      <Card style={{ borderRadius: 12 }}>
        <Space style={{ marginBottom: 20 }} wrap>
          <Select
            placeholder="All Actions"
            allowClear
            style={{ width: 150 }}
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
            placeholder="All Resources"
            allowClear
            style={{ width: 150 }}
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
