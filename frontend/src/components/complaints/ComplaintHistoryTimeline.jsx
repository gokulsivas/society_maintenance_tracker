import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { ArrowRight, Clock, MessageSquare } from 'lucide-react';

export default function ComplaintHistoryTimeline({ history = [] }) {
  if (!history || history.length === 0) {
    return <p className="text-sm text-gray-500 italic">No history records available.</p>;
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {history.map((event, idx) => {
          const isLast = idx === history.length - 1;
          const formattedTime = new Date(event.changed_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });

          return (
            <li key={event.id || idx}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start space-x-3">
                  {/* Indicator Dot */}
                  <div className="h-8 w-8 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center ring-4 ring-white">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>

                  <div className="min-w-0 flex-1 bg-gray-50/70 border border-gray-100 rounded-lg p-3.5">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
                      <div className="flex items-center space-x-2 text-sm font-semibold text-gray-900">
                        {event.from_status ? (
                          <>
                            <StatusBadge status={event.from_status} showOverdue={false} />
                            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                            <StatusBadge status={event.to_status} showOverdue={false} />
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-gray-500 font-normal">Initial State:</span>
                            <StatusBadge status={event.to_status} showOverdue={false} />
                          </>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{formattedTime}</span>
                    </div>

                    {event.note && (
                      <div className="mt-2 text-sm text-gray-700 bg-white p-2.5 rounded border border-gray-200 flex items-start space-x-2">
                        <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="whitespace-pre-line text-xs sm:text-sm">{event.note}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
