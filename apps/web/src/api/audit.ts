import client from './client';
import type { AuditLog, PaginatedResponse } from '../types';

export interface AuditListParams {
  page?: number;
  page_size?: number;
  action?: string;
  resource_type?: string;
  org_id?: number;
}

export const auditAPI = {
  list(params?: AuditListParams) {
    return client.get<unknown, PaginatedResponse<AuditLog>>('/audit-logs', { params });
  },
};
