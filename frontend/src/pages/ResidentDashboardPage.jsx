import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyComplaints } from '../api/complaints';
import { listNotices } from '../api/notices';
import { isRequestCanceled } from '../api/client';
import ComplaintCard from '../components/complaints/ComplaintCard';
import NoticeCard from '../components/notices/NoticeCard';
import { MetricCardSkeleton, ComplaintCardSkeleton, NoticeCardSkeleton } from '../components/common/Skeleton';
import ErrorAlert from '../components/common/ErrorAlert';
import EmptyState from '../components/common/EmptyState';
import {
  PlusCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bell,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';

export default function ResidentDashboardPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);
        const [complaintsData, noticesData] = await Promise.all([
          getMyComplaints({ signal: controller.signal }),
          listNotices({ page: 1, page_size: 2 }, { signal: controller.signal }),
        ]);
        setComplaints(complaintsData || []);
        setRecentNotices(noticesData?.items || []);
      } catch (err) {
        if (isRequestCanceled(err)) return;
        setError('Failed to load dashboard data. Please refresh.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      controller.abort();
    };
  }, []);

  const openCount = complaints.filter((c) => c.status === 'OPEN').length;
  const progressCount = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length;

  return (
    <div className="editorial-page-surface min-h-[calc(100vh-5rem)] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-[#faf8f3] p-6 sm:p-10 text-[#24211e] border border-[#d8cdbc] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative rounded-none">
          <div className="space-y-2">
            <span className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-[#ebe5da] text-[#5f4b3b] border border-[#d8cdbc]">
              Resident Portal &bull; Flat {user?.flat_no || 'Resident'}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#24211e]">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-[#6b665e] text-sm leading-relaxed max-w-xl">
              Track maintenance tickets, check live status updates, and stay informed with society notices.
            </p>
          </div>

          <Link
            to="/complaints/new"
            className="inline-flex items-center px-6 py-3.5 text-xs font-semibold uppercase tracking-wider bg-[#24211e] hover:bg-[#3f3025] text-[#FAF8F5] border border-[#24211e] transition-all flex-shrink-0 shadow-sm"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Raise Complaint
          </Link>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError(null)} />

        {/* Metric Cards */}
        {loading ? (
          <MetricCardSkeleton count={3} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-[#faf8f3] p-6 border border-[#d8cdbc] shadow-sm flex items-center space-x-4 rounded-none">
              <div className="p-3.5 bg-[#ebe5da] text-[#8a6843] border border-[#d8cdbc] rounded-none">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#5f4b3b] uppercase tracking-wider">Open Tickets</p>
                <p className="font-serif text-3xl text-[#24211e] font-normal mt-0.5">{openCount}</p>
              </div>
            </div>

            <div className="bg-[#ebe5da] p-6 border border-[#d8cdbc] shadow-sm flex items-center space-x-4 rounded-none">
              <div className="p-3.5 bg-[#faf8f3] text-[#5f4b3b] border border-[#d8cdbc] rounded-none">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#5f4b3b] uppercase tracking-wider">In Progress</p>
                <p className="font-serif text-3xl text-[#24211e] font-normal mt-0.5">{progressCount}</p>
              </div>
            </div>

            <div className="bg-[#faf8f3] p-6 border border-[#d8cdbc] shadow-sm flex items-center space-x-4 rounded-none">
              <div className="p-3.5 bg-[#eef2eb] text-[#52634a] border border-[#b8c9af] rounded-none">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#5f4b3b] uppercase tracking-wider">Resolved</p>
                <p className="font-serif text-3xl text-[#24211e] font-normal mt-0.5">{resolvedCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* Society Announcements Preview */}
        {loading ? (
          <div className="space-y-3">
            <div className="h-6 bg-[#ebe5da] w-1/4 animate-pulse rounded-none" />
            <NoticeCardSkeleton count={2} />
          </div>
        ) : (
          recentNotices.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#d8cdbc] pb-3">
                <h3 className="font-serif text-xl sm:text-2xl text-[#24211e] font-normal flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#5f4b3b]" />
                  Latest Society Announcements
                </h3>
                <Link to="/notices" className="text-xs font-bold uppercase tracking-wider text-[#5f4b3b] hover:text-[#24211e] inline-flex items-center transition-colors">
                  View All Notices <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {recentNotices.map((n) => (
                  <NoticeCard key={n.id} notice={n} />
                ))}
              </div>
            </div>
          )
        )}

        {/* Recent Complaints Section */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-6 bg-[#ebe5da] w-1/4 animate-pulse rounded-none" />
            <ComplaintCardSkeleton count={3} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#d8cdbc] pb-3">
              <h3 className="font-serif text-xl sm:text-2xl text-[#24211e] font-normal flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#5f4b3b]" />
                My Recent Complaints
              </h3>
              {complaints.length > 0 && (
                <Link to="/complaints" className="text-xs font-bold uppercase tracking-wider text-[#5f4b3b] hover:text-[#24211e] inline-flex items-center transition-colors">
                  View All ({complaints.length}) <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              )}
            </div>

            {complaints.length === 0 ? (
              <EmptyState
                title="No complaints raised yet"
                description="Whenever you face plumbing, electrical, or other maintenance issues, raise a complaint here."
                actionText="Raise Your First Complaint"
                actionLink="/complaints/new"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {complaints.slice(0, 6).map((c) => (
                  <ComplaintCard key={c.id} complaint={c} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
