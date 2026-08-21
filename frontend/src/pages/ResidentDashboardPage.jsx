import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyComplaints } from '../api/complaints';
import { listNotices } from '../api/notices';
import ComplaintCard from '../components/complaints/ComplaintCard';
import NoticeCard from '../components/notices/NoticeCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
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
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [complaintsData, noticesData] = await Promise.all([
          getMyComplaints(),
          listNotices({ page: 1, page_size: 2 }),
        ]);
        setComplaints(complaintsData || []);
        setRecentNotices(noticesData?.items || []);
      } catch (err) {
        setError('Failed to load dashboard data. Please refresh.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const openCount = complaints.filter((c) => c.status === 'OPEN').length;
  const progressCount = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED').length;

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." size="large" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-blue-800 text-blue-200 mb-2">
            Resident Portal &bull; Flat {user?.flat_no || 'Resident'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-blue-200 text-sm mt-1">
            Track maintenance tickets, check live status updates, and stay informed with society notices.
          </p>
        </div>

        <Link
          to="/complaints/new"
          className="inline-flex items-center px-5 py-3 rounded-xl font-bold text-sm bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-900/40 transition-all flex-shrink-0"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Raise Complaint
        </Link>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError(null)} />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-xl border border-amber-200/80 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Open Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{openCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-blue-200/80 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">In Progress</p>
            <p className="text-2xl font-bold text-gray-900">{progressCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-200/80 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Resolved</p>
            <p className="text-2xl font-bold text-gray-900">{resolvedCount}</p>
          </div>
        </div>
      </div>

      {/* Society Announcements Preview */}
      {recentNotices.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Latest Society Announcements
            </h3>
            <Link to="/notices" className="text-sm font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center">
              View All Notices <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentNotices.map((n) => (
              <NoticeCard key={n.id} notice={n} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Complaints Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            My Recent Complaints
          </h3>
          {complaints.length > 0 && (
            <Link to="/complaints" className="text-sm font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center">
              View All ({complaints.length}) <ArrowRight className="w-4 h-4 ml-1" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complaints.slice(0, 6).map((c) => (
              <ComplaintCard key={c.id} complaint={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
