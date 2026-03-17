import client from './client';
import type { Organization, OrgMember } from '../types';

export const organizationAPI = {
  list() {
    return client.get<unknown, Organization[]>('/organizations');
  },
  get(name: string) {
    return client.get<unknown, Organization>(`/organizations/${name}`);
  },
  create(data: Partial<Organization>) {
    return client.post<unknown, { id: number; name: string }>('/organizations', data);
  },
  update(name: string, data: Partial<Organization>) {
    return client.put(`/organizations/${name}`, data);
  },
  delete(name: string) {
    return client.delete(`/organizations/${name}`);
  },
  listMembers(orgName: string) {
    return client.get<unknown, OrgMember[]>(`/organizations/${orgName}/members`);
  },
  addMember(orgName: string, userId: number, role: string) {
    return client.post(`/organizations/${orgName}/members`, { user_id: userId, role });
  },
  updateMember(orgName: string, userId: number, role: string) {
    return client.put(`/organizations/${orgName}/members/${userId}`, { role });
  },
  removeMember(orgName: string, userId: number) {
    return client.delete(`/organizations/${orgName}/members/${userId}`);
  },
};
