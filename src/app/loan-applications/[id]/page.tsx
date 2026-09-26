'use client';

import { useState, useEffect, use } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient, uploadFile, ApiError } from '@/lib/api';
import { LoanApplication, StatusTransition, LoanStatus } from '@/types';
import { statusBadgeClass, statusLabel } from '@/lib/loanStatus';
import { useAuth } from '@/contexts/AuthContext';
import RequireAuth from '@/components/RequireAuth';

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
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docType, setDocType] = useState('proof_of_income');
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LoanStatus | ''>('');
  const [comment, setComment] = useState('');
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [appealComment, setAppealComment] = useState('');
  const [isAppealing, setIsAppealing] = useState(false);
  const [appealError, setAppealError] = useState<string | null>(null);

  

  async function loadDocuments() {
  try {
    const response = await apiClient<{ data: Document[] }>(
      `/loan-applications/${id}/documents`,
      { token },
    );
    setDocuments(response.data);
  } catch {
    // non-critical, fail silently for now
  }
}

useEffect(() => {
  if (token) {
    loadLoan();
    loadDocuments();
  }
}, [token, id]);

async function handleUpload(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  if (!file) return;

  setUploadError(null);
  setIsUploading(true);

  const formData = new FormData();
  formData.append('type', docType);
  formData.append('file', file);

  try {
    await uploadFile(`/loan-applications/${id}/documents`, formData, token);
    setFile(null);
    await loadDocuments();
  } catch (err) {
    setUploadError(err instanceof ApiError ? err.message : 'Upload failed.');
  } finally {
    setIsUploading(false);
  }
}

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

  const canAppeal =
  loan !== null &&
  user?.role === 'applicant' &&
  user.id === loan.applicant.id &&
  loan.status === 'rejected';

async function handleAppeal() {
  setAppealError(null);
  setIsAppealing(true);

  try {
    await apiClient(`/loan-applications/${id}/transition`, {
      method: 'POST',
      token,
      body: { to_status: 'appealed', comment: appealComment || undefined },
    });

    setAppealComment('');
    await loadLoan();
  } catch (err) {
    setAppealError(err instanceof ApiError ? err.message : 'Appeal failed.');
  } finally {
    setIsAppealing(false);
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
    <RequireAuth>
    <DashboardLayout>
      <div className="page-title d-flex justify-content-between align-items-center">
        <h4>Loan Application Detail</h4>
        <span className={`badge ${statusBadgeClass[loan.status]}`}>
          {statusLabel[loan.status]}
        </span>
        <button className="btn btn-outline-primary" onClick={() => window.history.back()}>
          Go Back
        </button>
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
            <div className="col-6">
              <div className="text-muted small">Purpose</div>
              <div>{loan.purpose}</div>
            </div>
            <div className="col-6">
              <div className="text-muted small">Submitted</div>
              <div>{new Date(loan.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      {canAppeal && (
  <div className="card mb-4 border-warning">
    <div className="card-body">
      <h5 className="mb-2">This application was rejected</h5>
      {loan.status_transitions && loan.status_transitions.length > 0 && (
        <p className="text-muted small">
          Reason: {loan.status_transitions[loan.status_transitions.length - 1]?.comment ?? 'No reason given.'}
        </p>
      )}

      <div className="mb-3">
        <label className="form-label">Appeal Comment (optional)</label>
        <textarea
          className="form-control"
          placeholder="Add any new information supporting your appeal..."
          value={appealComment}
          onChange={(e) => setAppealComment(e.target.value)}
        />
      </div>

      {appealError && <p className="text-danger small">{appealError}</p>}

      <button className="btn btn-warning" onClick={handleAppeal} disabled={isAppealing}>
        {isAppealing ? 'Submitting Appeal...' : 'Appeal This Decision'}
      </button>
    </div>
  </div>
)}

      <div className="card mt-4">
  <div className="card-body">
    <h5 className="mb-3">Documents</h5>

    <form onSubmit={handleUpload} className="mb-4">
      <div className="row g-2 align-items-end">
        <div className="col-md-4">
          <label className="form-label">Document Type</label>
          <select
            className="form-control"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
          >
            <option value="national_id">National ID</option>
            <option value="proof_of_income">Proof of Income</option>
            <option value="bank_statement">Bank Statement</option>
            <option value="collateral_document">Collateral Document</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="col-md-5">
          <label className="form-label">File</label>
          <input
            type="file"
            className="form-control"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="col-md-3">
          <button type="submit" className="btn btn-primary w-100" disabled={!file || isUploading}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
      {uploadError && <p className="text-danger small mt-2">{uploadError}</p>}
    </form>

    {documents.length === 0 ? (
      <p className="text-muted mb-0">No documents uploaded yet.</p>
    ) : (
      <ul className="list-unstyled mb-0">
        {documents.map((doc) => (
          <li key={doc.id} className="mb-2 pb-2 border-bottom">
            <a href={doc.url} target="_blank" rel="noopener noreferrer">
              {doc.original_filename}
            </a>
            <div className="text-muted small">
              {doc.type} · uploaded by {doc.uploaded_by.name} on{' '}
              {new Date(doc.created_at).toLocaleDateString()}
            </div>
          </li>
        ))}
      </ul>
    )}
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
    </RequireAuth>
  );
}