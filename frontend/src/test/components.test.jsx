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
