import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { ArrowRight, Clock, MessageSquare } from 'lucide-react';

export default function ComplaintHistoryTimeline({ history = [] }) {
  if (!history || history.length === 0) {
    return <p className="text-sm text-[#6b665e] italic">No history records available.</p>;
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
                    className="absolute top-4 left-4 -ml-px h-full w-[1px] bg-[#d8cdbc]"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start space-x-3">
                  {/* Indicator Dot */}
                  <div className="h-8 w-8 bg-[#ebe5da] border border-[#5f4b3b] flex items-center justify-center text-[#5f4b3b]">
                    <Clock className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1 bg-[#FAF8F5] border border-[#d8cdbc] p-4 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <div className="flex items-center space-x-2 text-xs font-semibold text-[#24211e]">
                        {event.from_status ? (
                          <>
                            <StatusBadge status={event.from_status} showOverdue={false} />
                            <ArrowRight className="w-3.5 h-3.5 text-[#8F8778]" />
                            <StatusBadge status={event.to_status} showOverdue={false} />
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-[#6b665e] font-normal">Initial State:</span>
                            <StatusBadge status={event.to_status} showOverdue={false} />
                          </>
                        )}
                      </div>
                      <span className="text-xs text-[#8F8778]">{formattedTime}</span>
                    </div>

                    {event.note && (
                      <div className="mt-2 text-xs text-[#5C5955] bg-[#ebe5da]/70 p-3 border border-[#d8cdbc] flex items-start space-x-2">
                        <MessageSquare className="w-4 h-4 text-[#5f4b3b] mt-0.5 flex-shrink-0" />
                        <p className="whitespace-pre-line leading-relaxed">{event.note}</p>
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
