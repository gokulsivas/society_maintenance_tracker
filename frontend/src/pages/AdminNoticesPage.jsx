import React, { useState, useEffect, useRef } from 'react';
import { listNotices, deleteNotice } from '../api/notices';
import { getErrorMessage, isRequestCanceled } from '../api/client';
import NoticeCard from '../components/notices/NoticeCard';
import NoticeModal from '../components/notices/NoticeModal';
import { NoticeCardSkeleton } from '../components/common/Skeleton';
import ErrorAlert from '../components/common/ErrorAlert';
import EmptyState from '../components/common/EmptyState';
import { Bell, PlusCircle, RefreshCw } from 'lucide-react';

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);

  const controllerRef = useRef(null);

  const fetchNotices = async () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);
      const data = await listNotices({ page: 1, page_size: 50 }, { signal: controller.signal });
      setNotices(data?.items || []);
    } catch (err) {
      if (isRequestCanceled(err)) return;
      setError(getErrorMessage(err, 'Failed to load society notices.'));
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchNotices();
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  const handleCreate = () => {
    setSelectedNotice(null);
    setIsModalOpen(true);
  };

  const handleEdit = (notice) => {
    setSelectedNotice(notice);
    setIsModalOpen(true);
  };

  const handleDelete = async (notice) => {
    if (!window.confirm(`Are you sure you want to delete notice "${notice.title}"?`)) return;

    try {
      await deleteNotice(notice.id);
      fetchNotices();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete notice.'));
    }
  };

  return (
    <div className="editorial-page-surface min-h-[calc(100vh-5rem)] py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d8cdbc] pb-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-[#ebe5da] text-[#5f4b3b] border border-[#d8cdbc]">
                <Bell className="w-4 h-4" />
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#24211e] tracking-tight">
                Notice Management
              </h1>
            </div>
            <p className="text-sm text-[#6b665e] mt-1">
              Publish, edit, and broadcast society announcements to residents.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchNotices}
              className="p-2.5 text-[#24211e] bg-[#faf8f3] hover:bg-[#ebe5da] border border-[#d8cdbc] shadow-sm transition-colors"
              title="Refresh list"
              aria-label="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 text-[#5f4b3b] ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleCreate}
              className="inline-flex items-center px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#24211e] hover:bg-[#3f3025] text-[#FAF8F5] border border-[#24211e] shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Publish Notice
            </button>
          </div>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError(null)} />

        {loading && notices.length === 0 ? (
          <NoticeCardSkeleton count={4} />
        ) : notices.length === 0 ? (
          <EmptyState
            title="No notices published"
            description="Click 'Publish Notice' above to post the first notice for all residents."
            actionText="Publish Notice"
            onAction={handleCreate}
          />
        ) : (
          <div className="space-y-5">
            {notices.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                isAdmin={true}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        <NoticeModal
          notice={selectedNotice}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedNotice(null);
          }}
          onSuccess={() => fetchNotices()}
        />
      </div>
    </div>
  );
}
