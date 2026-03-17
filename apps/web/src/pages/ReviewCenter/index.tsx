import React from 'react';
import { Table, Card, Button, Space, Typography, Modal, Input, message, Empty, Spin, Tag } from 'antd';
import { CheckOutlined, CloseOutlined, SafetyOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { versionAPI } from '../../api/version';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import type { SkillVersion } from '../../types';

const { Text } = Typography;

const ReviewCenter: React.FC = () => {
  const queryClient = useQueryClient();
  const [reviewModal, setReviewModal] = React.useState<{ version: SkillVersion; action: string } | null>(null);
  const [comment, setComment] = React.useState('');

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['pending-reviews'],
    queryFn: async () => {
      const response = await fetch('/api/v1/reviews', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      return data.data || [];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ org, name, version, action, comment }: {
      org: string; name: string; version: string; action: string; comment: string;
    }) => versionAPI.review(org, name, version, { action, comment }),
    onSuccess: () => {
      message.success('Review submitted');
      setReviewModal(null);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
    },
    onError: (e: Error) => message.error(e.message),
  });

  const columns = [
    {
      title: 'Version',
      dataIndex: 'version',
      render: (v: string) => (
        <Tag style={{ borderRadius: 20, background: '#EEF2FF', border: '1px solid #E0E7FF', color: '#6366F1', margin: 0 }}>
          v{v}
        </Tag>
      ),
    },
    {
      title: 'Skill',
      dataIndex: 'skill_name',
      render: (v: string) => <Text style={{ color: '#0F172A', fontWeight: 500 }}>{v}</Text>,
    },
    {
      title: 'Organization',
      dataIndex: 'org_name',
      render: (v: string) => <Text style={{ color: '#64748B', fontSize: 13 }}>@{v}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: string) => <StatusBadge status={status} />,
    },
    { title: 'Changelog', dataIndex: 'changelog', ellipsis: true },
    {
      title: 'Created',
      dataIndex: 'created_at',
      render: (v: string) => v ? <Text style={{ color: '#94A3B8', fontSize: 13 }}>{new Date(v).toLocaleDateString()}</Text> : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: SkillVersion & { org_name?: string; skill_name?: string }) => (
        <Space size={8}>
          <Button
            size="small"
            icon={<CheckOutlined />}
            onClick={() => setReviewModal({ version: record, action: 'approve' })}
            style={{
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#059669',
              borderRadius: 6,
              fontWeight: 500,
            }}
          >
            Approve
          </Button>
          <Button
            size="small"
            icon={<CloseOutlined />}
            onClick={() => setReviewModal({ version: record, action: 'reject' })}
            style={{
              background: '#FFF1F2',
              border: '1px solid #FECDD3',
              color: '#E11D48',
              borderRadius: 6,
              fontWeight: 500,
            }}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Review Center" />

      <Card style={{ borderRadius: 12 }}>
        {isLoading ? (
          <Spin style={{ display: 'block', margin: '60px auto' }} />
        ) : !reviews?.length ? (
          <Empty
            image={<SafetyOutlined style={{ fontSize: 48, color: '#CBD5E1' }} />}
            description={<Text style={{ color: '#94A3B8' }}>No pending reviews</Text>}
            style={{ margin: '60px 0' }}
          />
        ) : (
          <Table
            dataSource={reviews}
            columns={columns}
            rowKey="id"
            pagination={false}
          />
        )}
      </Card>

      <Modal
        title={reviewModal?.action === 'approve' ? 'Approve Version' : 'Reject Version'}
        open={!!reviewModal}
        onCancel={() => { setReviewModal(null); setComment(''); }}
        onOk={() => {
          if (!reviewModal) return;
          const v = reviewModal.version as SkillVersion & { org_name?: string; skill_name?: string };
          reviewMutation.mutate({
            org: v.org_name || '',
            name: v.skill_name || '',
            version: v.version,
            action: reviewModal.action,
            comment,
          });
        }}
        confirmLoading={reviewMutation.isPending}
        okText={reviewModal?.action === 'approve' ? 'Approve' : 'Reject'}
        okButtonProps={reviewModal?.action === 'reject' ? { danger: true } : {}}
      >
        <Input.TextArea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={reviewModal?.action === 'approve' ? 'Optional approval comment...' : 'Reason for rejection...'}
        />
      </Modal>
    </div>
  );
};

export default ReviewCenter;
