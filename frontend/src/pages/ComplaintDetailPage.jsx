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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(isAdmin ? '/admin/complaints' : '/complaints')}
            className="p-2 text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"
            aria-label="Back to complaints list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-gray-500">Ticket #{complaint.id}</span>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-semibold">
                {complaint.category}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-0.5">
              {complaint.title}
            </h1>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex items-center space-x-3 flex-wrap">
          <StatusBadge status={complaint.status} isOverdue={complaint.is_overdue} />

          {/* Resident Owner Edit Button (Only for OPEN complaints) */}
          {canEdit && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center px-3.5 py-2 text-xs sm:text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl shadow-sm transition-all"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Edit Complaint
            </button>
          )}

          {/* Admin Status Update Button */}
          {isAdmin && complaint.status !== 'RESOLVED' && (
            <button
              onClick={() => setIsStatusModalOpen(true)}
              className="inline-flex items-center px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
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
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-start space-x-3 shadow-sm">
          <AlertOctagon className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">This complaint is OVERDUE</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              It has exceeded the society's configured resolution threshold without being resolved.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Complaint Details & Photo */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              Description
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {complaint.description}
            </p>

            {/* Attached Photo */}
            {complaint.photo_url && (
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Attached Image
                </h4>
                <div className="relative inline-block rounded-xl overflow-hidden border border-gray-200 shadow-sm max-w-full">
                  <img
                    src={complaint.photo_url}
                    alt="Attached complaint photo"
                    className="max-h-96 w-auto object-contain rounded-lg"
                  />
                  <a
                    href={complaint.photo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 inline-flex items-center px-2.5 py-1 rounded bg-black/70 text-white text-xs hover:bg-black"
                  >
                    Open Full <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Complete Status History Timeline */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center justify-between">
              <span>Status History & Notes</span>
              <span className="text-xs text-gray-400 font-normal">
                {complaint.status_history?.length || 0} events
              </span>
            </h3>
            <ComplaintHistoryTimeline history={complaint.status_history} />
          </div>
        </div>

        {/* Right Column: Metadata & Admin Controls */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
              Ticket Details
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center text-xs">
                  <User className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> Resident:
                </span>
                <span className="font-semibold text-gray-900">
                  {complaint.resident_name || `Resident #${complaint.resident_id}`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center text-xs">
                  <Home className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> Flat Number:
                </span>
                <span className="font-semibold text-gray-900">
                  {complaint.resident_flat_no || 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center text-xs">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> Raised At:
                </span>
                <span className="text-xs text-gray-700">{createdDate}</span>
              </div>

              {resolvedDate && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-emerald-600 flex items-center text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Resolved At:
                  </span>
                  <span className="text-xs text-gray-700">{resolvedDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Priority Controls */}
          {isAdmin && (
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-md space-y-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Admin Controls
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-200 mb-2">
                  Priority Level:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['LOW', 'MEDIUM', 'HIGH'].map((prio) => (
                    <button
                      key={prio}
                      type="button"
                      disabled={updatingPriority || complaint.priority === prio}
                      onClick={() => handlePriorityChange(prio)}
                      className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all ${
                        complaint.priority === prio
                          ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-300'
                          : 'bg-blue-900/40 text-blue-200 border-blue-800 hover:bg-blue-800'
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
                  className="w-full mt-2 py-2.5 px-4 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
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
  );
}
