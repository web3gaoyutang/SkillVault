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
    { title: 'User', dataIndex: 'username', render: (v: string, r: OrgMember) => (
      <Space><Text strong>{v}</Text><Text type="secondary">{r.email}</Text></Space>
    )},
    { title: 'Role', dataIndex: 'role', render: (role: string, record: OrgMember) => (
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
    )},
    { title: 'Joined', dataIndex: 'created_at', render: (v: string) => v ? new Date(v).toLocaleDateString() : '-' },
    { title: '', key: 'actions', render: (_: unknown, record: OrgMember) => (
      record.role !== 'owner' && (
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeMember.mutate(record.user_id)} />
      )
    )},
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

      <div className="gradient-header">
        <Space direction="vertical" size={4}>
          <Space>
            <TeamOutlined style={{ fontSize: 20 }} />
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>@{org}</Text>
          </Space>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15 }}>
            {orgData?.description || 'No description'}
          </Text>
          <Space style={{ marginTop: 8 }}>
            <Tag style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}>
              {members?.length || 0} members
            </Tag>
            <Tag style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}>
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
            <Empty description="No skills in this organization" />
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
            <Text>User ID</Text>
            <Input value={newMemberId} onChange={e => setNewMemberId(e.target.value)} placeholder="Enter user ID" />
          </div>
          <div>
            <Text>Role</Text>
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
