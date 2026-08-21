import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function StatusBadge({ status, isOverdue = false, showOverdue = true }) {
  const statusConfig = {
    OPEN: {
      label: 'Open',
      icon: Clock,
      className: 'bg-[#faf8f3] text-[#8a6843] border-[#d8cdbc]',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      icon: AlertTriangle,
      className: 'bg-[#ebe5da] text-[#5f4b3b] border-[#5f4b3b]/30',
    },
    RESOLVED: {
      label: 'Resolved',
      icon: CheckCircle2,
      className: 'bg-[#eef2eb] text-[#52634a] border-[#b8c9af]',
    },
  };

  const config = statusConfig[status] || {
    label: status,
    icon: Clock,
    className: 'bg-[#faf8f3] text-[#6b665e] border-[#d8cdbc]',
  };

  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      <span
        className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold uppercase tracking-wider border ${config.className}`}
      >
        <Icon className="w-3.5 h-3.5 mr-1.5" />
        {config.label}
      </span>
      {showOverdue && isOverdue && (
        <span className="inline-flex items-center px-2 py-1 text-xs font-bold uppercase tracking-wider bg-[#fbeeed] text-[#8a4d43] border border-[#d9a8a0]">
          <AlertOctagon className="w-3 h-3 mr-1 text-[#8a4d43]" />
          Overdue
        </span>
      )}
    </div>
  );
}
