import { LoanStatus } from '@/types';

export const statusBadgeClass: Record<LoanStatus, string> = {
  draft: 'badge-soft-info',
  submitted: 'badge-soft-primary',
  under_review: 'badge-soft-warning',
  approved: 'badge-soft-success',
  rejected: 'badge-soft-danger',
  disbursed: 'badge-soft-success',
};

export const statusLabel: Record<LoanStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  disbursed: 'Disbursed',
};