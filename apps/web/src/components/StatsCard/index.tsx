import React from 'react';
import { Card, Typography } from 'antd';

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
      style={{ borderRadius: 12 }}
      bodyStyle={{ padding: 20 }}
      className={className}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: 'rgba(255,255,255,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          {icon}
        </div>
        <div>
          <Text style={{ fontSize: 12, color: '#64748B', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </Text>
          <Title level={3} style={{ margin: '2px 0 0', fontWeight: 700, lineHeight: 1.2 }}>
            {value}
          </Title>
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;
