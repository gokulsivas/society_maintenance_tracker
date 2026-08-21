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
    <div className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50">
      <Icon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">{description}</p>
      {(actionText && (actionLink || onAction)) && (
        <div className="mt-5">
          {actionLink ? (
            <Link
              to={actionLink}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {actionText}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
