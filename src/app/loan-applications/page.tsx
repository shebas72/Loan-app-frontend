'use client';

import { useState, useEffect, FormEvent } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient, ApiError } from '@/lib/api';
import { LoanApplication, PaginatedResponse } from '@/types';
import { statusBadgeClass, statusLabel } from '@/lib/loanStatus';
import { useAuth } from '@/contexts/AuthContext';

export default function LoanApplicationsPage() {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { token, user } = useAuth();

  async function loadLoans() {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await apiClient<PaginatedResponse<LoanApplication>>(
        '/loan-applications',
        { token },
      );
      setLoans(response.data);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load loan applications.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadLoans();
    }
  }, [token]);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormErrors({});
    setIsSubmitting(true);

    try {
      await apiClient<{ data: LoanApplication }>('/loan-applications', {
        method: 'POST',
        token,
        body: { amount: Number(amount), purpose },
      });

      setAmount('');
      setPurpose('');
      setShowForm(false);
      await loadLoans();
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setFormErrors(err.errors);
      } else {
        setFormErrors({ general: ['Something went wrong. Please try again.'] });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="page-title d-flex justify-content-between align-items-center">
        <h4>Loan Applications</h4>
        {user?.role === 'applicant' && (
          <button className="btn btn-primary" onClick={() => setShowForm((prev) => !prev)}>
            {showForm ? 'Cancel' : 'New Application'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="mb-3">New Loan Application</h5>
            <form onSubmit={handleCreate}>
              <div className="mb-3">
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="25000"
                  min="100"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                {formErrors.amount && (
                  <p className="text-danger small mb-0">{formErrors.amount[0]}</p>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Purpose</label>
                <textarea
                  className="form-control"
                  placeholder="What is this loan for?"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                />
                {formErrors.purpose && (
                  <p className="text-danger small mb-0">{formErrors.purpose[0]}</p>
                )}
              </div>

              {formErrors.general && (
                <p className="text-danger small">{formErrors.general[0]}</p>
              )}

              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <p className="p-4 mb-0 text-muted">Loading...</p>
          ) : loadError ? (
            <p className="p-4 mb-0 text-danger">{loadError}</p>
          ) : loans.length === 0 ? (
            <p className="p-4 mb-0 text-muted">No loan applications yet.</p>
          ) : (
            <table className="table table-admin mb-0">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Amount</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id}>
                    <td>{loan.applicant.name}</td>
                    <td>${Number(loan.amount).toLocaleString()}</td>
                    <td>{loan.purpose}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass[loan.status]}`}>
                        {statusLabel[loan.status]}
                      </span>
                    </td>
                    <td>{new Date(loan.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}