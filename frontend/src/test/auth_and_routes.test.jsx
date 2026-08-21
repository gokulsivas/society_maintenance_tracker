import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/common/ProtectedRoute';
import * as authApi from '../api/auth';

describe('Auth & Protected Routing', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  function TestConsumer() {
    const { user, isAuthenticated, isAdmin, isResident, logout } = useAuth();
    return (
      <div>
        <div data-testid="auth-state">{isAuthenticated ? 'LOGGED_IN' : 'LOGGED_OUT'}</div>
        <div data-testid="user-name">{user?.name || 'NONE'}</div>
        <div data-testid="user-role">{user?.role || 'NONE'}</div>
        <div data-testid="is-admin">{isAdmin ? 'YES' : 'NO'}</div>
        <button onClick={logout}>Sign out</button>
      </div>
    );
  }

  it('restores session when valid token exists in localStorage', async () => {
    localStorage.setItem('token', 'mock.jwt.token');
    vi.spyOn(authApi, 'getMe').mockResolvedValueOnce({
      id: 1,
      name: 'Alice Resident',
      email: 'alice@society.com',
      role: 'RESIDENT',
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('LOGGED_IN');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Alice Resident');
      expect(screen.getByTestId('user-role')).toHaveTextContent('RESIDENT');
    });
  });

  it('clears session if getMe fails with 401/expired token', async () => {
    localStorage.setItem('token', 'expired.token');
    vi.spyOn(authApi, 'getMe').mockRejectedValueOnce({ response: { status: 401 } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('LOGGED_OUT');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  it('redirects unauthenticated users to /login on ProtectedRoute', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/login" element={<div>LOGIN_PAGE</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>PROTECTED_DASHBOARD</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('LOGIN_PAGE')).toBeInTheDocument();
      expect(screen.queryByText('PROTECTED_DASHBOARD')).not.toBeInTheDocument();
    });
  });

  it('blocks residents from adminOnly protected routes', async () => {
    localStorage.setItem('token', 'valid.token');
    vi.spyOn(authApi, 'getMe').mockResolvedValueOnce({
      id: 2,
      name: 'Bob Resident',
      email: 'bob@society.com',
      role: 'RESIDENT',
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<div>RESIDENT_DASHBOARD</div>} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute adminOnly>
                  <div>ADMIN_SECRET_DASHBOARD</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('RESIDENT_DASHBOARD')).toBeInTheDocument();
      expect(screen.queryByText('ADMIN_SECRET_DASHBOARD')).not.toBeInTheDocument();
    });
  });
});
