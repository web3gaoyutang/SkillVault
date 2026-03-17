import axios from 'axios';
import { useAuthStore } from '../store/auth';

const client = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => {
    // Unwrap {code, message, data} envelope
    const body = response.data;
    if (body && typeof body === 'object' && 'code' in body && 'data' in body) {
      if (body.code !== 0) {
        return Promise.reject(new Error(body.message || 'Request failed'));
      }
      return body.data;
    }
    return body;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    const msg = error.response?.data?.message || error.message;
    return Promise.reject(new Error(msg));
  },
);

export default client;
