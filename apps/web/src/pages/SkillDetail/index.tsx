import React from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Tag, Table, Spin, Tabs, Card, Space, Button, message } from 'antd';
import { CopyOutlined, DownloadOutlined, CodeOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { skillAPI } from '../../api/skill';
import { versionAPI } from '../../api/version';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';

const { Text, Paragraph } = Typography;

const SkillDetail: React.FC = () => {
  const { org, name } = useParams<{ org: string; name: string }>();

  const { data: skill, isLoading: skillLoading } = useQuery({
    queryKey: ['skill', org, name],
    queryFn: () => skillAPI.get(org!, name!),
    enabled: !!org && !!name,
  });

  const { data: versions } = useQuery({
    queryKey: ['versions', org, name],
    queryFn: () => versionAPI.list(org!, name!),
    enabled: !!org && !!name,
  });

  const copyInstallCommand = () => {
    navigator.clipboard.writeText(`skillvault install ${org}/${name}`);
    message.success('Copied to clipboard');
  };

  if (skillLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  return (
    <div>
      <PageHeader
        title={skill?.display_name || skill?.name || ''}
        breadcrumbs={[
          { label: 'Catalog', path: '/app' },
          { label: `${org}/${name}` },
        ]}
      />

      {/* Info header — light card style */}
      <div className="gradient-header">
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <Space size={6}>
            <CodeOutlined style={{ fontSize: 14, color: '#94A3B8' }} />
            <Text style={{ color: '#64748B', fontSize: 13 }}>
              {org}/{name}
            </Text>
          </Space>
          <Paragraph style={{ color: '#1E293B', fontSize: 15, margin: 0, maxWidth: 600, lineHeight: 1.6 }}>
            {skill?.description || 'No description provided'}
          </Paragraph>
          <Space wrap size={6} style={{ marginTop: 4 }}>
            {skill?.tags?.map((t) => (
              <Tag key={t} style={{
                background: '#F0FDF4',
                color: '#059669',
                border: '1px solid #D1FAE5',
                borderRadius: 20,
                fontSize: 12,
                margin: 0,
              }}>
                {t}
              </Tag>
            ))}
          </Space>
          <Space wrap size={8} style={{ marginTop: 4 }}>
            <Tag style={{ background: '#EEF2FF', color: '#6366F1', border: '1px solid #E0E7FF', borderRadius: 20, margin: 0 }}>
              {skill?.visibility}
            </Tag>
            {skill?.latest_version && (
              <Tag style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: 20, margin: 0 }}>
                v{skill.latest_version}
              </Tag>
            )}
            <Space size={4}>
              <DownloadOutlined style={{ color: '#94A3B8', fontSize: 12 }} />
              <Text style={{ color: '#64748B', fontSize: 13 }}>{skill?.download_count || 0} downloads</Text>
            </Space>
          </Space>
        </Space>
      </div>

      <Tabs
        items={[
          {
            key: 'overview',
            label: 'Overview',
            children: (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Card title="Install" style={{ borderRadius: 12 }}>
                  <div className="code-block">
                    <code>skillvault install {org}/{name}</code>
                    <button className="copy-btn" onClick={copyInstallCommand}>
                      <CopyOutlined /> Copy
                    </button>
                  </div>
                </Card>
                <Card title="Details" style={{ borderRadius: 12 }}>
                  <Space direction="vertical" size={10}>
                    <div>
                      <Text style={{ color: '#64748B', fontSize: 13 }}>Runtimes</Text>
                      <div style={{ marginTop: 4 }}>
                        {skill?.runtimes?.map(r => (
                          <Tag key={r} style={{ borderRadius: 20, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569' }}>{r}</Tag>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Text style={{ color: '#64748B', fontSize: 13 }}>Visibility</Text>
                      <div style={{ marginTop: 4 }}>
                        <Tag style={{ borderRadius: 20, background: '#EEF2FF', border: '1px solid #E0E7FF', color: '#6366F1' }}>
                          {skill?.visibility}
                        </Tag>
                      </div>
                    </div>
                    <div>
                      <Text style={{ color: '#64748B', fontSize: 13 }}>Latest Version</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text style={{ fontWeight: 500, color: '#0F172A' }}>{skill?.latest_version || 'None'}</Text>
                      </div>
                    </div>
                  </Space>
                </Card>
              </Space>
            ),
          },
          {
            key: 'versions',
            label: `Versions (${versions?.length || 0})`,
            children: (
              <Card style={{ borderRadius: 12 }}>
                <Table
                  dataSource={versions || []}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: 'Version', dataIndex: 'version', render: (v: string) => <Text strong style={{ color: '#0F172A' }}>v{v}</Text> },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      render: (status: string) => <StatusBadge status={status} />,
                    },
                    { title: 'Size', dataIndex: 'artifact_size', render: (v: number) => v ? `${(v / 1024).toFixed(1)} KB` : '-' },
                    { title: 'Changelog', dataIndex: 'changelog', ellipsis: true },
                    { title: 'Created', dataIndex: 'created_at', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
                    { title: 'Published', dataIndex: 'published_at', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default SkillDetail;
