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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center space-x-3">
        <Link
          to="/complaints"
          className="p-2 text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Raise a Complaint</h1>
          <p className="text-xs text-gray-500">Submit a new maintenance or service request to society management.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
        <ErrorAlert message={uploadError} onDismiss={() => setUploadError(null)} />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1">
              Issue Title <span className="text-red-500">*</span>
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
              className="block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm bg-white"
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
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">
              Detailed Description <span className="text-red-500">*</span>
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
              className="block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm"
            />
          </div>

          {/* Cloudinary Photo Upload */}
          <PhotoUploadInput
            value={formData.photo_url}
            onChange={(url) => setFormData((prev) => ({ ...prev, photo_url: url }))}
            onError={setUploadError}
          />

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
            <Link
              to="/complaints"
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.description.trim()}
              className="inline-flex items-center px-6 py-2.5 font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-500/20 transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Submit Complaint
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
