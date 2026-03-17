import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Typography, Space } from 'antd';
import {
  AppstoreOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  UploadOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/auth';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, accessToken, logout, fetchUser } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      navigate('/login');
      return;
    }
    if (!user) {
      fetchUser();
    }
  }, [accessToken, user, navigate, fetchUser]);

  const menuItems = [
    { type: 'group' as const, label: 'Main', children: [
      { key: '/', icon: <AppstoreOutlined />, label: 'Catalog' },
      { key: '/organizations', icon: <TeamOutlined />, label: 'Organizations' },
    ]},
    { type: 'group' as const, label: 'Management', children: [
      { key: '/skills/new', icon: <UploadOutlined />, label: 'Upload Skill' },
      { key: '/reviews', icon: <CheckCircleOutlined />, label: 'Review Center' },
      { key: '/audit-logs', icon: <AuditOutlined />, label: 'Audit Log' },
    ]},
    { type: 'group' as const, label: 'Account', children: [
      { key: '/profile', icon: <UserOutlined />, label: 'Profile' },
    ]},
  ];

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: 'Profile' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        width={240}
        breakpoint="lg"
        collapsedWidth="0"
        className="sidebar-gradient"
        style={{ borderRight: 'none' }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <Space>
            <SafetyCertificateOutlined style={{ fontSize: 24, color: '#A5B4FC' }} />
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
              SkillVault
            </Text>
          </Space>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', borderRight: 'none', marginTop: 8 }}
        />
      </Sider>
      <AntLayout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          zIndex: 1,
        }}>
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: ({ key }) => {
                if (key === 'logout') {
                  logout();
                  navigate('/login');
                } else {
                  navigate(`/${key}`);
                }
              },
            }}
            placement="bottomRight"
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                style={{
                  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                  fontWeight: 600,
                }}
              >
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <Text strong style={{ fontSize: 14 }}>{user?.username || 'User'}</Text>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 0, padding: 24, background: '#F8FAFC', minHeight: 280 }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
