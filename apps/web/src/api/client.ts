import axios from 'axios';
import { useAuthStore } from '../store/auth';
import { isMockEnabled, installMockInterceptor, installFetchMock } from '../mock/handlers';

const client = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Enable mock mode when VITE_MOCK=true or localStorage.mock=true
if (isMockEnabled()) {
  installMockInterceptor(client);
  installFetchMock();
  console.log(
    '%c[SkillVault] Mock mode enabled — API calls return mock data',
    'color: #7C3AED; font-weight: bold;',
  );
}

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
