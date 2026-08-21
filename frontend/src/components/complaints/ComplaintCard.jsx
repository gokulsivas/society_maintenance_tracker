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
    <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={complaint.status} isOverdue={complaint.is_overdue} />
            <PriorityBadge priority={complaint.priority} />
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">
              {complaint.category}
            </span>
          </div>
          <span className="text-xs font-mono text-gray-400">#{complaint.id}</span>
        </div>

        <h4 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-1">{complaint.title}</h4>
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{complaint.description}</p>
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
            {formattedDate}
          </span>
          {showResident && complaint.resident_name && (
            <span className="inline-flex items-center font-medium text-gray-700">
              <User className="w-3.5 h-3.5 mr-1 text-gray-400" />
              {complaint.resident_name} ({complaint.resident_flat_no || 'N/A'})
            </span>
          )}
          {complaint.photo_url && (
            <span className="inline-flex items-center text-blue-600 font-medium" title="Has attached photo">
              <ImageIcon className="w-3.5 h-3.5 mr-0.5" />
              Photo
            </span>
          )}
        </div>

        <Link
          to={`/complaints/${complaint.id}`}
          className="inline-flex items-center font-semibold text-blue-600 hover:text-blue-800"
        >
          View
          <ChevronRight className="w-4 h-4 ml-0.5" />
        </Link>
      </div>
    </div>
  );
}
