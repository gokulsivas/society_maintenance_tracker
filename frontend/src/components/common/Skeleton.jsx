import React from 'react';

export function MetricCardSkeleton({ count = 3 }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-${count} gap-4 sm:gap-6`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center space-x-4 animate-pulse"
        >
          <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-7 bg-gray-300 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ComplaintCardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
          <div className="h-5 bg-gray-300 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
          <div className="pt-2 border-t border-gray-100 flex justify-between">
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NoticeCardSkeleton({ count = 2 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-5 bg-gray-300 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/6" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-4/5" />
          <div className="pt-2 flex items-center justify-between text-xs text-gray-400">
            <div className="h-3 bg-gray-200 rounded w-1/4" />
            <div className="h-3 bg-gray-200 rounded w-1/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableRowSkeleton({ rows = 5, cols = 6 }) {
  return (
    <tbody className="divide-y divide-gray-200 bg-white">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="animate-pulse">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="px-6 py-4">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
