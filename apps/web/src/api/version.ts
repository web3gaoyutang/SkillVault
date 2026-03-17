import client from './client';
import type { SkillVersion, ScanResult } from '../types';

export const versionAPI = {
  list(org: string, name: string) {
    return client.get<unknown, SkillVersion[]>(`/skills/${org}/${name}/versions`);
  },
  get(org: string, name: string, version: string) {
    return client.get<unknown, SkillVersion>(`/skills/${org}/${name}/versions/${version}`);
  },
  upload(org: string, name: string, formData: FormData) {
    return client.post(`/skills/${org}/${name}/versions`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  submitForReview(org: string, name: string, version: string) {
    return client.post(`/skills/${org}/${name}/versions/${version}/submit`);
  },
  review(org: string, name: string, version: string, data: { action: string; comment?: string }) {
    return client.post(`/skills/${org}/${name}/versions/${version}/review`, data);
  },
  publish(org: string, name: string, version: string) {
    return client.post(`/skills/${org}/${name}/versions/${version}/publish`);
  },
  download(org: string, name: string, version: string) {
    return client.get(`/skills/${org}/${name}/versions/${version}/download`, {
      responseType: 'blob',
    });
  },
  getScanResults(org: string, name: string, version: string) {
    return client.get<unknown, ScanResult[]>(`/skills/${org}/${name}/versions/${version}/scan`);
  },
};
