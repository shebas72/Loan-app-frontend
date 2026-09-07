export interface User {
  id: number;
  tenant_id: string | null;
  name: string;
  email: string;
  role: 'applicant' | 'loan_officer' | 'underwriter' | 'branch_manager' | 'admin';
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