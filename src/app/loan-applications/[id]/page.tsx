'use client';

import { useState, useEffect, use } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient, ApiError } from '@/lib/api';
import { LoanApplication, StatusTransition, LoanStatus } from '@/types';
import { statusBadgeClass, statusLabel } from '@/lib/loanStatus';
import { useAuth } from '@/contexts/AuthContext';

const nextStatusOptions: Record<LoanStatus, LoanStatus[]> = {
  draft: ['submitted'],
  submitted: ['under_review', 'rejected'],
  under_review: ['approved', 'rejected'],
  approved: ['disbursed'],
  rejected: [],
  disbursed: [],
};

export default function LoanApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { token, user } = useAuth();

  const [loan, setLoan] = useState<LoanApplication & { status_transitions?: StatusTransition[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<LoanStatus | ''>('');
  const [comment, setComment] = useState('');
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  async function loadLoan() {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await apiClient<{ data: typeof loan }>(`/loan-applications/${id}`, {
        token,
      });
      setLoan(response.data);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load loan application.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadLoan();
    }
  }, [token, id]);

  async function handleTransition() {
    if (!selectedStatus) return;

    setTransitionError(null);
    setIsTransitioning(true);

    try {
      await apiClient(`/loan-applications/${id}/transition`, {
        method: 'POST',
        token,
        body: { to_status: selectedStatus, comment: comment || undefined },
      });

      setSelectedStatus('');
      setComment('');
      await loadLoan();
    } catch (err) {
      setTransitionError(err instanceof ApiError ? err.message : 'Transition failed.');
    } finally {
      setIsTransitioning(false);
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <p className="text-muted">Loading...</p>
      </DashboardLayout>
    );
  }

  if (loadError || !loan) {
    return (
      <DashboardLayout>
        <p className="text-danger">{loadError ?? 'Loan application not found.'}</p>
      </DashboardLayout>
    );
  }

  const availableNextStatuses = nextStatusOptions[loan.status];
  const canTransition = user?.role !== 'applicant' && availableNextStatuses.length > 0;

  return (
    <DashboardLayout>
      <div className="page-title d-flex justify-content-between align-items-center">
        <h4>Loan Application Detail</h4>
        <span className={`badge ${statusBadgeClass[loan.status]}`}>
          {statusLabel[loan.status]}
        </span>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="text-muted small">Applicant</div>
              <div>{loan.applicant.name} ({loan.applicant.email})</div>
            </div>
            <div className="col-md-6">
              <div className="text-muted small">Amount</div>
              <div>${Number(loan.amount).toLocaleString()}</div>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <div className="text-muted small">Purpose</div>
              <div>{loan.purpose}</div>
            </div>
          </div>
        </div>
      </div>

      {canTransition && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="mb-3">Update Status</h5>

            <div className="mb-3">
              <label className="form-label">New Status</label>
              <select
                className="form-control"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as LoanStatus)}
              >
                <option value="" disabled>
                  Select next status...
                </option>
                {availableNextStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel[status]}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Comment (optional)</label>
              <textarea
                className="form-control"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {transitionError && <p className="text-danger small">{transitionError}</p>}

            <button
              className="btn btn-primary"
              onClick={handleTransition}
              disabled={!selectedStatus || isTransitioning}
            >
              {isTransitioning ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <h5 className="mb-3">History</h5>
          {!loan.status_transitions || loan.status_transitions.length === 0 ? (
            <p className="text-muted mb-0">No status changes recorded yet.</p>
          ) : (
            <ul className="list-unstyled mb-0">
              {loan.status_transitions.map((t) => (
                <li key={t.id} className="mb-2 pb-2 border-bottom">
                  <div>
                    <strong>{t.from_status ? statusLabel[t.from_status] : 'Created'}</strong>
                    {' → '}
                    <strong>{statusLabel[t.to_status]}</strong>
                  </div>
                  <div className="text-muted small">
                    by {t.changed_by.name} on {new Date(t.created_at).toLocaleString()}
                  </div>
                  {t.comment && <div className="small">&quot;{t.comment}&quot;</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}