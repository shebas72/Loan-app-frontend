export const ROLES = ['applicant', 'loan_officer', 'bank_admin', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  applicant: 'Applicant',
  loan_officer: 'Loan Officer',
  bank_admin: 'Bank Admin',
  admin: 'Platform Admin',
};

export const isStaff = (role?: Role) =>
  role === 'loan_officer' || role === 'bank_admin';

export interface User {
  id: number;
  tenant_id: string | null;
  name: string;
  email: string;
  role: Role;
}

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface TenantOption {
  id: string;
  name: string;
}

export type LoanStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'appealed'
  | 'disbursed';

export interface LoanApplication {
  id: string;
  amount: string;
  purpose: string;
  status: LoanStatus;
  applicant: {
    id: number;
    name: string;
    email: string;
  };
  assignee?: {
    id: number;
    name: string;
  } | null;
  can_transition: boolean;
  next_statuses: LoanStatus[];
  documents_count?: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    total: number;
    per_page: number;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface StatusTransition {
  id: string;
  from_status: LoanStatus | null;
  to_status: LoanStatus;
  comment: string | null;
  changed_by: { id: number; name: string };
  created_at: string;
}

export interface Document {
  id: string;
  type: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  url: string;
  uploaded_by: { id: number; name: string };
  created_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  support_email: string | null;
  logo_url: string | null;
}