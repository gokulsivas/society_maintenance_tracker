import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { listAdminComplaints, updateComplaintPriority } from '../api/complaints';
import { getErrorMessage, isRequestCanceled } from '../api/client';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import StatusTransitionModal from '../components/complaints/StatusTransitionModal';
import { TableRowSkeleton } from '../components/common/Skeleton';
import ErrorAlert from '../components/common/ErrorAlert';
import EmptyState from '../components/common/EmptyState';
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ExternalLink,
} from 'lucide-react';

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, page_size: 20, total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [isOverdueFilter, setIsOverdueFilter] = useState('');

  // Status Modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const controllerRef = useRef(null);

  const fetchComplaints = async (page = 1) => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        page_size: pagination.page_size,
      };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (isOverdueFilter === 'true') params.is_overdue = true;

      const data = await listAdminComplaints(params, { signal: controller.signal });
      setComplaints(data?.items || []);
      setPagination({
        page: data?.page || 1,
        page_size: data?.page_size || 20,
        total: data?.total || 0,
        total_pages: data?.total_pages || 1,
      });
    } catch (err) {
      if (isRequestCanceled(err)) return;
      setError(getErrorMessage(err, 'Failed to fetch complaints list.'));
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchComplaints(1);
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [statusFilter, categoryFilter, priorityFilter, isOverdueFilter]);

  const handlePriorityChange = async (complaintId, newPriority) => {
    try {
      await updateComplaintPriority(complaintId, newPriority);
      setComplaints((prev) =>
        prev.map((c) => (c.id === complaintId ? { ...c, priority: newPriority } : c))
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update priority.'));
    }
  };

  const handleOpenStatusModal = (complaint) => {
    setSelectedComplaint(complaint);
    setIsStatusModalOpen(true);
  };

  return (
    <div className="editorial-page-surface min-h-[calc(100vh-5rem)] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d8cdbc] pb-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#24211e] tracking-tight">
              Complaints Management
            </h1>
            <p className="text-sm text-[#6b665e] mt-1">
              Review, prioritize, and update the status lifecycle of all society maintenance tickets.
            </p>
          </div>

          <button
            onClick={() => fetchComplaints(pagination.page)}
            className="inline-flex items-center px-4 py-2.5 bg-[#faf8f3] border border-[#d8cdbc] text-[#24211e] hover:bg-[#ebe5da] text-xs font-semibold uppercase tracking-wider transition-colors self-start sm:self-auto shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 text-[#5f4b3b] ${loading ? 'animate-spin' : ''}`} />
            Refresh List
          </button>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError(null)} />

        {/* Filter Bar */}
        <div className="bg-[#faf8f3] dark:bg-[#24211e] p-4 sm:p-5 border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] shadow-sm flex flex-wrap gap-3 items-center justify-between rounded-none">
          <div className="flex items-center gap-2.5 flex-wrap flex-1">
            <div className="flex items-center space-x-1 text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] dark:text-[#d8cdbc]">
              <Filter className="w-3.5 h-3.5 text-[#5f4b3b] dark:text-[#d8cdbc]" />
              <span>Filters:</span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs sm:text-sm bg-[#FAF8F5] dark:bg-[#2a2520] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] text-[#24211e] dark:text-[#f5f2ec] py-1.5 px-3 focus:border-[#5f4b3b] focus:outline-none rounded-none"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs sm:text-sm bg-[#FAF8F5] dark:bg-[#2a2520] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] text-[#24211e] dark:text-[#f5f2ec] py-1.5 px-3 focus:border-[#5f4b3b] focus:outline-none rounded-none"
            >
              <option value="">All Categories</option>
              <option value="PLUMBING">Plumbing</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="CARPENTRY">Carpentry</option>
              <option value="CLEANLINESS">Cleanliness</option>
              <option value="SECURITY">Security</option>
              <option value="OTHER">Other</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs sm:text-sm bg-[#FAF8F5] dark:bg-[#2a2520] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] text-[#24211e] dark:text-[#f5f2ec] py-1.5 px-3 focus:border-[#5f4b3b] focus:outline-none rounded-none"
            >
              <option value="">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>

            <select
              value={isOverdueFilter}
              onChange={(e) => setIsOverdueFilter(e.target.value)}
              className="text-xs sm:text-sm bg-[#FAF8F5] dark:bg-[#2a2520] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] text-[#24211e] dark:text-[#f5f2ec] py-1.5 px-3 focus:border-[#5f4b3b] focus:outline-none rounded-none"
            >
              <option value="">All Timelines</option>
              <option value="true">Overdue Only</option>
            </select>

            {(statusFilter || categoryFilter || priorityFilter || isOverdueFilter) && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setCategoryFilter('');
                  setPriorityFilter('');
                  setIsOverdueFilter('');
                }}
                className="text-xs font-bold uppercase tracking-wider text-[#5f4b3b] dark:text-[#d8cdbc] hover:text-[#24211e] dark:hover:text-[#f5f2ec] transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <span className="text-xs font-medium text-[#6b665e] dark:text-[#c8bfb3]">
            Showing {complaints.length} of {pagination.total} complaints
          </span>
        </div>

        {/* Complaints Table */}
        {!loading && complaints.length === 0 ? (
          <EmptyState
            title="No complaints matching your criteria"
            description="Try adjusting your status, category, or priority filters."
          />
        ) : (
          <div className="bg-[#faf8f3] dark:bg-[#24211e] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] shadow-sm overflow-hidden rounded-none">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#d8cdbc] dark:divide-[rgba(245,242,236,0.16)] text-left text-sm">
                <thead className="bg-[#ebe5da] dark:bg-[#342d27] text-[11px] font-bold text-[#5f4b3b] dark:text-[#d8cdbc] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Ticket / Title</th>
                    <th className="px-6 py-3.5">Resident</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Priority</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                {loading && complaints.length === 0 ? (
                  <TableRowSkeleton rows={6} cols={6} />
                ) : (
                  <tbody className="divide-y divide-[#d8cdbc]/60 dark:divide-[rgba(245,242,236,0.12)] bg-[#faf8f3] dark:bg-[#24211e]">
                  {complaints.map((c) => (
                    <tr
                      key={c.id}
                      className={`hover:bg-[#FAF8F5] dark:hover:bg-[#2b2723] transition-colors ${
                        c.is_overdue && c.status !== 'RESOLVED'
                          ? 'bg-[#fbeeed]/40 dark:bg-[#4a2927]/40'
                          : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <Link
                            to={`/complaints/${c.id}`}
                            className="font-serif text-base font-normal text-[#24211e] dark:text-[#f5f2ec] hover:text-[#5f4b3b] dark:hover:text-[#d8cdbc] line-clamp-1"
                          >
                            {c.title}
                          </Link>
                          <span className="text-xs text-[#8F8778] dark:text-[#a89e91] font-mono mt-0.5">#{c.id}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-[#24211e] dark:text-[#f5f2ec]">{c.resident_name}</div>
                        <div className="text-xs text-[#6b665e] dark:text-[#c8bfb3]">Flat {c.resident_flat_no || 'N/A'}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 bg-[#ebe5da] dark:bg-[#342d27] text-[#5f4b3b] dark:text-[#d8cdbc] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] rounded-none whitespace-nowrap">
                          {c.category}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={c.priority}
                          onChange={(e) => handlePriorityChange(c.id, e.target.value)}
                          className="text-xs font-semibold uppercase tracking-wider bg-[#FAF8F5] dark:bg-[#2a2520] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] text-[#24211e] dark:text-[#f5f2ec] py-1 px-2.5 focus:border-[#5f4b3b] focus:outline-none shadow-sm rounded-none"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </select>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={c.status} isOverdue={c.is_overdue} />
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        {c.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleOpenStatusModal(c)}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] bg-[#24211e] hover:bg-[#3f3025] dark:bg-[#342d27] dark:hover:bg-[#433931] border border-[#24211e] dark:border-[rgba(245,242,236,0.2)] shadow-sm transition-colors rounded-none"
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1" />
                            Status
                          </button>
                        )}
                        <Link
                          to={`/complaints/${c.id}`}
                          className="inline-flex items-center px-2.5 py-1.5 text-xs text-[#5f4b3b] dark:text-[#d8cdbc] hover:text-[#24211e] dark:hover:text-[#f5f2ec] bg-[#ebe5da] dark:bg-[#342d27] hover:bg-[#d8cdbc] dark:hover:bg-[#433931] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] transition-colors rounded-none"
                          title="View complaint details"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="px-6 py-4 bg-[#FAF8F5] dark:bg-[#24211e] border-t border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] flex items-center justify-between">
                <span className="text-xs text-[#6b665e] dark:text-[#c8bfb3]">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => fetchComplaints(pagination.page - 1)}
                    className="px-4 py-2 border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] text-xs font-semibold uppercase tracking-wider text-[#24211e] dark:text-[#f5f2ec] bg-[#faf8f3] dark:bg-[#2b2723] hover:bg-[#ebe5da] dark:hover:bg-[#342d27] disabled:opacity-50 inline-flex items-center transition-colors rounded-none"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                  </button>
                  <button
                    disabled={pagination.page >= pagination.total_pages}
                    onClick={() => fetchComplaints(pagination.page + 1)}
                    className="px-4 py-2 border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] text-xs font-semibold uppercase tracking-wider text-[#24211e] dark:text-[#f5f2ec] bg-[#faf8f3] dark:bg-[#2b2723] hover:bg-[#ebe5da] dark:hover:bg-[#342d27] disabled:opacity-50 inline-flex items-center transition-colors rounded-none"
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Transition Modal */}
        <StatusTransitionModal
          complaint={selectedComplaint}
          isOpen={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            setSelectedComplaint(null);
          }}
          onSuccess={() => fetchComplaints(pagination.page)}
        />
      </div>
    </div>
  );
}
