'use client';

import { useState, useEffect, FormEvent } from 'react';
import RequireAuth from '@/components/RequireAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient, ApiError } from '@/lib/api';
import { StaffMember, ROLE_LABELS } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const emptyForm = { name: '', email: '', password: '', password_confirmation: '' };
type FormKey = keyof typeof emptyForm;

const FIELDS: { key: FormKey; label: string; type: string }[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'password', label: 'Password', type: 'password' },
  { key: 'password_confirmation', label: 'Confirm password', type: 'password' },
];

export default function StaffPage() {
  const { token, user } = useAuth();
  const isBankAdmin = user?.role === 'bank_admin';

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingStaffId, setPendingStaffId] = useState<number | null>(null);

  useEffect(() => {
    if (!token || !user) return;
    if (!isBankAdmin) {
      setIsLoading(false);
      return;
    }

    apiClient<{ data: StaffMember[] }>('/staff', { token })
      .then((response) => setStaff(response.data))
      .catch((err) =>
        setLoadError(err instanceof ApiError ? err.message : 'Failed to load staff.'),
      )
      .finally(() => setIsLoading(false));
  }, [token, user, isBankAdmin]);

  const handleChange = (key: FormKey) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);
    setFieldErrors({});
    setSuccess(null);

    try {
      // No role and no tenant_id in the body: the server decides both.
      const response = await apiClient<{ data: StaffMember }>('/staff', {
        method: 'POST',
        body: form,
        token,
      });
      setStaff((prev) => [...prev, response.data]);
      setSuccess(`${response.data.name} added as ${ROLE_LABELS[response.data.role]}.`);
      setForm(emptyForm);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setFieldErrors(err.errors);
        setFormError('Please fix the highlighted fields.');
      } else {
        setFormError(err instanceof ApiError ? err.message : 'Failed to add staff member.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  function startEditing(member: StaffMember) {
    setEditingStaffId(member.id);
    setEditForm({ name: member.name, email: member.email });
    setActionError(null);
  }

  async function saveStaff(member: StaffMember) {
    setPendingStaffId(member.id);
    setActionError(null);

    try {
      const response = await apiClient<{ data: StaffMember }>(`/staff/${member.id}`, {
        method: 'PATCH',
        body: editForm,
        token,
      });
      setStaff((current) =>
        current.map((item) => (item.id === member.id ? response.data : item)),
      );
      setEditingStaffId(null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not update staff member.');
    } finally {
      setPendingStaffId(null);
    }
  }

  async function toggleStaffStatus(member: StaffMember) {
    setPendingStaffId(member.id);
    setActionError(null);

    try {
      const response = await apiClient<{ data: StaffMember }>(`/staff/${member.id}/status`, {
        method: 'PATCH',
        body: { is_active: !member.is_active },
        token,
      });
      setStaff((current) =>
        current.map((item) => (item.id === member.id ? response.data : item)),
      );
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not update staff status.');
    } finally {
      setPendingStaffId(null);
    }
  }

  async function deleteStaff(member: StaffMember) {
    if (!window.confirm(`Permanently delete ${member.name}? This cannot be undone.`)) return;

    setPendingStaffId(member.id);
    setActionError(null);

    try {
      await apiClient(`/staff/${member.id}`, { method: 'DELETE', token });
      setStaff((current) => current.filter((item) => item.id !== member.id));
      if (editingStaffId === member.id) setEditingStaffId(null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not delete staff member.');
    } finally {
      setPendingStaffId(null);
    }
  }

  return (
    <RequireAuth>
      <DashboardLayout>
        <div className="page-title">
          <h4>Staff</h4>
        </div>

        {user && !isBankAdmin ? (
          <div className="alert alert-warning">Only bank administrators can manage staff.</div>
        ) : (
          <div className="row g-4">
            <div className="col-lg-12">
              <div className="card">
                <div className="card-body">
                  <h6 className="mb-3">Team at your bank</h6>
                  {actionError && <div className="alert alert-danger" role="alert">{actionError}</div>}
                  {isLoading ? (
                    <p className="text-muted mb-0">Loading...</p>
                  ) : loadError ? (
                    <p className="text-danger mb-0">{loadError}</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table mb-0">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Added</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staff.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-muted">
                                No staff yet.
                              </td>
                            </tr>
                          ) : (
                            staff.map((member) => (
                              <tr key={member.id}>
                                <td>
                                  {editingStaffId === member.id ? (
                                    <input
                                      aria-label={`Name for ${member.name}`}
                                      className="form-control form-control-sm"
                                      value={editForm.name}
                                      onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                                    />
                                  ) : member.name}
                                </td>
                                <td>
                                  {editingStaffId === member.id ? (
                                    <input
                                      aria-label={`Email for ${member.name}`}
                                      className="form-control form-control-sm"
                                      type="email"
                                      value={editForm.email}
                                      onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))}
                                    />
                                  ) : member.email}
                                </td>
                                <td>{ROLE_LABELS[member.role]}</td>
                                <td>
                                  <span className={`badge ${member.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                    {member.is_active ? 'Active' : 'Disabled'}
                                  </span>
                                </td>
                                <td>{new Date(member.created_at).toLocaleDateString()}</td>
                                <td>
                                  {member.role === 'loan_officer' && (
                                    <div className="d-flex flex-wrap gap-1">
                                      {editingStaffId === member.id ? (
                                        <>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-primary"
                                            onClick={() => saveStaff(member)}
                                            disabled={pendingStaffId === member.id}
                                          >
                                            Save
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => setEditingStaffId(null)}
                                            disabled={pendingStaffId === member.id}
                                          >
                                            Cancel
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => startEditing(member)}
                                            disabled={pendingStaffId !== null}
                                          >
                                            Edit
                                          </button>
                                          <button
                                            type="button"
                                            className={`btn btn-sm ${member.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                            onClick={() => toggleStaffStatus(member)}
                                            disabled={pendingStaffId !== null}
                                          >
                                            {member.is_active ? 'Disable' : 'Enable'}
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => deleteStaff(member)}
                                            disabled={pendingStaffId !== null}
                                          >
                                            Delete
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-12">
              <div className="card">
                <div className="card-body">
                  <h6 className="mb-3">Add loan officer</h6>

                  {success && <div className="alert alert-success">{success}</div>}
                  {formError && <div className="alert alert-danger">{formError}</div>}

                  <form onSubmit={handleSubmit} noValidate>
                    {FIELDS.map(({ key, label, type }) => (
                      <div className="mb-3" key={key}>
                        <label className="form-label" htmlFor={key}>
                          {label}
                        </label>
                        <input
                          id={key}
                          type={type}
                          className={`form-control ${fieldErrors[key] ? 'is-invalid' : ''}`}
                          value={form[key]}
                          onChange={handleChange(key)}
                          autoComplete={type === 'password' ? 'new-password' : 'off'}
                          required
                        />
                        {fieldErrors[key] && (
                          <div className="invalid-feedback">{fieldErrors[key][0]}</div>
                        )}
                      </div>
                    ))}

                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? 'Adding...' : 'Add loan officer'}
                    </button>
                    <div className="form-text mt-2">
                      There are no email invitations yet, so share the initial password with the
                      new officer yourself.
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </RequireAuth>
  );
}