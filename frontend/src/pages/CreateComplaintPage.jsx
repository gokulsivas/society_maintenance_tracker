import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createComplaint } from '../api/complaints';
import { getErrorMessage } from '../api/client';
import PhotoUploadInput from '../components/complaints/PhotoUploadInput';
import ErrorAlert from '../components/common/ErrorAlert';
import { PlusCircle, ArrowLeft, Loader2 } from 'lucide-react';

export default function CreateComplaintPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: 'PLUMBING',
    description: '',
    photo_url: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please provide both a title and description.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const created = await createComplaint({
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        photo_url: formData.photo_url.trim() || undefined,
      });
      navigate(`/complaints/${created.id}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to raise complaint. Please check your inputs.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editorial-page-surface min-h-[calc(100vh-5rem)] py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center space-x-3 border-b border-[#d8cdbc] pb-4">
          <Link
            to="/complaints"
            className="p-2.5 text-[#24211e] hover:bg-[#ebe5da] bg-[#faf8f3] border border-[#d8cdbc] shadow-sm transition-colors"
            title="Back to complaints"
          >
            <ArrowLeft className="w-4 h-4 text-[#5f4b3b]" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#24211e] tracking-tight">
              Raise a Complaint
            </h1>
            <p className="text-xs text-[#6b665e] mt-0.5">
              Submit a new maintenance or service request to society management.
            </p>
          </div>
        </div>

        <div className="bg-[#faf8f3] border border-[#d8cdbc] p-6 sm:p-10 shadow-sm">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
          <ErrorAlert message={uploadError} onDismiss={() => setUploadError(null)} />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] mb-1.5">
                Issue Title <span className="text-[#8a4d43]">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                minLength={2}
                maxLength={255}
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Master bathroom sink drain clogged"
                className="block w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#d8cdbc] text-[#24211e] placeholder-[#a8a196] focus:border-[#5f4b3b] focus:outline-none text-sm shadow-sm"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] mb-1.5">
                Category <span className="text-[#8a4d43]">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="block w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#d8cdbc] text-[#24211e] focus:border-[#5f4b3b] focus:outline-none text-sm shadow-sm"
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
              <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] mb-1.5">
                Detailed Description <span className="text-[#8a4d43]">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                required
                minLength={5}
                value={formData.description}
                onChange={handleChange}
                placeholder="Please describe the issue in detail, including location and when it began..."
                className="block w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#d8cdbc] text-[#24211e] placeholder-[#a8a196] focus:border-[#5f4b3b] focus:outline-none text-sm shadow-sm"
              />
            </div>

            {/* Cloudinary Photo Upload */}
            <PhotoUploadInput
              value={formData.photo_url}
              onChange={(url) => setFormData((prev) => ({ ...prev, photo_url: url }))}
              onError={setUploadError}
            />

            <div className="pt-5 border-t border-[#d8cdbc] flex items-center justify-end space-x-3">
              <Link
                to="/complaints"
                className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#6b665e] bg-[#ebe5da] hover:bg-[#d8cdbc] border border-[#d8cdbc] transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !formData.title.trim() || !formData.description.trim()}
                className="inline-flex items-center px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] bg-[#24211e] hover:bg-[#3f3025] disabled:opacity-50 border border-[#24211e] shadow-sm transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Submit Complaint
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
