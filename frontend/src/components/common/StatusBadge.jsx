import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function StatusBadge({ status, isOverdue = false, showOverdue = true }) {
  const statusConfig = {
    OPEN: {
      label: 'Open',
      icon: Clock,
      className: 'bg-[#faf8f3] dark:bg-[#2b2723] text-[#8a6843] dark:text-[#d8cdbc] border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)]',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      icon: AlertTriangle,
      className: 'bg-[#ebe5da] dark:bg-[#342d27] text-[#5f4b3b] dark:text-[#e0a96d] border-[#5f4b3b]/30 dark:border-[#8a6843]/40',
    },
    RESOLVED: {
      label: 'Resolved',
      icon: CheckCircle2,
      className: 'bg-[#eef2eb] dark:bg-[#223023] text-[#52634a] dark:text-[#a3c99b] border-[#b8c9af] dark:border-[#4d6b49]',
    },
  };

  const config = statusConfig[status] || {
    label: status,
    icon: Clock,
    className: 'bg-[#faf8f3] dark:bg-[#2b2723] text-[#6b665e] dark:text-[#c8bfb3] border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)]',
  };

  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
      <span
        className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-none whitespace-nowrap border ${config.className}`}
      >
        <Icon className="w-3 h-3 mr-1 flex-shrink-0" />
        {config.label}
      </span>
      {showOverdue && isOverdue && (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded-none whitespace-nowrap bg-[#fbeeed] dark:bg-[#4a2927] text-[#8a4d43] dark:text-[#ffe6e1] border border-[#d9a8a0] dark:border-[#9b5a50]">
          <AlertOctagon className="w-3 h-3 mr-1 flex-shrink-0 text-[#8a4d43] dark:text-[#efb2a8]" />
          Overdue
        </span>
      )}
    </div>
  );
}

