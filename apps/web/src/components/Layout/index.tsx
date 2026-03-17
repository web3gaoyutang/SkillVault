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
  HomeOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/auth';

const { Sider, Header, Content } = AntLayout;
const { Text } = Typography;

const LogoMark: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect x="2" y="2" width="16" height="16" rx="4" fill="#6366F1" fillOpacity="0.15" stroke="#6366F1" strokeWidth="1.5" />
    <rect x="10" y="10" width="16" height="16" rx="4" fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="1.5" />
  </svg>
);

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

  // Menu keys mirror the /app/* path segments
  const menuItems = [
    {
      type: 'group' as const,
      label: 'DISCOVER',
      children: [
        { key: '/app', icon: <AppstoreOutlined />, label: 'Catalog' },
        { key: '/app/organizations', icon: <TeamOutlined />, label: 'Organizations' },
      ],
    },
    {
      type: 'group' as const,
      label: 'MANAGE',
      children: [
        { key: '/app/skills/new', icon: <UploadOutlined />, label: 'Upload Skill' },
        { key: '/app/reviews', icon: <CheckCircleOutlined />, label: 'Review Center' },
        { key: '/app/audit-logs', icon: <AuditOutlined />, label: 'Audit Log' },
      ],
    },
    {
      type: 'group' as const,
      label: 'ACCOUNT',
      children: [
        { key: '/app/profile', icon: <UserOutlined />, label: 'Profile' },
      ],
    },
  ];

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: 'Profile' },
    { type: 'divider' as const },
    { key: 'home', icon: <HomeOutlined />, label: 'Home page' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sign out', danger: true },
  ];

  // Determine selected key: /app/skills/:org/:name → /app (catalog)
  const selectedKey = (() => {
    const p = location.pathname;
    if (p === '/app' || p === '/app/') return '/app';
    // Match longest menu key that is a prefix of current path
    const keys = [
      '/app/skills/new', '/app/reviews', '/app/audit-logs',
      '/app/profile', '/app/organizations',
    ];
    for (const k of keys) {
      if (p.startsWith(k)) return k;
    }
    return '/app';
  })();

  const avatarLetter = user?.username?.[0]?.toUpperCase() || 'U';

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        width={232}
        breakpoint="lg"
        collapsedWidth="0"
        className="sidebar-light"
        style={{ position: 'fixed', height: '100vh', left: 0, top: 0, bottom: 0, zIndex: 100 }}
      >
        {/* Logo */}
        <div
          style={{
            height: 60, display: 'flex', alignItems: 'center',
            padding: '0 20px', borderBottom: '1px solid #E2E8F0',
            gap: 10, cursor: 'pointer',
          }}
          onClick={() => navigate('/app')}
        >
          <LogoMark />
          <Text style={{ color: '#0F172A', fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>
            SkillVault
          </Text>
        </div>

        {/* Navigation */}
        <div style={{ padding: '12px 0', overflowY: 'auto', height: 'calc(100vh - 60px)' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ background: 'transparent', borderRight: 'none', fontSize: 14 }}
          />
        </div>
      </Sider>

      <AntLayout style={{ marginLeft: 232 }}>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          borderBottom: '1px solid #E2E8F0',
          height: 60,
          position: 'sticky',
          top: 0,
          zIndex: 99,
        }}>
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: ({ key }) => {
                if (key === 'logout') {
                  logout();
                  navigate('/login');
                } else if (key === 'home') {
                  navigate('/');
                } else {
                  navigate(`/app/${key}`);
                }
              },
            }}
            placement="bottomRight"
          >
            <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}>
              <Avatar
                size={32}
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #A78BFA)',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {avatarLetter}
              </Avatar>
              <Text style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
                {user?.username || 'User'}
              </Text>
            </Space>
          </Dropdown>
        </Header>

        <Content style={{ margin: 0, padding: 28, background: '#F8FAFC', minHeight: 'calc(100vh - 60px)' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
