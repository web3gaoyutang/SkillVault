import client from './client';
import type { SkillVersion } from '../types';

export const versionAPI = {
  list(org: string, name: string) {
    return client.get<unknown, SkillVersion[]>(`/skills/${org}/${name}/versions`);
  },
  get(org: string, name: string, version: string) {
    return client.get<unknown, SkillVersion>(`/skills/${org}/${name}/versions/${version}`);
  },
  review(org: string, name: string, version: string, data: { action: string; comment?: string }) {
    return client.post(`/skills/${org}/${name}/versions/${version}/review`, data);
  },
  publish(org: string, name: string, version: string) {
    return client.post(`/skills/${org}/${name}/versions/${version}/publish`);
  },
};
