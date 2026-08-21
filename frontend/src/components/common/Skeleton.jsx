import React from 'react';

export function MetricCardSkeleton({ count = 3 }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-${count} gap-4 sm:gap-6`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-[#faf8f3] dark:bg-[#24211e] p-5 border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] shadow-sm flex items-center space-x-4 animate-pulse rounded-none"
        >
          <div className="w-12 h-12 bg-[#ebe5da] dark:bg-[#342d27] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-3 bg-[#ebe5da] dark:bg-[#342d27] w-1/2" />
            <div className="h-7 bg-[#d8cdbc] dark:bg-[#433931] w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ComplaintCardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-[#faf8f3] dark:bg-[#24211e] p-5 border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] shadow-sm space-y-3 animate-pulse rounded-none"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 bg-[#ebe5da] dark:bg-[#342d27] w-1/4" />
            <div className="h-4 bg-[#ebe5da] dark:bg-[#342d27] w-1/4" />
          </div>
          <div className="h-5 bg-[#d8cdbc] dark:bg-[#433931] w-3/4" />
          <div className="h-3 bg-[#ebe5da] dark:bg-[#342d27] w-full" />
          <div className="h-3 bg-[#ebe5da] dark:bg-[#342d27] w-2/3" />
          <div className="pt-2 border-t border-[#ebe5da] dark:border-[rgba(245,242,236,0.12)] flex justify-between">
            <div className="h-3 bg-[#ebe5da] dark:bg-[#342d27] w-1/3" />
            <div className="h-3 bg-[#ebe5da] dark:bg-[#342d27] w-1/4" />
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
          className="bg-[#faf8f3] dark:bg-[#24211e] p-6 border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] shadow-sm space-y-3 animate-pulse rounded-none"
        >
          <div className="flex items-center justify-between">
            <div className="h-5 bg-[#d8cdbc] dark:bg-[#433931] w-1/3" />
            <div className="h-4 bg-[#ebe5da] dark:bg-[#342d27] w-1/6" />
          </div>
          <div className="h-3 bg-[#ebe5da] dark:bg-[#342d27] w-full" />
          <div className="h-3 bg-[#ebe5da] dark:bg-[#342d27] w-4/5" />
          <div className="pt-2 flex items-center justify-between text-xs text-[#6b665e] dark:text-[#b9afa3]">
            <div className="h-3 bg-[#ebe5da] dark:bg-[#342d27] w-1/4" />
            <div className="h-3 bg-[#ebe5da] dark:bg-[#342d27] w-1/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableRowSkeleton({ rows = 5, cols = 6 }) {
  return (
    <tbody className="divide-y divide-[#d8cdbc] dark:divide-[rgba(245,242,236,0.16)] bg-[#faf8f3] dark:bg-[#24211e]">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="animate-pulse">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="px-6 py-4">
              <div className="h-4 bg-[#ebe5da] dark:bg-[#342d27] w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

