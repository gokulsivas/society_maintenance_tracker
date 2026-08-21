import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import NoticeCard from '../components/notices/NoticeCard';
import EmptyState from '../components/common/EmptyState';
import ErrorAlert from '../components/common/ErrorAlert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EditComplaintModal from '../components/complaints/EditComplaintModal';
import * as complaintsApi from '../api/complaints';

describe('Common UI Components', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = 'light';
    document.documentElement.setAttribute('data-theme', 'light');
  });

  it('renders StatusBadge for OPEN, IN_PROGRESS, RESOLVED and OVERDUE state', () => {
    const { rerender } = render(<StatusBadge status="OPEN" isOverdue={false} />);
    expect(screen.getByText(/Open/i)).toBeInTheDocument();

    rerender(<StatusBadge status="IN_PROGRESS" isOverdue={false} />);
    expect(screen.getByText(/In Progress/i)).toBeInTheDocument();

    rerender(<StatusBadge status="RESOLVED" isOverdue={false} />);
    expect(screen.getByText(/Resolved/i)).toBeInTheDocument();

    rerender(<StatusBadge status="OPEN" isOverdue={true} showOverdue={true} />);
    expect(screen.getByText(/OVERDUE/i)).toBeInTheDocument();
  });

  it('renders PriorityBadge with correct labels', () => {
    const { rerender } = render(<PriorityBadge priority="LOW" />);
    expect(screen.getByText(/Low/i)).toBeInTheDocument();

    rerender(<PriorityBadge priority="MEDIUM" />);
    expect(screen.getByText(/Medium/i)).toBeInTheDocument();

    rerender(<PriorityBadge priority="HIGH" />);
    expect(screen.getByText(/High/i)).toBeInTheDocument();
  });

  it('renders NoticeCard and shows IMPORTANT pin for important notices', () => {
    const notice = {
      id: 1,
      title: 'Water Tank Cleaning',
      body: 'No water supply from 10 AM to 2 PM.',
      is_important: true,
      author_name: 'Admin Boss',
      created_at: '2026-08-21T10:00:00Z',
    };

    render(
      <MemoryRouter>
        <NoticeCard notice={notice} />
      </MemoryRouter>
    );

    expect(screen.getByText('Water Tank Cleaning')).toBeInTheDocument();
    expect(screen.getByText(/IMPORTANT/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Boss/i)).toBeInTheDocument();
  });

  it('renders EmptyState with action button', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="No Complaints"
        description="Submit one now"
        actionText="Create Ticket"
        onAction={onAction}
      />
    );

    expect(screen.getByText('No Complaints')).toBeInTheDocument();
    const btn = screen.getByText('Create Ticket');
    fireEvent.click(btn);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders ErrorAlert and handles dismiss', () => {
    const onDismiss = vi.fn();
    render(<ErrorAlert message="Something went wrong" onDismiss={onDismiss} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    const dismissBtn = screen.getByLabelText(/Dismiss alert/i);
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders LoadingSpinner with message', () => {
    render(<LoadingSpinner message="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('renders EditComplaintModal and allows resident to edit open complaint', async () => {
    const complaint = {
      id: 42,
      title: 'Dripping tap',
      category: 'PLUMBING',
      description: 'Bathroom tap is leaking continuously',
      photo_url: '',
      status: 'OPEN',
      resident_id: 1,
    };

    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <EditComplaintModal
        complaint={complaint}
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText(/Edit Complaint #42/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Dripping tap')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bathroom tap is leaking continuously')).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/Issue Title/i);
    fireEvent.change(titleInput, { target: { value: 'Updated tap issue' } });
    expect(titleInput.value).toBe('Updated tap issue');

    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('Navbar Profile Trigger, Theme Toggle & Dropdown', () => {
  it('getUserInitials correctly extracts initials from user names', async () => {
    const { getUserInitials } = await import('../components/common/Navbar');
    expect(getUserInitials('Demo Society Admin')).toBe('DA');
    expect(getUserInitials('Demo Resident User')).toBe('DU');
    expect(getUserInitials('Alice')).toBe('AL');
    expect(getUserInitials('')).toBe('U');
  });

  it('renders square profile trigger and opens dropdown with authenticated user data', async () => {
    const { default: Navbar } = await import('../components/common/Navbar');
    const { AuthContext } = await import('../context/AuthContext');
    const { ThemeProvider } = await import('../context/ThemeContext');

    const mockLogout = vi.fn();
    const authValue = {
      user: { id: 1, name: 'Demo Society Admin', email: 'admin.demo@society-tracker.com', role: 'ADMIN' },
      isAuthenticated: true,
      isAdmin: true,
      isResident: false,
      logout: mockLogout,
    };

    render(
      <ThemeProvider>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter>
            <Navbar />
          </MemoryRouter>
        </AuthContext.Provider>
      </ThemeProvider>
    );

    // Profile trigger is square (rounded-none) with initials DA
    const trigger = screen.getByLabelText('Open account menu');
    expect(trigger).toBeInTheDocument();
    expect(trigger.className).toContain('rounded-none');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(screen.getByText('DA')).toBeInTheDocument();

    // Click trigger to open dropdown
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Verify Dropdown Contents
    expect(screen.getByText('Demo Society Admin')).toBeInTheDocument();
    expect(screen.getByText('ADMINISTRATOR')).toBeInTheDocument();

    // Verify Logout button
    const logoutBtn = screen.getByRole('menuitem', { name: /Sign Out/i });
    expect(logoutBtn).toBeInTheDocument();

    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('renders RESIDENT role correctly in dropdown for resident user', async () => {
    const { default: Navbar } = await import('../components/common/Navbar');
    const { AuthContext } = await import('../context/AuthContext');
    const { ThemeProvider } = await import('../context/ThemeContext');

    const mockLogout = vi.fn();
    const authValue = {
      user: { id: 2, name: 'Demo Resident User', email: 'resident.demo@society-tracker.com', role: 'RESIDENT', flat_no: 'B-202' },
      isAuthenticated: true,
      isAdmin: false,
      isResident: true,
      logout: mockLogout,
    };

    render(
      <ThemeProvider>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter>
            <Navbar />
          </MemoryRouter>
        </AuthContext.Provider>
      </ThemeProvider>
    );

    const trigger = screen.getByLabelText('Open account menu');
    expect(screen.getByText('DU')).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.getByText('Demo Resident User')).toBeInTheDocument();
    expect(screen.getByText('RESIDENT')).toBeInTheDocument();
    expect(screen.getByText(/Flat B-202/i)).toBeInTheDocument();
  });

  it('renders square ThemeToggle button and toggles light/dark mode', async () => {
    const { default: Navbar } = await import('../components/common/Navbar');
    const { AuthContext } = await import('../context/AuthContext');
    const { ThemeProvider } = await import('../context/ThemeContext');

    const authValue = {
      user: { id: 1, name: 'Demo Society Admin', role: 'ADMIN' },
      isAuthenticated: true,
      isAdmin: true,
      logout: vi.fn(),
    };

    render(
      <ThemeProvider>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter>
            <Navbar />
          </MemoryRouter>
        </AuthContext.Provider>
      </ThemeProvider>
    );

    const themeToggle = screen.getByLabelText(/Switch to dark mode/i);
    expect(themeToggle).toBeInTheDocument();
    expect(themeToggle.className).toContain('rounded-none');
    expect(themeToggle).toHaveAttribute('aria-pressed', 'false');

    // Click to toggle to dark mode
    fireEvent.click(themeToggle);
    expect(screen.getByLabelText(/Switch to light mode/i)).toBeInTheDocument();
    expect(localStorage.getItem('socivio_theme')).toBe('dark');
  });

  it('closes dropdown on Escape key', async () => {
    const { default: Navbar } = await import('../components/common/Navbar');
    const { AuthContext } = await import('../context/AuthContext');
    const { ThemeProvider } = await import('../context/ThemeContext');

    const authValue = {
      user: { id: 1, name: 'Demo Society Admin', role: 'ADMIN' },
      isAuthenticated: true,
      isAdmin: true,
      logout: vi.fn(),
    };

    render(
      <ThemeProvider>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter>
            <Navbar />
          </MemoryRouter>
        </AuthContext.Provider>
      </ThemeProvider>
    );

    const trigger = screen.getByLabelText('Open account menu');
    fireEvent.click(trigger);
    expect(screen.getByText('Demo Society Admin')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByText('ADMINISTRATOR')).not.toBeInTheDocument();
  });

  it('closes dropdown on outside click', async () => {
    const { default: Navbar } = await import('../components/common/Navbar');
    const { AuthContext } = await import('../context/AuthContext');
    const { ThemeProvider } = await import('../context/ThemeContext');

    const authValue = {
      user: { id: 1, name: 'Demo Society Admin', role: 'ADMIN' },
      isAuthenticated: true,
      isAdmin: true,
      logout: vi.fn(),
    };

    render(
      <ThemeProvider>
        <div>
          <div data-testid="outside-area">Outside</div>
          <AuthContext.Provider value={authValue}>
            <MemoryRouter>
              <Navbar />
            </MemoryRouter>
          </AuthContext.Provider>
        </div>
      </ThemeProvider>
    );

    const trigger = screen.getByLabelText('Open account menu');
    fireEvent.click(trigger);
    expect(screen.getByText('Demo Society Admin')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside-area'));
    expect(screen.queryByText('ADMINISTRATOR')).not.toBeInTheDocument();
  });
});

describe('Date Filters & Dashboard Preset Behavior', () => {
  it('date helpers calculate 90 days default range dynamically', async () => {
    const { formatDateInput, getDaysAgo, getToday } = await import('../pages/AdminDashboardPage');
    const todayStr = getToday();
    const daysAgo90Str = getDaysAgo(90);

    expect(todayStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(daysAgo90Str).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(daysAgo90Str) < new Date(todayStr)).toBe(true);
  });
});
