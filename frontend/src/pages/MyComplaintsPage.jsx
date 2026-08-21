import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getMyComplaints } from '../api/complaints';
import { isRequestCanceled } from '../api/client';
import ComplaintCard from '../components/complaints/ComplaintCard';
import { ComplaintCardSkeleton } from '../components/common/Skeleton';
import ErrorAlert from '../components/common/ErrorAlert';
import EmptyState from '../components/common/EmptyState';
import { PlusCircle, Search, Filter, RefreshCw } from 'lucide-react';

export default function MyComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const controllerRef = useRef(null);

  const fetchComplaints = async () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);
      const data = await getMyComplaints({ signal: controller.signal });
      setComplaints(data || []);
    } catch (err) {
      if (isRequestCanceled(err)) return;
      setError('Failed to fetch your complaints. Please try again.');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchComplaints();
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toString().includes(searchQuery);

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="editorial-page-surface min-h-[calc(100vh-5rem)] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] pb-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#24211e] dark:text-[#f5f2ec] tracking-tight">
              My Complaints
            </h1>
            <p className="text-sm text-[#6b665e] dark:text-[#c8bfb3] mt-1">
              Track the live resolution status and history of your submitted maintenance requests.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-auto">
            <button
              onClick={fetchComplaints}
              className="inline-flex items-center px-4 py-2.5 bg-[#faf8f3] dark:bg-[#24211e] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] text-[#24211e] dark:text-[#f5f2ec] hover:bg-[#ebe5da] dark:hover:bg-[#342d27] text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm rounded-none"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-2 text-[#5f4b3b] dark:text-[#d8cdbc] ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              to="/complaints/new"
              className="inline-flex items-center px-5 py-2.5 bg-[#24211e] hover:bg-[#3f3025] dark:bg-[#342d27] dark:hover:bg-[#433931] text-[#FAF8F5] border border-[#24211e] dark:border-[rgba(245,242,236,0.2)] text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm rounded-none"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              New Complaint
            </Link>
          </div>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError(null)} />

        {/* Filter and Search Bar */}
        <div className="bg-[#faf8f3] dark:bg-[#24211e] p-4 sm:p-5 border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between rounded-none">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8F8778] dark:text-[#a89e91]">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, or ID..."
              className="block w-full pl-10 pr-3.5 py-2 text-sm bg-[#FAF8F5] dark:bg-[#2a2520] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] text-[#24211e] dark:text-[#f5f2ec] placeholder-[#a8a196] dark:placeholder-[#887e72] focus:border-[#5f4b3b] focus:outline-none rounded-none"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center space-x-1.5 text-xs text-[#5f4b3b] dark:text-[#d8cdbc] uppercase tracking-wider font-semibold">
              <Filter className="w-3.5 h-3.5 text-[#5f4b3b] dark:text-[#d8cdbc]" />
              <span>Filter:</span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs sm:text-sm border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] py-2 px-3 focus:outline-none focus:border-[#5f4b3b] bg-[#FAF8F5] dark:bg-[#2a2520] text-[#24211e] dark:text-[#f5f2ec] rounded-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs sm:text-sm border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] py-2 px-3 focus:outline-none focus:border-[#5f4b3b] bg-[#FAF8F5] dark:bg-[#2a2520] text-[#24211e] dark:text-[#f5f2ec] rounded-none"
            >
              <option value="ALL">All Categories</option>
              <option value="PLUMBING">Plumbing</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="CARPENTRY">Carpentry</option>
              <option value="CLEANLINESS">Cleanliness</option>
              <option value="SECURITY">Security</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading && complaints.length === 0 ? (
          <ComplaintCardSkeleton count={6} />
        ) : filteredComplaints.length === 0 ? (
          <EmptyState
            title={searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL' ? 'No matching complaints found' : 'No complaints raised yet'}
            description={
              searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                ? 'Try adjusting your search query or filter options.'
                : 'Whenever an issue arises in your apartment or common area, raise a complaint here.'
            }
            actionText={searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL' ? 'Clear Filters' : 'Raise a Complaint'}
            onAction={
              searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                ? () => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setCategoryFilter('ALL');
                  }
                : null
            }
            actionLink={searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL' ? null : '/complaints/new'}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredComplaints.map((c) => (
              <ComplaintCard key={c.id} complaint={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
