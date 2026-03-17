import React from 'react';
import { Card, Tag, Typography, Space } from 'antd';
import { DownloadOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Skill } from '../../types';

const { Text, Paragraph } = Typography;

interface SkillCardProps {
  skill: Skill;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill }) => {
  const navigate = useNavigate();

  return (
    <Card
      className="skill-card"
      hoverable
      onClick={() => navigate(`/skills/${skill.org_name}/${skill.name}`)}
      style={{ height: '100%', borderRadius: 12 }}
      bodyStyle={{ padding: 20 }}
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Text strong style={{ fontSize: 16 }}>
          {skill.display_name || skill.name}
        </Text>
        <Space size={4}>
          <TeamOutlined style={{ color: '#6B7280', fontSize: 12 }} />
          <Text type="secondary" style={{ fontSize: 13 }}>
            {skill.org_name}/{skill.name}
          </Text>
        </Space>
        <Paragraph
          ellipsis={{ rows: 2 }}
          style={{ marginBottom: 8, color: '#6B7280', fontSize: 13 }}
        >
          {skill.description || 'No description'}
        </Paragraph>
        <div>
          {skill.tags?.slice(0, 3).map((tag) => (
            <Tag
              key={tag}
              style={{
                borderRadius: 12,
                background: '#EDE9FE',
                color: '#5B21B6',
                border: 'none',
                fontSize: 12,
              }}
            >
              {tag}
            </Tag>
          ))}
          {skill.tags?.length > 3 && (
            <Tag style={{ borderRadius: 12, fontSize: 12 }}>+{skill.tags.length - 3}</Tag>
          )}
        </div>
        <Space style={{ marginTop: 4 }}>
          <Space size={4}>
            <DownloadOutlined style={{ color: '#9CA3AF', fontSize: 12 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {skill.download_count || 0}
            </Text>
          </Space>
          {skill.latest_version && (
            <Tag color="green" style={{ borderRadius: 8, fontSize: 11 }}>
              v{skill.latest_version}
            </Tag>
          )}
        </Space>
      </Space>
    </Card>
  );
};

export default SkillCard;
