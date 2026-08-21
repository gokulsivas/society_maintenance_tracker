import React from 'react';
import { Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  title = 'No items found',
  description = 'There are no records to display at this moment.',
  actionText = null,
  actionLink = null,
  onAction = null,
  icon: Icon = Inbox,
}) {
  return (
    <div className="text-center py-12 px-6 border border-dashed border-[#d8cdbc] bg-[#faf8f3] shadow-sm">
      <div className="mx-auto w-12 h-12 bg-[#ebe5da] border border-[#d8cdbc] flex items-center justify-center text-[#5f4b3b] mb-4">
        <Icon className="h-6 w-6 text-[#5f4b3b]" />
      </div>
      <h3 className="font-serif text-lg text-[#24211e] font-normal">{title}</h3>
      <p className="mt-1 text-sm text-[#6b665e] max-w-sm mx-auto leading-relaxed">{description}</p>
      {actionText && (actionLink || onAction) && (
        <div className="mt-6">
          {actionLink ? (
            <Link
              to={actionLink}
              className="inline-flex items-center px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#24211e] hover:bg-[#3f3025] text-[#FAF8F5] border border-[#24211e] transition-colors"
            >
              {actionText}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#24211e] hover:bg-[#3f3025] text-[#FAF8F5] border border-[#24211e] transition-colors"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
