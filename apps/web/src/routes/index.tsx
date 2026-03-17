import React, { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import Layout from '../components/Layout';

const Landing = lazy(() => import('../pages/Landing'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const Catalog = lazy(() => import('../pages/Catalog'));
const SkillDetail = lazy(() => import('../pages/SkillDetail'));
const Organization = lazy(() => import('../pages/Organization'));
const OrganizationDetail = lazy(() => import('../pages/OrganizationDetail'));
const Profile = lazy(() => import('../pages/Profile'));
const SkillUpload = lazy(() => import('../pages/SkillUpload'));
const ReviewCenter = lazy(() => import('../pages/ReviewCenter'));
const AuditLog = lazy(() => import('../pages/AuditLog'));

export const routes: RouteObject[] = [
  // ── Public routes ──────────────────────────────────────────────
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },

  // ── Authenticated app (all under /app) ─────────────────────────
  {
    path: '/app',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Catalog />,
      },
      {
        path: 'skills/new',
        element: <SkillUpload />,
      },
      {
        path: 'skills/:org/:name',
        element: <SkillDetail />,
      },
      {
        path: 'skills/:org/:name/versions/new',
        element: <SkillUpload />,
      },
      {
        path: 'organizations',
        element: <Organization />,
      },
      {
        path: 'organizations/:org',
        element: <OrganizationDetail />,
      },
      {
        path: 'reviews',
        element: <ReviewCenter />,
      },
      {
        path: 'audit-logs',
        element: <AuditLog />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
    ],
  },
];
