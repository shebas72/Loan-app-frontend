'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api';
import { AuthResponse, TenantOption } from '@/types';

export default function RegisterPage() {
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [form, setForm] = useState({
    tenant_id: '',
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    apiClient<{ data: TenantOption[] }>('/tenants')
      .then((response) => setTenants(response.data))
      .catch(() => setErrors({ general: ['Could not load banks. Please refresh.'] }));
  }, []);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await apiClient<AuthResponse>('/register', {
        method: 'POST',
        body: form,
      });

      localStorage.setItem('auth_token', response.token);
      router.push('/loan-applications');
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors);
      } else {
        setErrors({ general: ['Something went wrong. Please try again.'] });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="text-center mb-4">
          <h3>
            <span className="text-primary">L</span>oan Platform
          </h3>
          <p className="text-muted">Create your applicant account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Bank</label>
            <select
              className="form-control"
              value={form.tenant_id}
              onChange={(e) => updateField('tenant_id', e.target.value)}
              required
            >
              <option value="" disabled>
                Select your bank...
              </option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
            {errors.tenant_id && <p className="text-danger small">{errors.tenant_id[0]}</p>}
          </div>

          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Jane Applicant"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />
            {errors.name && <p className="text-danger small">{errors.name[0]}</p>}
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
            />
            {errors.email && <p className="text-danger small">{errors.email[0]}</p>}
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Create password"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              required
            />
            {errors.password && <p className="text-danger small">{errors.password[0]}</p>}
          </div>

          <div className="mb-3">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Confirm password"
              value={form.password_confirmation}
              onChange={(e) => updateField('password_confirmation', e.target.value)}
              required
            />
          </div>

          {errors.general && <p className="text-danger small">{errors.general[0]}</p>}

          <button type="submit" className="btn btn-primary w-100 mb-3" disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>

          <div className="text-center">
            <Link href="/login" className="text-muted">
              Already have an account? Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}