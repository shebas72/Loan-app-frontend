'use client';

import { FormEvent, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, ApiError } from '@/lib/api';
import { User } from '@/types';

function ProfileEditor() {
  const { token, user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>({});
  const [profileMessage, setProfileMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [passwords, setPasswords] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string[]>>({});
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileErrors({});
    setProfileMessage(null);
    setIsSavingProfile(true);

    try {
      const updatedUser = await apiClient<User>('/me', {
        method: 'PUT',
        token,
        body: { name, email },
      });
      updateUser(updatedUser);
      setProfileMessage({ text: 'Profile updated successfully.', isError: false });
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        setProfileErrors(error.errors);
      } else {
        setProfileMessage({
          text: error instanceof ApiError ? error.message : 'Could not update profile.',
          isError: true,
        });
      }
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordErrors({});
    setPasswordMessage(null);
    setIsChangingPassword(true);

    try {
      await apiClient('/me/password', {
        method: 'PUT',
        token,
        body: passwords,
      });
      setPasswords({ current_password: '', password: '', password_confirmation: '' });
      setPasswordMessage({ text: 'Password changed successfully.', isError: false });
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        setPasswordErrors(error.errors);
      } else {
        setPasswordMessage({
          text: error instanceof ApiError ? error.message : 'Could not change password.',
          isError: true,
        });
      }
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <DashboardLayout>
        <div className="page-title">
          <h4>Profile</h4>
        </div>

        <div className="row g-4">
          {/* <div className="col-xl-7">
            Current Role: <strong>{user?.role}</strong>
          </div> */}
          <div className="col-xl-7">
            <section className="card h-100">
              <div className="card-header">
                <h5 className="mb-0">Profile editor</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleProfileSubmit}>
                  <div className="mb-3">
                    <label htmlFor="profile-name" className="form-label">Name</label>
                    <input
                      id="profile-name"
                      className="form-control"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                    />
                    {profileErrors.name && <p className="text-danger small mb-0">{profileErrors.name[0]}</p>}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="profile-email" className="form-label">Email</label>
                    <input
                      id="profile-email"
                      className="form-control"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                    {profileErrors.email && <p className="text-danger small mb-0">{profileErrors.email[0]}</p>}
                  </div>
                  {profileMessage && (
                    <p className={profileMessage.isError ? 'text-danger' : 'text-success'} role="status">
                      {profileMessage.text}
                    </p>
                  )}
                  <button type="submit" className="btn btn-primary" disabled={isSavingProfile}>
                    {isSavingProfile ? 'Saving...' : 'Save changes'}
                  </button>
                </form>
              </div>
            </section>
          </div>

          <div className="col-xl-5">
            <section className="card">
              <div className="card-header">
                <h5 className="mb-0">Change password</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handlePasswordSubmit}>
                  <div className="mb-3">
                    <label htmlFor="current-password" className="form-label">Current password</label>
                    <input
                      id="current-password"
                      className="form-control"
                      type="password"
                      autoComplete="current-password"
                      value={passwords.current_password}
                      onChange={(event) => setPasswords((current) => ({ ...current, current_password: event.target.value }))}
                      required
                    />
                    {passwordErrors.current_password && <p className="text-danger small mb-0">{passwordErrors.current_password[0]}</p>}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="new-password" className="form-label">New password</label>
                    <input
                      id="new-password"
                      className="form-control"
                      type="password"
                      autoComplete="new-password"
                      value={passwords.password}
                      onChange={(event) => setPasswords((current) => ({ ...current, password: event.target.value }))}
                      required
                    />
                    {passwordErrors.password && <p className="text-danger small mb-0">{passwordErrors.password[0]}</p>}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password-confirmation" className="form-label">Confirm new password</label>
                    <input
                      id="password-confirmation"
                      className="form-control"
                      type="password"
                      autoComplete="new-password"
                      value={passwords.password_confirmation}
                      onChange={(event) => setPasswords((current) => ({ ...current, password_confirmation: event.target.value }))}
                      required
                    />
                    {passwordErrors.password_confirmation && <p className="text-danger small mb-0">{passwordErrors.password_confirmation[0]}</p>}
                  </div>
                  {passwordMessage && (
                    <p className={passwordMessage.isError ? 'text-danger' : 'text-success'} role="status">
                      {passwordMessage.text}
                    </p>
                  )}
                  <button type="submit" className="btn btn-primary" disabled={isChangingPassword}>
                    {isChangingPassword ? 'Updating...' : 'Update password'}
                  </button>
                </form>
              </div>
            </section>
          </div>
        </div>
    </DashboardLayout>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileEditor />
    </RequireAuth>
  );
}