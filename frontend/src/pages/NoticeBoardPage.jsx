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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Society Notice Board
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Stay informed with society announcements, scheduled maintenance, and community updates.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchNotices(pagination.page)}
            className="p-2.5 text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-sm transition-colors"
            title="Refresh notices"
            aria-label="Refresh notices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isAdmin && (
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-4 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
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
        <div className="space-y-4">
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
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-xs text-gray-500">
                Page {pagination.page} of {pagination.total_pages} ({pagination.total} notices total)
              </span>

              <div className="flex items-center space-x-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchNotices(pagination.page - 1)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => fetchNotices(pagination.page + 1)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
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
  );
}
