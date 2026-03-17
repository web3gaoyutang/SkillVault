import React from 'react';
import { Typography, Space, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';

const { Title } = Typography;

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  extra?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, breadcrumbs, extra }) => {
  return (
    <div style={{ marginBottom: 24 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb style={{ marginBottom: 8 }}>
          {breadcrumbs.map((item, index) => (
            <Breadcrumb.Item key={index}>
              {item.path ? <Link to={item.path}>{item.label}</Link> : item.label}
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
          {title}
        </Title>
        {extra && <Space>{extra}</Space>}
      </div>
    </div>
  );
};

export default PageHeader;
