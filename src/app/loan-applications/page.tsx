'use client';

import { useState, useEffect, FormEvent } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient, ApiError } from '@/lib/api';
import { LoanApplication, PaginatedResponse } from '@/types';
import { statusBadgeClass, statusLabel } from '@/lib/loanStatus';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import { useSearch } from '@/contexts/SearchContext';

export default function LoanApplicationsPage() {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { token, user } = useAuth();
  const { query: searchQuery, setQuery: setSearchQuery } = useSearch();

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

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase();
  const filteredLoans = loans.filter((loan) =>
    [
      loan.id,
      loan.applicant.name,
      loan.applicant.email,
      loan.amount,
      loan.purpose,
      statusLabel[loan.status],
      new Date(loan.created_at).toLocaleDateString(),
    ].some((value) => value.toLocaleLowerCase().includes(normalizedSearch)),
  );
  const pageCount = Math.max(1, Math.ceil(filteredLoans.length / pageSize));
  const visibleLoans = filteredLoans.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstVisibleRow = filteredLoans.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleRow = Math.min(currentPage * pageSize, filteredLoans.length);

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
    <RequireAuth>
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
            <>
              <div className="row g-3 align-items-end p-3">
                <div className="col-md-6">
                  <label htmlFor="loan-search" className="form-label">Search applications</label>
                  <input
                    id="loan-search"
                    type="search"
                    className="form-control"
                    placeholder="Applicant, purpose, status..."
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <div className="col-md-3 ms-md-auto">
                  <label htmlFor="loan-page-size" className="form-label">Rows per page</label>
                  <select
                    id="loan-page-size"
                    className="form-select"
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-admin mb-0">
                  <thead>
                    <tr>
                      <th>Applicant</th>
                      <th>Amount</th>
                      <th>Purpose</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleLoans.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-muted">
                          No applications match your search.
                        </td>
                      </tr>
                    ) : visibleLoans.map((loan) => (
                      <tr key={loan.id}>
                        <td>
                          <Link href={`/loan-applications/${loan.id}`}>{loan.applicant.name}</Link>
                        </td>
                        <td>${Number(loan.amount).toLocaleString()}</td>
                        <td>{loan.purpose}</td>
                        <td>
                          <span className={`badge ${statusBadgeClass[loan.status]}`}>
                            {statusLabel[loan.status]}
                          </span>
                        </td>
                        <td>{new Date(loan.created_at).toLocaleDateString()}</td>
                        <td>
                          <Link href={`/loan-applications/${loan.id}`} className="btn btn-sm btn-outline-primary">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 p-3">
                <span className="text-muted small">
                  Showing {firstVisibleRow} to {lastVisibleRow} of {filteredLoans.length} applications
                </span>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="text-muted small" aria-live="polite">
                    Page {currentPage} of {pageCount}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                    disabled={currentPage >= pageCount}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
    </RequireAuth>
  );
}