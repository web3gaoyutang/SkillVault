import React from 'react';
import { Card, List, Button, Typography, Empty, Spin } from 'antd';
import { PlusOutlined, TeamOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { organizationAPI } from '../../api/organization';

const { Title } = Typography;

const Organization: React.FC = () => {
  const { data: orgs, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationAPI.list(),
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>My Organizations</Title>
        <Button type="primary" icon={<PlusOutlined />}>Create Organization</Button>
      </div>
      {isLoading ? (
        <Spin style={{ display: 'block', margin: '100px auto' }} />
      ) : !orgs?.length ? (
        <Empty description="No organizations yet" />
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, lg: 3 }}
          dataSource={orgs}
          renderItem={(org) => (
            <List.Item>
              <Card>
                <Card.Meta
                  avatar={<TeamOutlined style={{ fontSize: 24 }} />}
                  title={org.display_name || org.name}
                  description={org.description}
                />
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default Organization;
