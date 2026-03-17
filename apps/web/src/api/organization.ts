import client from './client';
import type { Organization } from '../types';

export const organizationAPI = {
  list() {
    return client.get<unknown, Organization[]>('/organizations');
  },
  get(name: string) {
    return client.get<unknown, Organization>(`/organizations/${name}`);
  },
  create(data: Partial<Organization>) {
    return client.post<unknown, { id: number }>('/organizations', data);
  },
  update(name: string, data: Partial<Organization>) {
    return client.put(`/organizations/${name}`, data);
  },
  delete(name: string) {
    return client.delete(`/organizations/${name}`);
  },
};
