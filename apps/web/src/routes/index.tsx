import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import Layout from '../components/Layout';

const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Catalog = lazy(() => import('../pages/Catalog'));
const SkillDetail = lazy(() => import('../pages/SkillDetail'));
const Organization = lazy(() => import('../pages/Organization'));
const Profile = lazy(() => import('../pages/Profile'));

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Catalog />,
      },
      {
        path: 'skills/:org/:name',
        element: <SkillDetail />,
      },
      {
        path: 'organizations',
        element: <Organization />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
    ],
  },
];
