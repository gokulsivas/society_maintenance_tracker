import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { listNotices, deleteNotice } from '../api/notices';
import { getErrorMessage, isRequestCanceled } from '../api/client';
import NoticeCard from '../components/notices/NoticeCard';
import NoticeModal from '../components/notices/NoticeModal';
import { NoticeCardSkeleton } from '../components/common/Skeleton';
import ErrorAlert from '../components/common/ErrorAlert';
import EmptyState from '../components/common/EmptyState';
import { Bell, PlusCircle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

export default function NoticeBoardPage() {
  const { isAdmin } = useAuth();
  const [notices, setNotices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, page_size: 10, total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Admin Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);

  const controllerRef = useRef(null);

  const fetchNotices = async (page = 1) => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);
      const data = await listNotices({ page, page_size: pagination.page_size }, { signal: controller.signal });
      setNotices(data?.items || []);
      setPagination({
        page: data?.page || 1,
        page_size: data?.page_size || 10,
        total: data?.total || 0,
        total_pages: data?.total_pages || 1,
      });
    } catch (err) {
      if (isRequestCanceled(err)) return;
      setError(getErrorMessage(err, 'Failed to load notices.'));
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchNotices(1);
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  const handleCreateNew = () => {
    setEditingNotice(null);
    setIsModalOpen(true);
  };

  const handleEdit = (notice) => {
    setEditingNotice(notice);
    setIsModalOpen(true);
  };

  const handleDelete = async (notice) => {
    if (!window.confirm(`Are you sure you want to delete notice "${notice.title}"?`)) return;

    try {
      await deleteNotice(notice.id);
      fetchNotices(pagination.page);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete notice.'));
    }
  };

  return (
    <div className="editorial-page-surface min-h-[calc(100vh-5rem)] py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] pb-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-[#ebe5da] dark:bg-[#342d27] text-[#5f4b3b] dark:text-[#d8cdbc] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] rounded-none">
                <Bell className="w-4 h-4" />
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#24211e] dark:text-[#f5f2ec] tracking-tight">
                Society Notice Board
              </h1>
            </div>
            <p className="text-sm text-[#6b665e] dark:text-[#c8bfb3] mt-1">
              Stay informed with society announcements, scheduled maintenance, and community updates.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchNotices(pagination.page)}
              className="p-2.5 text-[#24211e] dark:text-[#f5f2ec] bg-[#faf8f3] dark:bg-[#24211e] hover:bg-[#ebe5da] dark:hover:bg-[#342d27] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] shadow-sm transition-colors rounded-none"
              title="Refresh notices"
              aria-label="Refresh notices"
            >
              <RefreshCw className={`w-4 h-4 text-[#5f4b3b] dark:text-[#d8cdbc] ${loading ? 'animate-spin' : ''}`} />
            </button>

            {isAdmin && (
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#24211e] hover:bg-[#3f3025] dark:bg-[#342d27] dark:hover:bg-[#433931] text-[#FAF8F5] border border-[#24211e] dark:border-[rgba(245,242,236,0.2)] shadow-sm transition-all rounded-none"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Publish Notice
              </button>
            )}
          </div>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError(null)} />

        {/* Content */}
        {loading && notices.length === 0 ? (
          <NoticeCardSkeleton count={3} />
        ) : notices.length === 0 ? (
          <EmptyState
            title="No notices published yet"
            description="Official announcements and alerts from the management committee will appear here."
            actionText={isAdmin ? 'Publish First Notice' : null}
            onAction={isAdmin ? handleCreateNew : null}
          />
        ) : (
          <div className="space-y-5">
            {notices.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}

            {/* Pagination Controls */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)]">
                <span className="text-xs text-[#6b665e] dark:text-[#c8bfb3]">
                  Page {pagination.page} of {pagination.total_pages} ({pagination.total} notices total)
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => fetchNotices(pagination.page - 1)}
                    className="inline-flex items-center px-4 py-2 border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] text-xs font-semibold uppercase tracking-wider text-[#24211e] dark:text-[#f5f2ec] bg-[#FAF8F5] dark:bg-[#2b2723] hover:bg-[#ebe5da] dark:hover:bg-[#342d27] disabled:opacity-50 transition-colors rounded-none"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </button>
                  <button
                    disabled={pagination.page >= pagination.total_pages}
                    onClick={() => fetchNotices(pagination.page + 1)}
                    className="inline-flex items-center px-4 py-2 border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] text-xs font-semibold uppercase tracking-wider text-[#24211e] dark:text-[#f5f2ec] bg-[#FAF8F5] dark:bg-[#2b2723] hover:bg-[#ebe5da] dark:hover:bg-[#342d27] disabled:opacity-50 transition-colors rounded-none"
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Admin Notice Modal */}
        {isAdmin && (
          <NoticeModal
            notice={editingNotice}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => fetchNotices(pagination.page)}
          />
        )}
      </div>
    </div>
  );
}
