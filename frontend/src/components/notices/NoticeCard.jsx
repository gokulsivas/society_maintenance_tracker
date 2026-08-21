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
      className={`border p-6 transition-all shadow-sm ${
        notice.is_important
          ? 'bg-[#fbeeed]/80 border-[#d9a8a0]'
          : 'bg-[#faf8f3] border-[#d8cdbc]'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          {notice.is_important && (
            <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-[#8a4d43] text-white border border-[#8a4d43]">
              <Pin className="w-3.5 h-3.5 mr-1 text-white fill-white" />
              Important
            </span>
          )}
          <h4 className="font-serif text-xl font-normal text-[#24211e]">{notice.title}</h4>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-1 flex-shrink-0">
            {onEdit && (
              <button
                onClick={() => onEdit(notice)}
                className="p-1.5 text-[#6b665e] hover:text-[#24211e] hover:bg-[#ebe5da] border border-transparent hover:border-[#d8cdbc] transition-colors"
                title="Edit notice"
                aria-label="Edit notice"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(notice)}
                className="p-1.5 text-[#8a4d43] hover:text-red-800 hover:bg-[#fbeeed] border border-transparent hover:border-[#d9a8a0] transition-colors"
                title="Delete notice"
                aria-label="Delete notice"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-sm text-[#6b665e] whitespace-pre-line leading-relaxed mb-4">
        {notice.body}
      </p>

      <div className="pt-3 border-t border-[#d8cdbc]/60 flex items-center justify-between text-xs text-[#6b665e]">
        <span className="inline-flex items-center">
          <Calendar className="w-3.5 h-3.5 mr-1 text-[#8F8778]" />
          Posted on {formattedDate}
        </span>
        {notice.author_name && (
          <span className="inline-flex items-center font-medium text-[#24211e]">
            <User className="w-3.5 h-3.5 mr-1 text-[#8F8778]" />
            {notice.author_name}
          </span>
        )}
      </div>
    </div>
  );
}
