import React from 'react';
import { Card, Descriptions, Typography, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { authAPI } from '../../api/auth';

const { Title } = Typography;

const Profile: React.FC = () => {
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authAPI.getMe(),
  });

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  return (
    <div>
      <Title level={3}>Profile</Title>
      <Card>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Username">{user?.username}</Descriptions.Item>
          <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
          <Descriptions.Item label="Display Name">{user?.display_name || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default Profile;
