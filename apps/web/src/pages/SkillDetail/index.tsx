import React from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Descriptions, Tag, Table, Badge, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { skillAPI } from '../../api/skill';
import { versionAPI } from '../../api/version';

const { Title } = Typography;

const statusColors: Record<string, string> = {
  draft: 'default',
  pending_review: 'processing',
  approved: 'success',
  published: 'green',
  rejected: 'error',
};

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

  if (skillLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  return (
    <div>
      <Title level={3}>{skill?.display_name || skill?.name}</Title>
      <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Organization">{skill?.org_name}</Descriptions.Item>
        <Descriptions.Item label="Name">{skill?.name}</Descriptions.Item>
        <Descriptions.Item label="Visibility"><Tag>{skill?.visibility}</Tag></Descriptions.Item>
        <Descriptions.Item label="Latest Version">{skill?.latest_version || '-'}</Descriptions.Item>
        <Descriptions.Item label="Downloads">{skill?.download_count}</Descriptions.Item>
        <Descriptions.Item label="Runtimes">
          {skill?.runtimes?.map((r) => <Tag key={r}>{r}</Tag>)}
        </Descriptions.Item>
        <Descriptions.Item label="Description" span={2}>{skill?.description}</Descriptions.Item>
      </Descriptions>

      <Title level={4}>Install</Title>
      <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
        skillvault install {org}/{name}
      </pre>

      <Title level={4}>Versions</Title>
      <Table
        dataSource={versions || []}
        rowKey="id"
        columns={[
          { title: 'Version', dataIndex: 'version' },
          {
            title: 'Status',
            dataIndex: 'status',
            render: (status: string) => <Badge status={statusColors[status] as any} text={status} />,
          },
          { title: 'Size', dataIndex: 'artifact_size', render: (v: number) => v ? `${(v / 1024).toFixed(1)} KB` : '-' },
          { title: 'Published', dataIndex: 'published_at', render: (v: string) => v || '-' },
        ]}
        pagination={false}
      />
    </div>
  );
};

export default SkillDetail;
