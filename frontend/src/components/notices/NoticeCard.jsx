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
          ? 'bg-[#fbeeed]/80 dark:bg-[#4a2927] border-[#d9a8a0] dark:border-[#8f5148]'
          : 'bg-[#faf8f3] dark:bg-[#2b2723] border-[#d8cdbc] dark:border-[rgba(245,242,236,0.20)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          {isImportant && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded-none whitespace-nowrap bg-[#8a4d43] dark:bg-[#7e443d] text-white dark:text-[#fff5f2] border border-[#8a4d43] dark:border-[#8f5148]">
              <Pin className="w-3 h-3 mr-1 text-white dark:text-[#f0c5bc] fill-white dark:fill-[#f0c5bc]" />
              Important
            </span>
          )}
          <h4
            className={`font-serif text-xl font-normal ${
              isImportant ? 'text-[#24211e] dark:text-[#fff1ee]' : 'text-[#24211e] dark:text-[#f5f2ec]'
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
                    ? 'text-[#6b665e] dark:text-[#d7aaa2] hover:text-[#24211e] dark:hover:text-[#fff1ee] hover:bg-[#ebe5da] dark:hover:bg-[#3b2321]'
                    : 'text-[#6b665e] dark:text-[#b9afa3] hover:text-[#24211e] dark:hover:text-[#f5f2ec] hover:bg-[#ebe5da] dark:hover:bg-[#342d27]'
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
                className="p-1.5 text-[#8a4d43] dark:text-[#efb2a8] hover:text-red-800 dark:hover:text-[#ffe6e1] hover:bg-[#fbeeed] dark:hover:bg-[#3b2321] border border-transparent hover:border-[#d9a8a0] dark:hover:border-[#9b5a50] transition-colors rounded-none"
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
          isImportant ? 'text-[#6b665e] dark:text-[#f0d5d0]' : 'text-[#6b665e] dark:text-[#d8cfc3]'
        }`}
      >
        {notice.body}
      </p>

      <div
        className={`pt-3 border-t flex items-center justify-between text-xs ${
          isImportant
            ? 'border-[#d9a8a0]/60 dark:border-[#8f5148]/60 text-[#6b665e] dark:text-[#d7aaa2]'
            : 'border-[#d8cdbc]/60 dark:border-[rgba(245,242,236,0.12)] text-[#6b665e] dark:text-[#b9afa3]'
        }`}
      >
        <span className="inline-flex items-center">
          <Calendar className="w-3.5 h-3.5 mr-1 text-[#8F8778] dark:text-[#b9afa3]" />
          Posted on {formattedDate}
        </span>
        {notice.author_name && (
          <span
            className={`inline-flex items-center font-medium ${
              isImportant ? 'text-[#24211e] dark:text-[#fff1ee]' : 'text-[#24211e] dark:text-[#f5f2ec]'
            }`}
          >
            <User className="w-3.5 h-3.5 mr-1 text-[#8F8778] dark:text-[#b9afa3]" />
            {notice.author_name}
          </span>
        )}
      </div>
    </div>
  );
}

