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

  it('redirects resident to /dashboard even if previous attempt was an /admin/* route', async () => {
    const { default: LoginPage } = await import('../pages/LoginPage');
    vi.spyOn(authApi, 'loginUser').mockResolvedValueOnce({
      access_token: 'res.token',
      token_type: 'bearer',
      user: {
        id: 3,
        name: 'Resident Redirect Test',
        email: 'resident_redirect@society.com',
        role: 'RESIDENT',
      },
    });

    render(
      <AuthProvider>
        <MemoryRouter
          initialEntries={[
            { pathname: '/login', state: { from: { pathname: '/admin/settings' } } },
          ]}
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<div>RESIDENT_LANDING_PAGE</div>} />
            <Route path="/admin/settings" element={<div>ADMIN_SETTINGS_PAGE</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(emailInput, { target: { value: 'resident_redirect@society.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('RESIDENT_LANDING_PAGE')).toBeInTheDocument();
      expect(screen.queryByText('ADMIN_SETTINGS_PAGE')).not.toBeInTheDocument();
    });
  });

  it('redirects admin to /admin/dashboard upon login', async () => {
    const { default: LoginPage } = await import('../pages/LoginPage');
    vi.spyOn(authApi, 'loginUser').mockResolvedValueOnce({
      access_token: 'adm.token',
      token_type: 'bearer',
      user: {
        id: 4,
        name: 'Admin Redirect Test',
        email: 'admin_redirect@society.com',
        role: 'ADMIN',
      },
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/dashboard" element={<div>ADMIN_LANDING_PAGE</div>} />
            <Route path="/dashboard" element={<div>RESIDENT_LANDING_PAGE</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(emailInput, { target: { value: 'admin_redirect@society.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('ADMIN_LANDING_PAGE')).toBeInTheDocument();
      expect(screen.queryByText('RESIDENT_LANDING_PAGE')).not.toBeInTheDocument();
    });
  });

  it('clicking Admin Demo button fills credentials into form without auto-submitting', async () => {
    const { default: LoginPage } = await import('../pages/LoginPage');
    const { fireEvent } = await import('@testing-library/react');

    const loginSpy = vi.spyOn(authApi, 'loginUser');

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const adminDemoBtn = screen.getByRole('button', { name: /Admin Demo/i });

    // Initially empty
    expect(emailInput.value).toBe('');
    expect(passwordInput.value).toBe('');

    // Click Admin Demo button
    fireEvent.click(adminDemoBtn);

    // Form is populated with demo credentials
    expect(emailInput.value).toBe('admin.demo@society-tracker.com');
    expect(passwordInput.value).toBe('DemoAdmin@2026');

    // Does NOT auto-submit
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('clicking Resident Demo button fills credentials into form without auto-submitting', async () => {
    const { default: LoginPage } = await import('../pages/LoginPage');
    const { fireEvent } = await import('@testing-library/react');

    const loginSpy = vi.spyOn(authApi, 'loginUser');

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const residentDemoBtn = screen.getByRole('button', { name: /Resident Demo/i });

    // Initially empty
    expect(emailInput.value).toBe('');
    expect(passwordInput.value).toBe('');

    // Click Resident Demo button
    fireEvent.click(residentDemoBtn);

    // Form is populated with demo credentials
    expect(emailInput.value).toBe('resident.demo@society-tracker.com');
    expect(passwordInput.value).toBe('DemoResident@2026');

    // Does NOT auto-submit
    expect(loginSpy).not.toHaveBeenCalled();
  });
});

