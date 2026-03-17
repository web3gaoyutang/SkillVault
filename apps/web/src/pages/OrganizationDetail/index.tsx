import React from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, Card, Row, Col, Table, Tag, Button, Space, Typography, Spin, Empty, message, Modal, Select, Input } from 'antd';
import { TeamOutlined, AppstoreOutlined, SettingOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationAPI } from '../../api/organization';
import { skillAPI } from '../../api/skill';
import PageHeader from '../../components/PageHeader';
import SkillCard from '../../components/SkillCard';
import type { OrgMember } from '../../types';

const { Text } = Typography;

const roleBadgeClass: Record<string, string> = {
  owner: 'role-badge-owner',
  admin: 'role-badge-admin',
  developer: 'role-badge-developer',
  viewer: 'role-badge-viewer',
};

const OrganizationDetail: React.FC = () => {
  const { org } = useParams<{ org: string }>();
  const queryClient = useQueryClient();
  const [addMemberOpen, setAddMemberOpen] = React.useState(false);
  const [newMemberId, setNewMemberId] = React.useState('');
  const [newMemberRole, setNewMemberRole] = React.useState('developer');

  const { data: orgData, isLoading } = useQuery({
    queryKey: ['org', org],
    queryFn: () => organizationAPI.get(org!),
    enabled: !!org,
  });

  const { data: members } = useQuery({
    queryKey: ['org-members', org],
    queryFn: () => organizationAPI.listMembers(org!),
    enabled: !!org,
  });

  const { data: skills } = useQuery({
    queryKey: ['org-skills', org],
    queryFn: () => skillAPI.list({ keyword: '', page: 1, page_size: 100 }),
    enabled: !!org,
  });

  const removeMember = useMutation({
    mutationFn: (userId: number) => organizationAPI.removeMember(org!, userId),
    onSuccess: () => {
      message.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['org-members', org] });
    },
    onError: (e: Error) => message.error(e.message),
  });

  const addMember = useMutation({
    mutationFn: () => organizationAPI.addMember(org!, parseInt(newMemberId), newMemberRole),
    onSuccess: () => {
      message.success('Member added');
      setAddMemberOpen(false);
      setNewMemberId('');
      queryClient.invalidateQueries({ queryKey: ['org-members', org] });
    },
    onError: (e: Error) => message.error(e.message),
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      organizationAPI.updateMember(org!, userId, role),
    onSuccess: () => {
      message.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['org-members', org] });
    },
    onError: (e: Error) => message.error(e.message),
  });

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  const orgSkills = skills?.items?.filter(s => s.org_name === org) || [];

  const memberColumns = [
    {
      title: 'User',
      dataIndex: 'username',
      render: (v: string, r: OrgMember) => (
        <Space>
          <Text strong style={{ color: '#0F172A' }}>{v}</Text>
          <Text style={{ color: '#94A3B8', fontSize: 12 }}>{r.email}</Text>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (role: string, record: OrgMember) => (
        <Select
          value={role}
          size="small"
          style={{ width: 120 }}
          onChange={(v) => updateRole.mutate({ userId: record.user_id, role: v })}
          options={[
            { label: 'Owner', value: 'owner' },
            { label: 'Admin', value: 'admin' },
            { label: 'Developer', value: 'developer' },
            { label: 'Viewer', value: 'viewer' },
          ]}
        />
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'created_at',
      render: (v: string) => v ? new Date(v).toLocaleDateString() : '-',
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, record: OrgMember) => (
        record.role !== 'owner' && (
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeMember.mutate(record.user_id)} />
        )
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={orgData?.display_name || orgData?.name || ''}
        breadcrumbs={[
          { label: 'Organizations', path: '/organizations' },
          { label: org || '' },
        ]}
      />

      {/* Light info header */}
      <div className="gradient-header">
        <Space direction="vertical" size={8}>
          <Space size={6}>
            <TeamOutlined style={{ fontSize: 14, color: '#94A3B8' }} />
            <Text style={{ color: '#64748B', fontSize: 13 }}>@{org}</Text>
          </Space>
          <Text style={{ color: '#1E293B', fontSize: 15, fontWeight: 400 }}>
            {orgData?.description || 'No description'}
          </Text>
          <Space size={8} style={{ marginTop: 4 }}>
            <Tag style={{ background: '#F0FDF4', color: '#059669', border: '1px solid #D1FAE5', borderRadius: 20, margin: 0 }}>
              {members?.length || 0} members
            </Tag>
            <Tag style={{ background: '#EEF2FF', color: '#6366F1', border: '1px solid #E0E7FF', borderRadius: 20, margin: 0 }}>
              {orgSkills.length} skills
            </Tag>
          </Space>
        </Space>
      </div>

      <Tabs items={[
        {
          key: 'skills',
          label: <><AppstoreOutlined /> Skills</>,
          children: orgSkills.length === 0 ? (
            <Empty description="No skills in this organization" style={{ margin: '60px 0' }} />
          ) : (
            <Row gutter={[16, 16]}>
              {orgSkills.map(s => (
                <Col xs={24} sm={12} lg={8} key={s.id}>
                  <SkillCard skill={s} />
                </Col>
              ))}
            </Row>
          ),
        },
        {
          key: 'members',
          label: <><TeamOutlined /> Members</>,
          children: (
            <Card style={{ borderRadius: 12 }}>
              <div style={{ marginBottom: 16, textAlign: 'right' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddMemberOpen(true)}>
                  Add Member
                </Button>
              </div>
              <Table
                dataSource={members || []}
                columns={memberColumns}
                rowKey="id"
                pagination={false}
              />
            </Card>
          ),
        },
        {
          key: 'settings',
          label: <><SettingOutlined /> Settings</>,
          children: (
            <Card title="Organization Settings" style={{ borderRadius: 12 }}>
              <Text type="secondary">Organization settings will be available in a future update.</Text>
            </Card>
          ),
        },
      ]} />

      <Modal
        title="Add Member"
        open={addMemberOpen}
        onCancel={() => setAddMemberOpen(false)}
        onOk={() => addMember.mutate()}
        confirmLoading={addMember.isPending}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div>
            <Text style={{ fontSize: 13, color: '#374151', display: 'block', marginBottom: 6 }}>User ID</Text>
            <Input value={newMemberId} onChange={e => setNewMemberId(e.target.value)} placeholder="Enter user ID" />
          </div>
          <div>
            <Text style={{ fontSize: 13, color: '#374151', display: 'block', marginBottom: 6 }}>Role</Text>
            <Select
              value={newMemberRole}
              onChange={setNewMemberRole}
              style={{ width: '100%' }}
              options={[
                { label: 'Admin', value: 'admin' },
                { label: 'Developer', value: 'developer' },
                { label: 'Viewer', value: 'viewer' },
              ]}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default OrganizationDetail;
