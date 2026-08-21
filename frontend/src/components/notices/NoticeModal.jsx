import React, { useState, useEffect } from 'react';
import { createNotice, updateNotice } from '../../api/notices';
import { getErrorMessage } from '../../api/client';
import ErrorAlert from '../common/ErrorAlert';
import { X, Loader2, Pin, Bell } from 'lucide-react';

export default function NoticeModal({ notice = null, isOpen, onClose, onSuccess }) {
  const isEditing = Boolean(notice?.id);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (notice) {
      setTitle(notice.title || '');
      setBody(notice.body || '');
      setIsImportant(Boolean(notice.is_important));
    } else {
      setTitle('');
      setBody('');
      setIsImportant(false);
    }
    setError(null);
  }, [notice, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Please fill in both title and notice body.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (isEditing) {
        const updated = await updateNotice(notice.id, {
          title: title.trim(),
          body: body.trim(),
          is_important: isImportant,
        });
        onSuccess(updated);
      } else {
        const created = await createNotice({
          title: title.trim(),
          body: body.trim(),
          is_important: isImportant,
        });
        onSuccess(created);
      }
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save notice.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            {isEditing ? 'Edit Notice' : 'Publish New Notice'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError(null)} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="notice-title" className="block text-sm font-semibold text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="notice-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Water Tank Maintenance Schedule"
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
            />
          </div>

          <div>
            <label htmlFor="notice-body" className="block text-sm font-semibold text-gray-700 mb-1">
              Notice Body <span className="text-red-500">*</span>
            </label>
            <textarea
              id="notice-body"
              rows={4}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the full announcement details..."
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
            />
          </div>

          <div className="flex items-start space-x-3 p-3 bg-amber-50/70 rounded-lg border border-amber-200">
            <div className="flex items-center h-5">
              <input
                id="is-important"
                type="checkbox"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="text-xs">
              <label htmlFor="is-important" className="font-bold text-gray-900 flex items-center gap-1 cursor-pointer">
                <Pin className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                Mark as Important / Pinned
              </label>
              <p className="text-gray-600 mt-0.5">
                Important notices are pinned to the top of the board{!isEditing && ' and sent via broadcast email to all active residents'}.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !body.trim()}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Publish Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
