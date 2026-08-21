import React from 'react';

export default function PriorityBadge({ priority }) {
  const priorityConfig = {
    LOW: {
      label: 'Low',
      className: 'bg-[#faf8f3] text-[#6b665e] border-[#d8cdbc]',
    },
    MEDIUM: {
      label: 'Medium',
      className: 'bg-[#ebe5da] text-[#8a6843] border-[#d8cdbc]',
    },
    HIGH: {
      label: 'High',
      className: 'bg-[#fbeeed] text-[#8a4d43] border-[#d9a8a0] font-bold',
    },
  };

  const config = priorityConfig[priority] || {
    label: priority,
    className: 'bg-[#faf8f3] text-[#6b665e] border-[#d8cdbc]',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider border ${config.className}`}
    >
      {config.label}
    </span>
  );
}
