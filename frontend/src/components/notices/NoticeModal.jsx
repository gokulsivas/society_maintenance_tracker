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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#faf8f3] dark:bg-[#24211e] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative rounded-none">
        <div className="flex items-center justify-between pb-4 border-b border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] mb-5">
          <h3 className="font-serif text-xl font-normal text-[#24211e] dark:text-[#f5f2ec] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#5f4b3b] dark:text-[#d8cdbc]" />
            {isEditing ? 'Edit Notice' : 'Publish New Notice'}
          </h3>
          <button
            onClick={onClose}
            className="text-[#6b665e] dark:text-[#b9afa3] hover:text-[#24211e] dark:hover:text-[#f5f2ec] p-1 transition-colors rounded-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError(null)} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="notice-title" className="block text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] dark:text-[#d8cdbc] mb-1.5">
              Title <span className="text-[#8a4d43] dark:text-[#efb2a8]">*</span>
            </label>
            <input
              id="notice-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Water Tank Maintenance Schedule"
              className="w-full bg-[#FAF8F5] dark:bg-[#2a2520] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] text-[#24211e] dark:text-[#f5f2ec] placeholder-[#a8a196] dark:placeholder-[#887e72] focus:border-[#5f4b3b] focus:outline-none text-sm p-2.5 rounded-none"
            />
          </div>

          <div>
            <label htmlFor="notice-body" className="block text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] dark:text-[#d8cdbc] mb-1.5">
              Notice Body <span className="text-[#8a4d43] dark:text-[#efb2a8]">*</span>
            </label>
            <textarea
              id="notice-body"
              rows={4}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the full announcement details..."
              className="w-full bg-[#FAF8F5] dark:bg-[#2a2520] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] text-[#24211e] dark:text-[#f5f2ec] placeholder-[#a8a196] dark:placeholder-[#887e72] focus:border-[#5f4b3b] focus:outline-none text-sm p-2.5 rounded-none"
            />
          </div>

          <div className="flex items-start space-x-3 p-3.5 bg-[#ebe5da]/70 dark:bg-[#342d27] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] rounded-none">
            <div className="flex items-center h-5">
              <input
                id="is-important"
                type="checkbox"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                className="h-4 w-4 accent-[#5f4b3b] border-[#d8cdbc]"
              />
            </div>
            <div className="text-xs">
              <label htmlFor="is-important" className="font-bold text-[#24211e] dark:text-[#f5f2ec] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                <Pin className="w-3.5 h-3.5 text-[#8a4d43] dark:text-[#efb2a8] fill-[#8a4d43] dark:fill-[#efb2a8]" />
                Mark as Important / Pinned
              </label>
              <p className="text-[#6b665e] dark:text-[#c8bfb3] mt-1 leading-relaxed">
                Important notices are pinned to the top of the board{!isEditing && ' and sent via broadcast email to all active residents'}.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#6b665e] dark:text-[#c8bfb3] bg-[#ebe5da] dark:bg-[#342d27] hover:bg-[#d8cdbc] dark:hover:bg-[#433931] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] transition-colors rounded-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !body.trim()}
              className="inline-flex items-center px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] bg-[#24211e] hover:bg-[#3f3025] dark:bg-[#342d27] dark:hover:bg-[#433931] disabled:opacity-50 border border-[#24211e] dark:border-[rgba(245,242,236,0.2)] shadow-sm transition-colors rounded-none"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Publish Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
