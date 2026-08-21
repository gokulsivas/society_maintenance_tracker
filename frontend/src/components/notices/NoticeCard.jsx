import React from 'react';
import { Pin, Calendar, User, Edit, Trash2 } from 'lucide-react';

export default function NoticeCard({ notice, onEdit = null, onDelete = null, isAdmin = false }) {
  const formattedDate = new Date(notice.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className={`rounded-xl border p-5 transition-all ${
        notice.is_important
          ? 'bg-rose-50/40 border-rose-200 shadow-sm'
          : 'bg-white border-gray-200 shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {notice.is_important && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
              <Pin className="w-3.5 h-3.5 mr-1 text-rose-600 fill-rose-600" />
              IMPORTANT
            </span>
          )}
          <h4 className="text-base font-bold text-gray-900">{notice.title}</h4>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-1 flex-shrink-0">
            {onEdit && (
              <button
                onClick={() => onEdit(notice)}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="Edit notice"
                aria-label="Edit notice"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(notice)}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Delete notice"
                aria-label="Delete notice"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed mb-4">
        {notice.body}
      </p>

      <div className="pt-3 border-t border-gray-100/80 flex items-center justify-between text-xs text-gray-500">
        <span className="inline-flex items-center">
          <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
          Posted on {formattedDate}
        </span>
        {notice.author_name && (
          <span className="inline-flex items-center font-medium text-gray-600">
            <User className="w-3.5 h-3.5 mr-1 text-gray-400" />
            {notice.author_name}
          </span>
        )}
      </div>
    </div>
  );
}
