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

export const formatDateInput = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateInput(date);
};

export const getToday = () => formatDateInput(new Date());

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Widen default date range (90 days before today to today)
  const [fromDate, setFromDate] = useState(() => getDaysAgo(90));
  const [toDate, setToDate] = useState(() => getToday());
  const [activePreset, setActivePreset] = useState('90d');

  const controllerRef = useRef(null);

  const fetchDashboard = async (from = fromDate, to = toDate) => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (from) {
        params.from_date = from.includes('T') ? from : `${from}T00:00:00.000Z`;
      }
      if (to) {
        params.to_date = to.includes('T') ? to : `${to}T23:59:59.999Z`;
      }

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
    fetchDashboard(fromDate, toDate);
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    if (fromDate && toDate && fromDate > toDate) {
      setError('"To" date cannot be earlier than "From" date.');
      return;
    }
    setActivePreset('custom');
    fetchDashboard(fromDate, toDate);
  };

  const handleApplyPreset = (preset) => {
    setActivePreset(preset);
    let from = '';
    let to = '';
    if (preset === '7d') {
      from = getDaysAgo(7);
      to = getToday();
    } else if (preset === '30d') {
      from = getDaysAgo(30);
      to = getToday();
    } else if (preset === '90d') {
      from = getDaysAgo(90);
      to = getToday();
    } else if (preset === 'all') {
      from = '';
      to = '';
    }
    setFromDate(from);
    setToDate(to);
    fetchDashboard(from, to);
  };

  const handleResetFilters = () => {
    handleApplyPreset('90d');
  };

  return (
    <div className="editorial-page-surface min-h-[calc(100vh-5rem)] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d8cdbc] pb-4">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-[#ebe5da] text-[#5f4b3b] border border-[#d8cdbc] mb-2">
              Admin Console
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#24211e] tracking-tight">
              Society Maintenance Dashboard
            </h1>
            <p className="text-sm text-[#6b665e] mt-1">
              Real-time analytics, status breakdowns, and live overdue monitoring.
            </p>
          </div>

          <button
            onClick={() => fetchDashboard(fromDate, toDate)}
            className="inline-flex items-center px-4 py-2.5 bg-[#faf8f3] border border-[#d8cdbc] text-[#24211e] hover:bg-[#ebe5da] text-xs font-semibold uppercase tracking-wider transition-colors self-start sm:self-auto shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 text-[#5f4b3b] ${loading ? 'animate-spin' : ''}`} />
            Refresh Stats
          </button>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError(null)} />

        {/* Date Range Filter Bar */}
        <div className="bg-[#faf8f3] p-4 sm:p-5 border border-[#d8cdbc] shadow-sm space-y-3">
          {/* Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-[#d8cdbc]/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5f4b3b] mr-1 flex items-center">
              <Filter className="w-3 h-3 mr-1" /> Presets:
            </span>
            <button
              type="button"
              onClick={() => handleApplyPreset('7d')}
              className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors border ${
                activePreset === '7d'
                  ? 'bg-[#24211e] text-[#FAF8F5] border-[#24211e]'
                  : 'bg-[#FAF8F5] text-[#6b665e] hover:text-[#24211e] border-[#d8cdbc]'
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('30d')}
              className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors border ${
                activePreset === '30d'
                  ? 'bg-[#24211e] text-[#FAF8F5] border-[#24211e]'
                  : 'bg-[#FAF8F5] text-[#6b665e] hover:text-[#24211e] border-[#d8cdbc]'
              }`}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('90d')}
              className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors border ${
                activePreset === '90d'
                  ? 'bg-[#24211e] text-[#FAF8F5] border-[#24211e]'
                  : 'bg-[#FAF8F5] text-[#6b665e] hover:text-[#24211e] border-[#d8cdbc]'
              }`}
            >
              Last 90 Days
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('all')}
              className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors border ${
                activePreset === 'all'
                  ? 'bg-[#24211e] text-[#FAF8F5] border-[#24211e]'
                  : 'bg-[#FAF8F5] text-[#6b665e] hover:text-[#24211e] border-[#d8cdbc]'
              }`}
            >
              All Time
            </button>
          </div>

          <form onSubmit={handleFilterSubmit} className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#5f4b3b] uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-[#5f4b3b]" />
              <span>Custom Range:</span>
            </div>

            <div className="flex items-center gap-3 flex-1 flex-wrap">
              <div className="flex items-center space-x-1.5">
                <label htmlFor="from-date-input" className="text-xs font-semibold uppercase tracking-wider text-[#5f4b3b]">
                  From:
                </label>
                <input
                  id="from-date-input"
                  type="date"
                  value={fromDate}
                  max={toDate || getToday()}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setActivePreset('custom');
                  }}
                  className="text-xs sm:text-sm bg-[#FAF8F5] border border-[#d8cdbc] text-[#24211e] py-1.5 px-2.5 focus:border-[#5f4b3b] focus:outline-none"
                  title="From date"
                />
              </div>

              <div className="flex items-center space-x-1.5">
                <label htmlFor="to-date-input" className="text-xs font-semibold uppercase tracking-wider text-[#5f4b3b]">
                  To:
                </label>
                <input
                  id="to-date-input"
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  max={getToday()}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setActivePreset('custom');
                  }}
                  className="text-xs sm:text-sm bg-[#FAF8F5] border border-[#d8cdbc] text-[#24211e] py-1.5 px-2.5 focus:border-[#5f4b3b] focus:outline-none"
                  title="To date"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] bg-[#24211e] hover:bg-[#3f3025] border border-[#24211e] shadow-sm transition-colors"
              >
                Apply Filter
              </button>

              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#6b665e] bg-[#ebe5da] hover:bg-[#d8cdbc] border border-[#d8cdbc] transition-colors"
                >
                  Reset (90d)
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
                <div key={idx} className="bg-[#faf8f3] p-5 border border-[#d8cdbc] space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-[#ebe5da] rounded-none w-1/3" />
                    <div className="w-5 h-5 bg-[#ebe5da] rounded-none" />
                  </div>
                  <div className="h-8 bg-[#ebe5da] rounded-none w-1/2" />
                </div>
              ))}
            </div>

            {/* Breakdown Section Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="bg-[#faf8f3] p-6 border border-[#d8cdbc] space-y-4">
                  <div className="h-4 bg-[#ebe5da] rounded-none w-1/3 pb-2" />
                  <div className="space-y-2">
                    <div className="h-4 bg-[#FAF8F5] rounded-none" />
                    <div className="h-4 bg-[#FAF8F5] rounded-none" />
                    <div className="h-4 bg-[#FAF8F5] rounded-none" />
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, idx) => (
                <div key={idx} className="bg-[#faf8f3] p-6 border border-[#d8cdbc] space-y-4">
                  <div className="h-4 bg-[#ebe5da] rounded-none w-1/4 pb-3" />
                  <div className="space-y-3">
                    <div className="h-10 bg-[#FAF8F5] rounded-none" />
                    <div className="h-10 bg-[#FAF8F5] rounded-none" />
                    <div className="h-10 bg-[#FAF8F5] rounded-none" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : data ? (
          <>
            {/* Summary Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-[#faf8f3] p-5 border border-[#d8cdbc] shadow-sm">
                <div className="flex items-center justify-between text-[#5f4b3b] mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total</span>
                  <ClipboardList className="w-5 h-5 text-[#8F8778]" />
                </div>
                <p className="font-serif text-3xl font-normal text-[#24211e]">{data.total_complaints}</p>
              </div>

              <div className="bg-[#FAF8F5] p-5 border border-[#d8cdbc] shadow-sm">
                <div className="flex items-center justify-between text-[#8a6843] mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Open</span>
                  <Clock className="w-5 h-5 text-[#8a6843]" />
                </div>
                <p className="font-serif text-3xl font-normal text-[#8a6843]">{data.total_open}</p>
              </div>

              <div className="bg-[#ebe5da] p-5 border border-[#d8cdbc] shadow-sm">
                <div className="flex items-center justify-between text-[#5f4b3b] mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">In Progress</span>
                  <AlertTriangle className="w-5 h-5 text-[#5f4b3b]" />
                </div>
                <p className="font-serif text-3xl font-normal text-[#5f4b3b]">{data.total_in_progress}</p>
              </div>

              <div className="bg-[#faf8f3] p-5 border border-[#b8c9af] shadow-sm">
                <div className="flex items-center justify-between text-[#52634a] mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Resolved</span>
                  <CheckCircle2 className="w-5 h-5 text-[#52634a]" />
                </div>
                <p className="font-serif text-3xl font-normal text-[#52634a]">{data.total_resolved}</p>
              </div>

              <div className="bg-[#fbeeed] p-5 border border-[#d9a8a0] shadow-sm col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between text-[#8a4d43] mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Overdue</span>
                  <AlertOctagon className="w-5 h-5 text-[#8a4d43]" />
                </div>
                <p className="font-serif text-3xl font-normal text-[#8a4d43]">{data.total_overdue}</p>
              </div>
            </div>

            {/* Breakdown Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* By Status */}
              <div className="bg-[#faf8f3] p-6 border border-[#d8cdbc] shadow-sm space-y-3">
                <h3 className="font-serif text-lg text-[#24211e] font-normal border-b border-[#d8cdbc] pb-2">
                  By Status
                </h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(data.by_status || {}).map(([st, cnt]) => (
                    <div key={st} className="flex items-center justify-between">
                      <StatusBadge status={st} showOverdue={false} />
                      <span className="font-serif text-base text-[#24211e]">{cnt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Priority */}
              <div className="bg-[#faf8f3] p-6 border border-[#d8cdbc] shadow-sm space-y-3">
                <h3 className="font-serif text-lg text-[#24211e] font-normal border-b border-[#d8cdbc] pb-2">
                  By Priority
                </h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(data.by_priority || {}).map(([prio, cnt]) => (
                    <div key={prio} className="flex items-center justify-between">
                      <PriorityBadge priority={prio} />
                      <span className="font-serif text-base text-[#24211e]">{cnt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Category */}
              <div className="bg-[#faf8f3] p-6 border border-[#d8cdbc] shadow-sm space-y-3">
                <h3 className="font-serif text-lg text-[#24211e] font-normal border-b border-[#d8cdbc] pb-2">
                  By Category
                </h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(data.by_category || {}).map(([cat, cnt]) => (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#5f4b3b]">{cat}</span>
                      <span className="font-serif text-base text-[#24211e]">{cnt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity: Complaints & Transitions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Complaints */}
              <div className="bg-[#faf8f3] p-6 border border-[#d8cdbc] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#d8cdbc] pb-3">
                  <h3 className="font-serif text-lg text-[#24211e] font-normal">Recent Complaints</h3>
                  <Link to="/admin/complaints" className="text-xs font-bold uppercase tracking-wider text-[#5f4b3b] hover:text-[#24211e] flex items-center">
                    View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>

                {data.recent_complaints?.length === 0 ? (
                  <p className="text-sm text-[#6b665e] italic">No complaints found.</p>
                ) : (
                  <div className="divide-y divide-[#d8cdbc]/60">
                    {data.recent_complaints.map((c) => (
                      <div key={c.id} className="py-3 flex items-center justify-between gap-2">
                        <div>
                          <Link
                            to={`/complaints/${c.id}`}
                            className="font-serif text-base font-normal text-[#24211e] hover:text-[#5f4b3b] line-clamp-1"
                          >
                            {c.title}
                          </Link>
                          <p className="text-xs text-[#6b665e] mt-0.5">
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
              <div className="bg-[#faf8f3] p-6 border border-[#d8cdbc] shadow-sm space-y-4">
                <div className="border-b border-[#d8cdbc] pb-3">
                  <h3 className="font-serif text-lg text-[#24211e] font-normal">Recent Status Transitions</h3>
                </div>

                {data.recent_status_transitions?.length === 0 ? (
                  <p className="text-sm text-[#6b665e] italic">No recent transitions recorded.</p>
                ) : (
                  <div className="divide-y divide-[#d8cdbc]/60">
                    {data.recent_status_transitions.map((t) => (
                      <div key={t.id} className="py-3 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <Link
                            to={`/complaints/${t.complaint_id}`}
                            className="font-semibold text-[#5f4b3b] hover:text-[#24211e]"
                          >
                            Complaint #{t.complaint_id}
                          </Link>
                          <span className="text-[#8F8778]">
                            {new Date(t.changed_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 font-semibold text-[#24211e]">
                          <span>{t.from_status || 'INITIAL'}</span>
                          <span>&rarr;</span>
                          <span className="text-[#5f4b3b]">{t.to_status}</span>
                        </div>
                        {t.note && <p className="text-[#6b665e] italic mt-0.5">"{t.note}"</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
