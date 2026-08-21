import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getComplaint, updateComplaintPriority } from '../api/complaints';
import { getErrorMessage, isRequestCanceled } from '../api/client';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import ComplaintHistoryTimeline from '../components/complaints/ComplaintHistoryTimeline';
import StatusTransitionModal from '../components/complaints/StatusTransitionModal';
import EditComplaintModal from '../components/complaints/EditComplaintModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import {
  ArrowLeft,
  Calendar,
  User,
  Home,
  AlertOctagon,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Shield,
  Clock,
  Pencil,
} from 'lucide-react';

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchComplaint() {
      try {
        setLoading(true);
        setError(null);
        const data = await getComplaint(id, { signal: controller.signal });
        setComplaint(data);
      } catch (err) {
        if (isRequestCanceled(err)) return;
        setError(getErrorMessage(err, 'Failed to load complaint details.'));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchComplaint();

    return () => {
      controller.abort();
    };
  }, [id]);

  const handlePriorityChange = async (newPriority) => {
    if (!isAdmin || !complaint) return;
    setUpdatingPriority(true);
    try {
      const updated = await updateComplaintPriority(complaint.id, newPriority);
      setComplaint((prev) => ({ ...prev, priority: updated.priority }));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update priority.'));
    } finally {
      setUpdatingPriority(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading complaint details..." size="large" />;
  }

  if (error || !complaint) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <ErrorAlert message={error || 'Complaint not found.'} />
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Go Back
        </button>
      </div>
    );
  }

  const isOwner = user && user.id === complaint.resident_id;
  const canEdit = !isAdmin && isOwner && complaint.status === 'OPEN';

  const createdDate = new Date(complaint.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const resolvedDate = complaint.resolved_at
    ? new Date(complaint.resolved_at).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className="editorial-page-surface min-h-[calc(100vh-5rem)] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d8cdbc] pb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(isAdmin ? '/admin/complaints' : '/complaints')}
              className="p-2.5 text-[#24211e] hover:bg-[#ebe5da] bg-[#faf8f3] border border-[#d8cdbc] shadow-sm transition-colors"
              aria-label="Back to complaints list"
            >
              <ArrowLeft className="w-4 h-4 text-[#5f4b3b]" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-[#8F8778]">Ticket #{complaint.id}</span>
                <span className="text-[11px] px-2 py-0.5 bg-[#ebe5da] text-[#5f4b3b] border border-[#d8cdbc] font-semibold uppercase tracking-wider">
                  {complaint.category}
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#24211e] tracking-tight mt-0.5">
                {complaint.title}
              </h1>
            </div>
          </div>

          {/* Status Actions */}
          <div className="complaint-header-actions flex items-center gap-5 flex-wrap">
            <StatusBadge status={complaint.status} isOverdue={complaint.is_overdue} />

            {/* Resident Owner Edit Button (Only for OPEN complaints) */}
            {canEdit && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#24211e] bg-[#ebe5da] hover:bg-[#d8cdbc] border border-[#d8cdbc] shadow-sm transition-all"
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5 text-[#5f4b3b]" />
                Edit Complaint
              </button>
            )}

            {/* Admin Status Update Button */}
            {isAdmin && complaint.status !== 'RESOLVED' && (
              <button
                onClick={() => setIsStatusModalOpen(true)}
                className="inline-flex items-center px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] bg-[#24211e] hover:bg-[#3f3025] border border-[#24211e] shadow-sm transition-all"
              >
                <Edit3 className="w-4 h-4 mr-1.5" />
                Update Status
              </button>
            )}
          </div>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError(null)} />

        {/* Overdue Alert Banner */}
        {complaint.is_overdue && complaint.status !== 'RESOLVED' && (
          <div className="p-4 bg-[#fbeeed] dark:bg-[#4a2927] border border-[#d9a8a0] dark:border-[#9b5a50] text-[#8a4d43] dark:text-[#ffe6e1] flex items-start space-x-3 shadow-sm rounded-none">
            <AlertOctagon className="w-5 h-5 text-[#8a4d43] dark:text-[#efb2a8] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">This complaint is OVERDUE</h4>
              <p className="text-xs text-[#8a4d43] dark:text-[#f1c4bd] mt-0.5">
                It has exceeded the society's configured resolution threshold without being resolved.
              </p>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Complaint Details & Photo */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#faf8f3] dark:bg-[#24211e] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] p-6 shadow-sm space-y-4 rounded-none">
              <h3 className="font-serif text-lg text-[#24211e] dark:text-[#f5f2ec] font-normal border-b border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] pb-3">
                Description
              </h3>
              <p className="text-sm text-[#6b665e] dark:text-[#c8bfb3] whitespace-pre-line leading-relaxed">
                {complaint.description}
              </p>

              {/* Attached Photo */}
              {complaint.photo_url && (
                <div className="pt-4 border-t border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] space-y-2">
                  <h4 className="text-xs font-bold text-[#5f4b3b] dark:text-[#d8cdbc] uppercase tracking-wider">
                    Attached Image
                  </h4>
                  <div className="relative inline-block border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] bg-[#FAF8F5] dark:bg-[#2b2723] p-2 shadow-sm max-w-full rounded-none">
                    <img
                      src={complaint.photo_url}
                      alt="Attached complaint photo"
                      className="max-h-96 w-auto object-contain border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)]"
                    />
                    <a
                      href={complaint.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-4 right-4 inline-flex items-center px-3 py-1.5 bg-[#24211e]/85 hover:bg-[#24211e] text-[#FAF8F5] text-xs font-medium uppercase tracking-wider rounded-none"
                    >
                      Open Full <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Complete Status History Timeline */}
            <div className="bg-[#faf8f3] dark:bg-[#24211e] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] p-6 shadow-sm space-y-4 rounded-none">
              <h3 className="font-serif text-lg text-[#24211e] dark:text-[#f5f2ec] font-normal border-b border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] pb-3 flex items-center justify-between">
                <span>Status History & Notes</span>
                <span className="text-xs text-[#8F8778] dark:text-[#a89e91] font-normal font-sans">
                  {complaint.status_history?.length || 0} events
                </span>
              </h3>
              <ComplaintHistoryTimeline history={complaint.status_history} />
            </div>
          </div>

          {/* Right Column: Metadata & Admin Controls */}
          <div className="space-y-6">
            {/* Metadata Card */}
            <div className="bg-[#faf8f3] dark:bg-[#24211e] border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] p-6 shadow-sm space-y-4 rounded-none">
              <h3 className="text-xs font-bold text-[#5f4b3b] dark:text-[#d8cdbc] uppercase tracking-wider border-b border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] pb-2">
                Ticket Details
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#6b665e] dark:text-[#c8bfb3] flex items-center text-xs">
                    <User className="w-3.5 h-3.5 mr-1.5 text-[#8F8778] dark:text-[#a89e91]" /> Resident:
                  </span>
                  <span className="font-semibold text-[#24211e] dark:text-[#f5f2ec] text-xs">
                    {complaint.resident_name || `Resident #${complaint.resident_id}`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#6b665e] dark:text-[#c8bfb3] flex items-center text-xs">
                    <Home className="w-3.5 h-3.5 mr-1.5 text-[#8F8778] dark:text-[#a89e91]" /> Flat Number:
                  </span>
                  <span className="font-semibold text-[#24211e] dark:text-[#f5f2ec] text-xs">
                    {complaint.resident_flat_no || 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#6b665e] dark:text-[#c8bfb3] flex items-center text-xs">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-[#8F8778] dark:text-[#a89e91]" /> Raised At:
                  </span>
                  <span className="text-xs text-[#6b665e] dark:text-[#c8bfb3]">{createdDate}</span>
                </div>

                {resolvedDate && (
                  <div className="flex items-center justify-between pt-2 border-t border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)]">
                    <span className="text-[#52634a] dark:text-[#a3c99b] flex items-center text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Resolved At:
                    </span>
                    <span className="text-xs text-[#6b665e] dark:text-[#c8bfb3]">{resolvedDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Priority Controls */}
            {isAdmin && (
              <div className="bg-[#24211e] dark:bg-[#201c19] architectural-grid-dark text-[#FAF8F5] p-6 border border-[#5f4b3b]/40 dark:border-[rgba(245,242,236,0.16)] shadow-sm space-y-4 rounded-none">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-[#FAF8F5]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#FAF8F5]">
                    Admin Controls
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#C4BDAF] mb-2">
                    Priority Level:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['LOW', 'MEDIUM', 'HIGH'].map((prio) => (
                      <button
                        key={prio}
                        type="button"
                        disabled={updatingPriority || complaint.priority === prio}
                        onClick={() => handlePriorityChange(prio)}
                        className={`py-2 px-2 text-xs font-semibold uppercase tracking-wider border transition-all rounded-none ${
                          complaint.priority === prio
                            ? 'bg-[#FAF8F5] text-[#24211e] border-[#FAF8F5]'
                            : 'bg-transparent text-[#FAF8F5] border-white/20 hover:bg-white/10'
                        } disabled:opacity-50`}
                      >
                        {prio}
                      </button>
                    ))}
                  </div>
                </div>

                {complaint.status !== 'RESOLVED' && (
                  <button
                    type="button"
                    onClick={() => setIsStatusModalOpen(true)}
                    className="w-full mt-2 py-3 px-4 bg-[#FAF8F5] hover:bg-[#ebe5da] text-[#24211e] font-semibold text-xs uppercase tracking-wider border border-[#FAF8F5] transition-colors shadow-sm rounded-none"
                  >
                    Change Status / Add Note
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Admin Status Transition Modal */}
        <StatusTransitionModal
          complaint={complaint}
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          onSuccess={(updated) => {
            setComplaint(updated);
          }}
        />

        {/* Resident Edit Complaint Modal */}
        <EditComplaintModal
          complaint={complaint}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={(updated) => {
            setComplaint((prev) => ({
              ...prev,
              title: updated.title,
              category: updated.category,
              description: updated.description,
              photo_url: updated.photo_url,
              updated_at: updated.updated_at,
            }));
          }}
        />
      </div>
    </div>
  );
}
