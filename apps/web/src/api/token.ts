import client from './client';
import type { APIToken } from '../types';

export const tokenAPI = {
  create(name: string, scopes?: string[]) {
    return client.post<unknown, { id: number; name: string; token: string; token_prefix: string; created_at: string }>('/tokens', { name, scopes });
  },
  list() {
    return client.get<unknown, APIToken[]>('/tokens');
  },
  delete(id: number) {
    return client.delete(`/tokens/${id}`);
  },
};
