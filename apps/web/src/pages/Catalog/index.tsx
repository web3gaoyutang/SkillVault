import React from 'react';
import { Input, Row, Col, Empty, Spin, Select, Space } from 'antd';
import {
  SearchOutlined,
  AppstoreOutlined,
  CloudUploadOutlined,
  TeamOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { skillAPI } from '../../api/skill';
import SkillCard from '../../components/SkillCard';
import StatsCard from '../../components/StatsCard';
import PageHeader from '../../components/PageHeader';

const { Search } = Input;

const Catalog: React.FC = () => {
  const [keyword, setKeyword] = React.useState('');
  const [tag, setTag] = React.useState('');
  const [runtime, setRuntime] = React.useState('');
  const [page, setPage] = React.useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['skills', keyword, tag, runtime, page],
    queryFn: () => skillAPI.list({ keyword, tag, runtime, page, page_size: 20 }),
  });

  const totalSkills = data?.total || 0;

  return (
    <div>
      <PageHeader title="Skill Catalog" />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <StatsCard
            title="Total Skills"
            value={totalSkills}
            icon={<AppstoreOutlined style={{ color: '#7C3AED' }} />}
            className="stats-card-purple"
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatsCard
            title="Published"
            value={data?.items?.filter(s => s.latest_version).length || 0}
            icon={<CloudUploadOutlined style={{ color: '#2563EB' }} />}
            className="stats-card-blue"
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatsCard
            title="Organizations"
            value={new Set(data?.items?.map(s => s.org_name)).size || 0}
            icon={<TeamOutlined style={{ color: '#059669' }} />}
            className="stats-card-green"
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatsCard
            title="Downloads"
            value={data?.items?.reduce((sum, s) => sum + (s.download_count || 0), 0) || 0}
            icon={<DownloadOutlined style={{ color: '#D97706' }} />}
            className="stats-card-amber"
          />
        </Col>
      </Row>

      <Space style={{ marginBottom: 24, width: '100%' }} direction="vertical" size={12}>
        <Row gutter={12}>
          <Col flex="auto">
            <Search
              placeholder="Search skills by name, description..."
              prefix={<SearchOutlined />}
              size="large"
              onSearch={setKeyword}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col>
            <Select
              placeholder="Runtime"
              allowClear
              style={{ width: 140 }}
              size="large"
              onChange={(v) => setRuntime(v || '')}
              options={[
                { label: 'OpenClaw', value: 'openclaw' },
                { label: 'Claude', value: 'claude' },
              ]}
            />
          </Col>
          <Col>
            <Select
              placeholder="Tag"
              allowClear
              style={{ width: 140 }}
              size="large"
              onChange={(v) => setTag(v || '')}
              options={[
                { label: 'Database', value: 'database' },
                { label: 'Security', value: 'security' },
                { label: 'Testing', value: 'testing' },
                { label: 'DevOps', value: 'devops' },
              ]}
            />
          </Col>
        </Row>
      </Space>

      {isLoading ? (
        <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />
      ) : !data?.items?.length ? (
        <Empty description="No skills found" style={{ margin: '80px 0' }} />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {data.items.map((skill) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={skill.id}>
                <SkillCard skill={skill} />
              </Col>
            ))}
          </Row>
          {data.total > 20 && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Space>
                {page > 1 && (
                  <a onClick={() => setPage(page - 1)}>Previous</a>
                )}
                <span>Page {page} of {Math.ceil(data.total / 20)}</span>
                {page * 20 < data.total && (
                  <a onClick={() => setPage(page + 1)}>Next</a>
                )}
              </Space>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Catalog;
