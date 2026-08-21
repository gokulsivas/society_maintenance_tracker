import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function StatusBadge({ status, isOverdue = false, showOverdue = true }) {
  const statusConfig = {
    OPEN: {
      label: 'Open',
      icon: Clock,
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      icon: AlertTriangle,
      className: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    RESOLVED: {
      label: 'Resolved',
      icon: CheckCircle2,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  };

  const config = statusConfig[status] || {
    label: status,
    icon: Clock,
    className: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.className}`}
      >
        <Icon className="w-3.5 h-3.5 mr-1" />
        {config.label}
      </span>
      {showOverdue && isOverdue && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
          <AlertOctagon className="w-3 h-3 mr-1 text-rose-600" />
          OVERDUE
        </span>
      )}
    </div>
  );
}
