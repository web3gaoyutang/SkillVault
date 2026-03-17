import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import App from './App';
import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#6366F1',
              colorSuccess: '#10B981',
              colorWarning: '#F59E0B',
              colorError: '#EF4444',
              borderRadius: 8,
              colorBgLayout: '#F8FAFC',
              colorBorder: '#E2E8F0',
              colorBorderSecondary: '#F1F5F9',
              colorTextSecondary: '#64748B',
              colorTextTertiary: '#94A3B8',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
              boxShadowSecondary: '0 4px 12px rgba(0,0,0,0.08)',
            },
            components: {
              Card: {
                borderRadiusLG: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              },
              Button: {
                borderRadius: 8,
                controlHeight: 36,
              },
              Menu: {
                itemBg: 'transparent',
                subMenuItemBg: 'transparent',
                itemSelectedBg: '#EEF2FF',
                itemSelectedColor: '#6366F1',
                itemHoverBg: '#F8FAFC',
                itemHoverColor: '#4F46E5',
                groupTitleColor: '#94A3B8',
                groupTitleFontSize: 11,
              },
              Table: {
                headerBg: '#F8FAFC',
                borderColor: '#E2E8F0',
                rowHoverBg: '#F8FAFC',
              },
              Input: {
                borderRadius: 8,
              },
              Select: {
                borderRadius: 8,
              },
              Tabs: {
                inkBarColor: '#6366F1',
                itemSelectedColor: '#6366F1',
                itemHoverColor: '#4F46E5',
              },
            },
          }}
        >
          <App />
        </ConfigProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
