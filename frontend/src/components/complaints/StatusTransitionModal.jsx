import React, { useState } from 'react';
import { updateComplaintStatus } from '../../api/complaints';
import { getErrorMessage } from '../../api/client';
import ErrorAlert from '../common/ErrorAlert';
import StatusBadge from '../common/StatusBadge';
import { X, CheckCircle, Loader2 } from 'lucide-react';

export default function StatusTransitionModal({ complaint, isOpen, onClose, onSuccess }) {
  const [targetStatus, setTargetStatus] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !complaint) return null;

  const currentStatus = complaint.status;

  // Determine allowed targets
  const allowedTargets = [];
  if (currentStatus === 'OPEN') {
    allowedTargets.push({ value: 'IN_PROGRESS', label: 'In Progress' });
    allowedTargets.push({ value: 'RESOLVED', label: 'Resolved' });
  } else if (currentStatus === 'IN_PROGRESS') {
    allowedTargets.push({ value: 'RESOLVED', label: 'Resolved' });
  }

  const isResolved = currentStatus === 'RESOLVED';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetStatus) {
      setError('Please select a target status.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const updated = await updateComplaintStatus(complaint.id, targetStatus, note);
      onSuccess(updated);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update complaint status.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#faf8f3] border border-[#d8cdbc] max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-[#d8cdbc] mb-5">
          <h3 className="font-serif text-xl font-normal text-[#24211e]">Update Complaint Status</h3>
          <button
            onClick={onClose}
            className="text-[#6b665e] hover:text-[#24211e] p-1 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError(null)} />

        <div className="mb-5 bg-[#FAF8F5] p-3.5 border border-[#d8cdbc] flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
          <span className="text-[#5f4b3b]">Current Status:</span>
          <StatusBadge status={currentStatus} isOverdue={complaint.is_overdue} />
        </div>

        {isResolved ? (
          <div className="p-4 bg-[#eef2eb] border border-[#b8c9af] text-[#52634a] text-sm mb-4 flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-[#52634a] flex-shrink-0 mt-0.5" />
            <p>This complaint is marked <strong>RESOLVED</strong>. Resolved complaints are terminal and cannot be reopened.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="target-status" className="block text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] mb-1.5">
                New Status <span className="text-[#8a4d43]">*</span>
              </label>
              <select
                id="target-status"
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#d8cdbc] text-[#24211e] text-sm p-2.5 focus:border-[#5f4b3b] focus:outline-none"
                required
              >
                <option value="">Select target status...</option>
                {allowedTargets.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status-note" className="block text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] mb-1.5">
                Admin Note <span className="text-[#8F8778] font-normal text-[11px]">(Optional, emailed to resident)</span>
              </label>
              <textarea
                id="status-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Technician dispatched, inspection scheduled for 2 PM..."
                className="w-full bg-[#FAF8F5] border border-[#d8cdbc] text-[#24211e] placeholder-[#a8a196] text-sm p-2.5 focus:border-[#5f4b3b] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#d8cdbc]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#6b665e] bg-[#ebe5da] hover:bg-[#d8cdbc] border border-[#d8cdbc] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !targetStatus}
                className="inline-flex items-center px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] bg-[#24211e] hover:bg-[#3f3025] disabled:opacity-50 border border-[#24211e] shadow-sm transition-colors"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                Update Status
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
