import React from 'react';

export default function PriorityBadge({ priority }) {
  const priorityConfig = {
    LOW: {
      label: 'Low',
      className: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    MEDIUM: {
      label: 'Medium',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    HIGH: {
      label: 'High',
      className: 'bg-red-50 text-red-700 border-red-200 font-bold',
    },
  };

  const config = priorityConfig[priority] || {
    label: priority,
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
}
