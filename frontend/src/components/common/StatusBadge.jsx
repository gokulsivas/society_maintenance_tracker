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
      className: 'bg-[#eaf2e8] text-[#3e5d3b] border-[#78956f]',
    },
  };

  const config = statusConfig[status] || {
    label: status,
    icon: Clock,
    className: 'bg-[#faf8f3] text-[#6b665e] border-[#d8cdbc]',
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
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded-none whitespace-nowrap bg-[#f8e9e7] text-[#7e443d] border border-[#bd8178]">
          <AlertOctagon className="w-3 h-3 mr-1 flex-shrink-0 text-[#7e443d]" />
          Overdue
        </span>
      )}
    </div>
  );
}
