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
      onClick={() => navigate(`/app/skills/${skill.org_name}/${skill.name}`)}
      style={{ height: '100%', borderRadius: 12, border: '1px solid #E2E8F0' }}
      bodyStyle={{ padding: 20 }}
    >
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <Text strong style={{ fontSize: 15, color: '#0F172A' }}>
          {skill.display_name || skill.name}
        </Text>

        <Space size={4}>
          <TeamOutlined style={{ color: '#94A3B8', fontSize: 12 }} />
          <Text style={{ fontSize: 12, color: '#94A3B8' }}>
            {skill.org_name}/{skill.name}
          </Text>
        </Space>

        <Paragraph
          ellipsis={{ rows: 2 }}
          style={{ marginBottom: 4, color: '#64748B', fontSize: 13, lineHeight: 1.55 }}
        >
          {skill.description || 'No description'}
        </Paragraph>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {skill.tags?.slice(0, 3).map((tag) => (
            <Tag
              key={tag}
              style={{
                borderRadius: 20,
                background: '#F0FDF4',
                color: '#059669',
                border: '1px solid #D1FAE5',
                fontSize: 11,
                margin: 0,
                padding: '0 8px',
                lineHeight: '20px',
              }}
            >
              {tag}
            </Tag>
          ))}
          {skill.tags?.length > 3 && (
            <Tag style={{
              borderRadius: 20,
              fontSize: 11,
              margin: 0,
              padding: '0 8px',
              lineHeight: '20px',
              background: '#F8FAFC',
              color: '#94A3B8',
              border: '1px solid #E2E8F0',
            }}>
              +{skill.tags.length - 3}
            </Tag>
          )}
        </div>

        <Space size={8} style={{ marginTop: 2 }}>
          <Space size={4}>
            <DownloadOutlined style={{ color: '#94A3B8', fontSize: 12 }} />
            <Text style={{ fontSize: 12, color: '#94A3B8' }}>
              {skill.download_count || 0}
            </Text>
          </Space>
          {skill.latest_version && (
            <Tag style={{
              borderRadius: 20,
              fontSize: 11,
              margin: 0,
              padding: '0 8px',
              lineHeight: '20px',
              background: '#EEF2FF',
              color: '#6366F1',
              border: '1px solid #E0E7FF',
            }}>
              v{skill.latest_version}
            </Tag>
          )}
        </Space>
      </Space>
    </Card>
  );
};

export default SkillCard;
