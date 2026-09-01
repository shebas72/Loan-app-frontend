'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ApiError } from '@/lib/api';
import { User, AuthResponse } from '@/types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    apiClient<User>('/me', { token: storedToken })
      .then((fetchedUser) => {
        setUser(fetchedUser);
        setToken(storedToken);
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const response = await apiClient<AuthResponse>('/login', {
      method: 'POST',
      body: { email, password },
    });

    localStorage.setItem('auth_token', response.token);
    setToken(response.token);
    setUser(response.user);
  }

  async function logout() {
    if (token) {
      await apiClient('/logout', { method: 'POST', token }).catch(() => {});
    }

    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}