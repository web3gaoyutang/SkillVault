import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'status-badge-draft' },
  pending_review: { label: 'Pending Review', className: 'status-badge-pending_review' },
  approved: { label: 'Approved', className: 'status-badge-approved' },
  published: { label: 'Published', className: 'status-badge-published' },
  rejected: { label: 'Rejected', className: 'status-badge-rejected' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] || { label: status, className: 'status-badge-draft' };

  return (
    <span className={`status-badge ${config.className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
