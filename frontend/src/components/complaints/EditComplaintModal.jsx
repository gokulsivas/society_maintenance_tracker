import React, { useState, useEffect } from 'react';
import { updateComplaint } from '../../api/complaints';
import { getErrorMessage } from '../../api/client';
import PhotoUploadInput from './PhotoUploadInput';
import ErrorAlert from '../common/ErrorAlert';
import { X, Loader2, Save, Edit3 } from 'lucide-react';

export default function EditComplaintModal({ complaint, isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'PLUMBING',
    description: '',
    photo_url: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Reset form when modal opens or complaint changes
  useEffect(() => {
    if (complaint && isOpen) {
      setFormData({
        title: complaint.title || '',
        category: complaint.category || 'PLUMBING',
        description: complaint.description || '',
        photo_url: complaint.photo_url || '',
      });
      setError(null);
      setUploadError(null);
      setLoading(false);
    }
  }, [complaint, isOpen]);

  if (!isOpen || !complaint) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClose = () => {
    setError(null);
    setUploadError(null);
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please provide both a title and description.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        photo_url: formData.photo_url.trim() || null,
      };

      const updated = await updateComplaint(complaint.id, payload);
      onSuccess(updated);
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update complaint. Please check your inputs.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-complaint-title"
    >
      <div className="bg-[#faf8f3] border border-[#d8cdbc] max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#d8cdbc] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#ebe5da] text-[#5f4b3b] border border-[#d8cdbc]">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 id="edit-complaint-title" className="font-serif text-lg font-normal text-[#24211e]">
                Edit Complaint #{complaint.id}
              </h3>
              <p className="text-xs text-[#6b665e]">Update your open complaint details.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-[#6b665e] hover:text-[#24211e] p-1.5 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
          <ErrorAlert message={uploadError} onDismiss={() => setUploadError(null)} />

          <div>
            <label htmlFor="edit-title" className="block text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] mb-1.5">
              Issue Title <span className="text-[#8a4d43]">*</span>
            </label>
            <input
              id="edit-title"
              name="title"
              type="text"
              required
              minLength={2}
              maxLength={255}
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Master bathroom sink drain clogged"
              className="block w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#d8cdbc] text-[#24211e] placeholder-[#a8a196] focus:border-[#5f4b3b] focus:outline-none text-sm"
            />
          </div>

          <div>
            <label htmlFor="edit-category" className="block text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] mb-1.5">
              Category <span className="text-[#8a4d43]">*</span>
            </label>
            <select
              id="edit-category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="block w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#d8cdbc] text-[#24211e] focus:border-[#5f4b3b] focus:outline-none text-sm"
            >
              <option value="PLUMBING">Plumbing (Water leaks, drainage, pipes)</option>
              <option value="ELECTRICAL">Electrical (Switches, wiring, power, lighting)</option>
              <option value="CARPENTRY">Carpentry (Doors, windows, locks, woodwork)</option>
              <option value="CLEANLINESS">Cleanliness (Garbage, corridors, pest control)</option>
              <option value="SECURITY">Security (Gates, intercom, CCTV, guards)</option>
              <option value="OTHER">Other Miscellaneous Request</option>
            </select>
          </div>

          <div>
            <label htmlFor="edit-description" className="block text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] mb-1.5">
              Detailed Description <span className="text-[#8a4d43]">*</span>
            </label>
            <textarea
              id="edit-description"
              name="description"
              rows={4}
              required
              minLength={5}
              value={formData.description}
              onChange={handleChange}
              placeholder="Please describe the issue in detail..."
              className="block w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#d8cdbc] text-[#24211e] placeholder-[#a8a196] focus:border-[#5f4b3b] focus:outline-none text-sm"
            />
          </div>

          {/* Photo Upload Input */}
          <PhotoUploadInput
            value={formData.photo_url}
            onChange={(url) => setFormData((prev) => ({ ...prev, photo_url: url }))}
            onError={setUploadError}
          />

          {/* Actions */}
          <div className="pt-4 border-t border-[#d8cdbc] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#6b665e] bg-[#ebe5da] hover:bg-[#d8cdbc] border border-[#d8cdbc] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.description.trim()}
              className="inline-flex items-center px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] bg-[#24211e] hover:bg-[#3f3025] disabled:opacity-50 border border-[#24211e] shadow-sm transition-all"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1.5" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
