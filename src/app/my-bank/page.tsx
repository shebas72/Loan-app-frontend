'use client';

import { useState, useEffect } from 'react';
import RequireAuth from '@/components/RequireAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient, ApiError } from '@/lib/api';
import { Tenant } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function MyBankPage() {
  const { token } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    apiClient<{ data: Tenant }>('/tenants/mine', { token })
      .then((response) => setTenant(response.data))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load bank details.'),
      )
      .finally(() => setIsLoading(false));
  }, [token]);

  return (
    <RequireAuth>
      <DashboardLayout>
        <div className="page-title">
          <h4>My Bank</h4>
        </div>

        <div className="card">
          <div className="card-body">
            {isLoading ? (
              <p className="text-muted mb-0">Loading...</p>
            ) : error || !tenant ? (
              <p className="text-danger mb-0">{error ?? 'No bank information found.'}</p>
            ) : (
              <div className="d-flex align-items-start gap-4">
                {tenant.logo_url && (
                  <img
                    src={tenant.logo_url}
                    alt={`${tenant.name} logo`}
                    style={{ width: 80, height: 80, objectFit: 'contain' }}
                  />
                )}
                <div>
                  <h5>{tenant.name}</h5>
                  <div className="text-muted small mb-1">
                    {tenant.address ?? 'No address on file.'}
                  </div>
                  <div className="text-muted small mb-1">
                    {tenant.phone ?? 'No phone on file.'}
                  </div>
                  <div className="text-muted small">
                    {tenant.support_email ? (
                      <a href={`mailto:${tenant.support_email}`}>{tenant.support_email}</a>
                    ) : (
                      'No support email on file.'
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </RequireAuth>
  );
}