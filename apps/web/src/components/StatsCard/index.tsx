import React from 'react';
import { Card, Typography, Space } from 'antd';

const { Text, Title } = Typography;

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, className }) => {
  return (
    <Card
      style={{ borderRadius: 12, border: 'none' }}
      bodyStyle={{ padding: 20 }}
      className={className}
    >
      <Space size={16} align="start">
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
        }}>
          {icon}
        </div>
        <div>
          <Text style={{ fontSize: 13, color: '#6B7280' }}>{title}</Text>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>{value}</Title>
        </div>
      </Space>
    </Card>
  );
};

export default StatsCard;
