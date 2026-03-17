import client from './client';
import type { Skill, PaginatedResponse } from '../types';

export interface SkillListParams {
  keyword?: string;
  tag?: string;
  runtime?: string;
  page?: number;
  page_size?: number;
}

export const skillAPI = {
  list(params?: SkillListParams) {
    return client.get<unknown, PaginatedResponse<Skill>>('/skills', { params });
  },
  get(org: string, name: string) {
    return client.get<unknown, Skill>(`/skills/${org}/${name}`);
  },
  create(data: Partial<Skill>) {
    return client.post<unknown, { id: number }>('/skills', data);
  },
  update(org: string, name: string, data: Partial<Skill>) {
    return client.put(`/skills/${org}/${name}`, data);
  },
  delete(org: string, name: string) {
    return client.delete(`/skills/${org}/${name}`);
  },
};
