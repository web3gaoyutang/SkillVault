import client from './client';
import type { LoginParams, RegisterParams, AuthResponse, UserInfo } from '../types';

export const authAPI = {
  login(params: LoginParams) {
    return client.post<unknown, AuthResponse>('/auth/login', params);
  },
  register(params: RegisterParams) {
    return client.post<unknown, { id: number }>('/auth/register', params);
  },
  refreshToken(refreshToken: string) {
    return client.post<unknown, AuthResponse>('/auth/refresh', { refresh_token: refreshToken });
  },
  logout() {
    return client.post('/auth/logout');
  },
  getMe() {
    return client.get<unknown, UserInfo>('/auth/me');
  },
};
