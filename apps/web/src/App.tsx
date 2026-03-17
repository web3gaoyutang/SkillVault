import React, { Suspense } from 'react';
import { useRoutes } from 'react-router-dom';
import { Spin } from 'antd';
import { routes } from './routes';

const App: React.FC = () => {
  const element = useRoutes(routes);
  return (
    <Suspense fallback={<Spin size="large" style={{ display: 'block', margin: '200px auto' }} />}>
      {element}
    </Suspense>
  );
};

export default App;
