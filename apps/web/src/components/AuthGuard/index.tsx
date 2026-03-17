import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const { accessToken, fetchUser, user } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      navigate('/login');
      return;
    }
    if (!user) {
      fetchUser();
    }
  }, [accessToken, user, navigate, fetchUser]);

  if (!accessToken) return null;

  return <>{children}</>;
};

export default AuthGuard;
