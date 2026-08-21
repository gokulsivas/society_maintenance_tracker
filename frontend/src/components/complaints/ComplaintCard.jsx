import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';
import { Calendar, User, Image as ImageIcon, ChevronRight } from 'lucide-react';

export default function ComplaintCard({ complaint, showResident = false }) {
  const formattedDate = new Date(complaint.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-[#faf8f3] dark:bg-[#24211e] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] hover:border-[#5f4b3b]/60 dark:hover:border-[#d8cdbc]/40 transition-all p-5 sm:p-6 flex flex-col justify-between shadow-sm rounded-none">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={complaint.status} isOverdue={complaint.is_overdue} />
            <PriorityBadge priority={complaint.priority} />
            <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-[#ebe5da] dark:bg-[#342d27] text-[#5f4b3b] dark:text-[#d8cdbc] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] rounded-none whitespace-nowrap">
              {complaint.category}
            </span>
          </div>
          <span className="text-xs font-mono text-[#8F8778] dark:text-[#a89e91]">#{complaint.id}</span>
        </div>

        <h4 className="font-serif text-lg font-normal text-[#24211e] dark:text-[#f5f2ec] mb-1.5 line-clamp-1">
          {complaint.title}
        </h4>
        <p className="text-sm text-[#6b665e] dark:text-[#c8bfb3] line-clamp-2 mb-4 leading-relaxed">
          {complaint.description}
        </p>
      </div>

      <div className="pt-3 border-t border-[#d8cdbc]/60 dark:border-[rgba(245,242,236,0.12)] flex items-center justify-between text-xs text-[#6b665e] dark:text-[#b9afa3]">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1 text-[#8F8778] dark:text-[#a89e91]" />
            {formattedDate}
          </span>
          {showResident && complaint.resident_name && (
            <span className="inline-flex items-center font-medium text-[#24211e] dark:text-[#f5f2ec]">
              <User className="w-3.5 h-3.5 mr-1 text-[#8F8778] dark:text-[#a89e91]" />
              {complaint.resident_name} ({complaint.resident_flat_no || 'N/A'})
            </span>
          )}
          {complaint.photo_url && (
            <span className="inline-flex items-center text-[#5f4b3b] dark:text-[#d8cdbc] font-medium" title="Has attached photo">
              <ImageIcon className="w-3.5 h-3.5 mr-0.5" />
              Photo
            </span>
          )}
        </div>

        <Link
          to={`/complaints/${complaint.id}`}
          className="inline-flex items-center font-semibold uppercase tracking-wider text-xs text-[#5f4b3b] dark:text-[#d8cdbc] hover:text-[#24211e] dark:hover:text-[#f5f2ec]"
        >
          View
          <ChevronRight className="w-4 h-4 ml-0.5" />
        </Link>
      </div>
    </div>
  );
}

