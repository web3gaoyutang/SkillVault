import React from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Tag, Table, Spin, Tabs, Card, Space, Button, message } from 'antd';
import { CopyOutlined, DownloadOutlined, CloudOutlined } from '@ant-design/icons';
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
          { label: 'Catalog', path: '/' },
          { label: `${org}/${name}` },
        ]}
      />

      {/* Hero section */}
      <div className="gradient-header">
        <Space direction="vertical" size={8}>
          <Space>
            <CloudOutlined style={{ fontSize: 20 }} />
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
              {org}/{name}
            </Text>
          </Space>
          <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, margin: 0, maxWidth: 600 }}>
            {skill?.description || 'No description provided'}
          </Paragraph>
          <Space style={{ marginTop: 8 }}>
            {skill?.tags?.map((t) => (
              <Tag key={t} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 12 }}>
                {t}
              </Tag>
            ))}
          </Space>
          <Space style={{ marginTop: 8 }}>
            <Tag color="blue">{skill?.visibility}</Tag>
            {skill?.latest_version && <Tag color="green">v{skill.latest_version}</Tag>}
            <Space size={4}>
              <DownloadOutlined style={{ color: 'rgba(255,255,255,0.7)' }} />
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{skill?.download_count || 0} downloads</Text>
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
                  <Space direction="vertical" size={8}>
                    <div><Text strong>Runtimes: </Text>{skill?.runtimes?.map(r => <Tag key={r}>{r}</Tag>)}</div>
                    <div><Text strong>Visibility: </Text><Tag>{skill?.visibility}</Tag></div>
                    <div><Text strong>Latest Version: </Text><Text>{skill?.latest_version || 'None'}</Text></div>
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
                    { title: 'Version', dataIndex: 'version', render: (v: string) => <Text strong>v{v}</Text> },
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
