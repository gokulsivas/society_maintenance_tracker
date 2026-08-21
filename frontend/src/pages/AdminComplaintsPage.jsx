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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Complaints Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review, prioritize, and update the status lifecycle of all society maintenance tickets.
          </p>
        </div>

        <button
          onClick={() => fetchComplaints(pagination.page)}
          className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl shadow-sm text-sm font-semibold transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError(null)} />

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2.5 flex-wrap flex-1">
          <div className="flex items-center space-x-1 text-xs font-semibold text-gray-500">
            <Filter className="w-4 h-4 text-gray-400" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs sm:text-sm border border-gray-300 rounded-lg py-1.5 px-2.5 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs sm:text-sm border border-gray-300 rounded-lg py-1.5 px-2.5 bg-white"
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
            className="text-xs sm:text-sm border border-gray-300 rounded-lg py-1.5 px-2.5 bg-white"
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <select
            value={isOverdueFilter}
            onChange={(e) => setIsOverdueFilter(e.target.value)}
            className="text-xs sm:text-sm border border-gray-300 rounded-lg py-1.5 px-2.5 bg-white"
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
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Clear
            </button>
          )}
        </div>

        <span className="text-xs font-medium text-gray-500">
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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
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
                <tbody className="divide-y divide-gray-200 bg-white">
                {complaints.map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-gray-50/80 transition-colors ${
                      c.is_overdue && c.status !== 'RESOLVED' ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <Link
                          to={`/complaints/${c.id}`}
                          className="font-bold text-gray-900 hover:text-blue-600 line-clamp-1"
                        >
                          {c.title}
                        </Link>
                        <span className="text-xs text-gray-400 font-mono">#{c.id}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-semibold text-gray-900">{c.resident_name}</div>
                      <div className="text-xs text-gray-500">Flat {c.resident_flat_no || 'N/A'}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                        {c.category}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={c.priority}
                        onChange={(e) => handlePriorityChange(c.id, e.target.value)}
                        className="text-xs font-bold rounded-lg border-gray-300 py-1 px-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
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
                          className="inline-flex items-center px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" />
                          Status
                        </button>
                      )}
                      <Link
                        to={`/complaints/${c.id}`}
                        className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
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
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchComplaints(pagination.page - 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 disabled:opacity-50 inline-flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </button>
                <button
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => fetchComplaints(pagination.page + 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 disabled:opacity-50 inline-flex items-center"
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
  );
}
