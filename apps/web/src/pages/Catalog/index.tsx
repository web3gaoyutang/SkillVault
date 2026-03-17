import React from 'react';
import { Input, Row, Col, Card, Tag, Typography, Empty, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { skillAPI } from '../../api/skill';

const { Search } = Input;
const { Text, Paragraph } = Typography;

const Catalog: React.FC = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = React.useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['skills', keyword],
    queryFn: () => skillAPI.list({ keyword, page: 1, page_size: 20 }),
  });

  return (
    <div>
      <Search
        placeholder="Search skills..."
        prefix={<SearchOutlined />}
        size="large"
        style={{ marginBottom: 24 }}
        onSearch={setKeyword}
        allowClear
      />
      {isLoading ? (
        <Spin style={{ display: 'block', margin: '100px auto' }} />
      ) : !data?.items?.length ? (
        <Empty description="No skills found" />
      ) : (
        <Row gutter={[16, 16]}>
          {data.items.map((skill) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={skill.id}>
              <Card
                hoverable
                onClick={() => navigate(`/skills/${skill.org_name}/${skill.name}`)}
              >
                <Card.Meta
                  title={skill.display_name || skill.name}
                  description={
                    <>
                      <Text type="secondary">{skill.org_name}/{skill.name}</Text>
                      <Paragraph ellipsis={{ rows: 2 }} style={{ marginTop: 8, marginBottom: 8 }}>
                        {skill.description}
                      </Paragraph>
                      <div>
                        {skill.tags?.map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </div>
                    </>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default Catalog;
