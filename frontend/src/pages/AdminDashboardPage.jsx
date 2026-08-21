import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboard } from '../api/dashboard';
import { getErrorMessage, isRequestCanceled } from '../api/client';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import ErrorAlert from '../components/common/ErrorAlert';
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Calendar,
  Filter,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Date filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const controllerRef = useRef(null);

  const fetchDashboard = async () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (fromDate) params.from_date = new Date(fromDate).toISOString();
      if (toDate) params.to_date = new Date(toDate).toISOString();

      const result = await getAdminDashboard(params, { signal: controller.signal });
      setData(result);
    } catch (err) {
      if (isRequestCanceled(err)) return;
      setError(getErrorMessage(err, 'Failed to load administrator dashboard.'));
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDashboard();
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchDashboard();
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setTimeout(() => fetchDashboard(), 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800 mb-1">
            Admin Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Society Maintenance Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time analytics, status breakdowns, and live overdue monitoring.
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl shadow-sm text-sm font-semibold transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError(null)} />

      {/* Date Range Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleFilterSubmit} className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center space-x-1.5 text-xs text-gray-500">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="font-semibold">Date Range:</span>
          </div>

          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-xs sm:text-sm border border-gray-300 rounded-lg py-1.5 px-2.5 focus:ring-2 focus:ring-blue-500"
              title="From date"
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-xs sm:text-sm border border-gray-300 rounded-lg py-1.5 px-2.5 focus:ring-2 focus:ring-blue-500"
              title="To date"
            />

            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              Apply Filter
            </button>

            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {loading && !data ? (
        <div className="space-y-8 animate-pulse">
          {/* Summary Metric Cards Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="w-5 h-5 bg-gray-200 rounded" />
                </div>
                <div className="h-8 bg-gray-300 rounded w-1/2" />
              </div>
            ))}
          </div>

          {/* Breakdown Section Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 pb-2" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded" />
                  <div className="h-4 bg-gray-100 rounded" />
                  <div className="h-4 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 pb-3" />
                <div className="space-y-3">
                  <div className="h-10 bg-gray-100 rounded" />
                  <div className="h-10 bg-gray-100 rounded" />
                  <div className="h-10 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : data ? (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total</span>
                <ClipboardList className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{data.total_complaints}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm">
              <div className="flex items-center justify-between text-amber-600 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Open</span>
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-3xl font-extrabold text-amber-600">{data.total_open}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm">
              <div className="flex items-center justify-between text-blue-600 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">In Progress</span>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-3xl font-extrabold text-blue-600">{data.total_in_progress}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm">
              <div className="flex items-center justify-between text-emerald-600 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Resolved</span>
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-3xl font-extrabold text-emerald-600">{data.total_resolved}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-rose-600 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Overdue</span>
                <AlertOctagon className="w-5 h-5" />
              </div>
              <p className="text-3xl font-extrabold text-rose-600">{data.total_overdue}</p>
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* By Status */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                By Status
              </h3>
              <div className="space-y-2 text-sm">
                {Object.entries(data.by_status || {}).map(([st, cnt]) => (
                  <div key={st} className="flex items-center justify-between">
                    <StatusBadge status={st} showOverdue={false} />
                    <span className="font-bold text-gray-900">{cnt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* By Priority */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                By Priority
              </h3>
              <div className="space-y-2 text-sm">
                {Object.entries(data.by_priority || {}).map(([prio, cnt]) => (
                  <div key={prio} className="flex items-center justify-between">
                    <PriorityBadge priority={prio} />
                    <span className="font-bold text-gray-900">{cnt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* By Category */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                By Category
              </h3>
              <div className="space-y-2 text-sm">
                {Object.entries(data.by_category || {}).map(([cat, cnt]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">{cat}</span>
                    <span className="font-bold text-gray-900">{cnt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity: Complaints & Transitions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Complaints */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Recent Complaints</h3>
                <Link to="/admin/complaints" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center">
                  View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>

              {data.recent_complaints?.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No complaints found.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {data.recent_complaints.map((c) => (
                    <div key={c.id} className="py-3 flex items-center justify-between gap-2">
                      <div>
                        <Link
                          to={`/complaints/${c.id}`}
                          className="text-sm font-bold text-gray-900 hover:text-blue-600 line-clamp-1"
                        >
                          {c.title}
                        </Link>
                        <p className="text-xs text-gray-500">
                          {c.resident_name} &bull; Flat {c.resident_flat_no || 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge status={c.status} isOverdue={c.is_overdue} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Status Transitions */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Recent Status Transitions</h3>
              </div>

              {data.recent_status_transitions?.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No recent transitions recorded.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {data.recent_status_transitions.map((t) => (
                    <div key={t.id} className="py-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <Link
                          to={`/complaints/${t.complaint_id}`}
                          className="font-bold text-blue-600 hover:text-blue-800"
                        >
                          Complaint #{t.complaint_id}
                        </Link>
                        <span className="text-gray-400">
                          {new Date(t.changed_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 font-semibold text-gray-700">
                        <span>{t.from_status || 'INITIAL'}</span>
                        <span>&rarr;</span>
                        <span className="text-blue-600">{t.to_status}</span>
                      </div>
                      {t.note && <p className="text-gray-600 italic">"{t.note}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
