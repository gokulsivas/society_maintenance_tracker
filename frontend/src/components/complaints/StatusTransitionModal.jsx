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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <h3 className="text-lg font-bold text-gray-900">Update Complaint Status</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError(null)} />

        <div className="mb-4 bg-gray-50 p-3 rounded-lg flex items-center justify-between text-sm">
          <span className="text-gray-600">Current Status:</span>
          <StatusBadge status={currentStatus} isOverdue={complaint.is_overdue} />
        </div>

        {isResolved ? (
          <div className="p-4 bg-emerald-50 rounded-xl text-emerald-800 text-sm mb-4 flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p>This complaint is marked <strong>RESOLVED</strong>. Resolved complaints are terminal and cannot be reopened.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="target-status" className="block text-sm font-semibold text-gray-700 mb-1">
                New Status <span className="text-red-500">*</span>
              </label>
              <select
                id="target-status"
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
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
              <label htmlFor="status-note" className="block text-sm font-semibold text-gray-700 mb-1">
                Admin Note <span className="text-gray-400 font-normal">(Optional, will be emailed to resident)</span>
              </label>
              <textarea
                id="status-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Technician dispatched, inspection scheduled for 2 PM..."
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !targetStatus}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Status
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
