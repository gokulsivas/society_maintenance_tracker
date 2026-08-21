import React from 'react';

export default function PriorityBadge({ priority }) {
  const priorityConfig = {
    LOW: {
      label: 'Low',
      className: 'bg-[#faf8f3] text-[#6b665e] border-[#d8cdbc]',
    },
    MEDIUM: {
      label: 'Medium',
      className: 'bg-[#f3eadb] text-[#73532c] border-[#b18a55]',
    },
    HIGH: {
      label: 'High',
      className: 'bg-[#f8e9e7] text-[#7e443d] border-[#bd8178] font-bold',
    },
  };

  const config = priorityConfig[priority] || {
    label: priority,
    className: 'bg-[#faf8f3] text-[#6b665e] border-[#d8cdbc]',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-none whitespace-nowrap border ${config.className}`}
    >
      {config.label}
    </span>
  );
}
