import React from 'react';

export default function PriorityBadge({ priority }) {
  const priorityConfig = {
    LOW: {
      label: 'Low',
      className: 'bg-[#faf8f3] dark:bg-[#2b2723] text-[#6b665e] dark:text-[#c8bfb3] border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)]',
    },
    MEDIUM: {
      label: 'Medium',
      className: 'bg-[#ebe5da] dark:bg-[#342d27] text-[#8a6843] dark:text-[#e0a96d] border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)]',
    },
    HIGH: {
      label: 'High',
      className: 'bg-[#fbeeed] dark:bg-[#4a2927] text-[#8a4d43] dark:text-[#ffe6e1] border-[#d9a8a0] dark:border-[#9b5a50] font-bold',
    },
  };

  const config = priorityConfig[priority] || {
    label: priority,
    className: 'bg-[#faf8f3] dark:bg-[#2b2723] text-[#6b665e] dark:text-[#c8bfb3] border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)]',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-none whitespace-nowrap border ${config.className}`}
    >
      {config.label}
    </span>
  );
}

