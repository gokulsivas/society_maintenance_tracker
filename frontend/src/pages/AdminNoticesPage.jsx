import React, { useState, useEffect } from 'react';
import { listNotices, deleteNotice } from '../api/notices';
import { getErrorMessage } from '../api/client';
import NoticeCard from '../components/notices/NoticeCard';
import NoticeModal from '../components/notices/NoticeModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
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

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listNotices({ page: 1, page_size: 50 });
      setNotices(data?.items || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load society notices.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-blue-600" />
            Notice Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Publish, edit, and broadcast society announcements to residents.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchNotices}
            className="p-2.5 text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-sm transition-colors"
            title="Refresh list"
            aria-label="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Publish Notice
          </button>
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError(null)} />

      {loading ? (
        <LoadingSpinner message="Loading notices..." size="large" />
      ) : notices.length === 0 ? (
        <EmptyState
          title="No notices published"
          description="Click 'Publish Notice' above to post the first notice for all residents."
          actionText="Publish Notice"
          onAction={handleCreate}
        />
      ) : (
        <div className="space-y-4">
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
  );
}
