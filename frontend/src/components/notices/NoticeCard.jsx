import React from 'react';
import { Pin, Calendar, User, Edit, Trash2 } from 'lucide-react';

export default function NoticeCard({ notice, onEdit = null, onDelete = null, isAdmin = false }) {
  const formattedDate = new Date(notice.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isImportant = !!notice.is_important;

  return (
    <div
      className={`border p-6 transition-all shadow-sm rounded-none ${
        isImportant
          ? 'bg-[#f2dfdc] border-[#bd8178]'
          : 'bg-[#faf8f3] border-[#d8cdbc]'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          {isImportant && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded-none whitespace-nowrap bg-[#9b5a50] text-[#fff8f5] border border-[#9b5a50]">
              <Pin className="w-3 h-3 mr-1 text-[#fff8f5] fill-[#fff8f5]" />
              Important
            </span>
          )}
          <h4
            className={`font-serif text-xl font-normal ${
              isImportant ? 'text-[#5f302c]' : 'text-[#24211e]'
            }`}
          >
            {notice.title}
          </h4>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-1 flex-shrink-0">
            {onEdit && (
              <button
                onClick={() => onEdit(notice)}
                className={`p-1.5 border border-transparent transition-colors rounded-none ${
                  isImportant
                    ? 'text-[#7e443d] hover:text-[#5f302c] hover:bg-[#e8cfcb]'
                    : 'text-[#6b665e] hover:text-[#24211e] hover:bg-[#ebe5da]'
                }`}
                title="Edit notice"
                aria-label="Edit notice"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(notice)}
                className="p-1.5 text-[#7e443d] hover:text-[#5f302c] hover:bg-[#e8cfcb] border border-transparent hover:border-[#bd8178] transition-colors rounded-none"
                title="Delete notice"
                aria-label="Delete notice"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <p
        className={`text-sm whitespace-pre-line leading-relaxed mb-4 ${
          isImportant ? 'text-[#70433e]' : 'text-[#6b665e]'
        }`}
      >
        {notice.body}
      </p>

      <div
        className={`pt-3 border-t flex items-center justify-between text-xs ${
          isImportant
            ? 'border-[#bd8178]/60 text-[#7e443d]'
            : 'border-[#d8cdbc]/60 text-[#6b665e]'
        }`}
      >
        <span className="inline-flex items-center">
          <Calendar className={`w-3.5 h-3.5 mr-1 ${isImportant ? 'text-[#7e443d]' : 'text-[#8F8778]'}`} />
          Posted on {formattedDate}
        </span>
        {notice.author_name && (
          <span
            className={`inline-flex items-center font-medium ${
              isImportant ? 'text-[#5f302c]' : 'text-[#24211e]'
            }`}
          >
            <User className={`w-3.5 h-3.5 mr-1 ${isImportant ? 'text-[#7e443d]' : 'text-[#8F8778]'}`} />
            {notice.author_name}
          </span>
        )}
      </div>
    </div>
  );
}
