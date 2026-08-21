import React, { useState } from 'react';
import { uploadComplaintPhoto } from '../../api/uploads';
import { getErrorMessage } from '../../api/client';
import { Upload, X, CheckCircle, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function PhotoUploadInput({ value, onChange, onError }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || '');

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side quick validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      onError('Please select a valid JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onError('Image file size must be less than 5 MB.');
      return;
    }

    onError(null);
    setUploading(true);

    try {
      // Direct upload to Cloudinary via backend endpoint
      const result = await uploadComplaintPhoto(file);
      setPreview(result.secure_url);
      onChange(result.secure_url);
    } catch (err) {
      onError(getErrorMessage(err, 'Failed to upload photo. You can still submit without a photo.'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    onError(null);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Attached Photo <span className="text-gray-400 font-normal">(Optional, max 5 MB)</span>
      </label>

      {!preview ? (
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-400 transition-colors bg-gray-50/50">
          <div className="space-y-2 text-center">
            {uploading ? (
              <div className="flex flex-col items-center py-3">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" />
                <p className="text-sm font-medium text-blue-600">Uploading securely to Cloudinary...</p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="photo-upload"
                    className="relative cursor-pointer bg-transparent rounded-md font-semibold text-blue-600 hover:text-blue-500 focus-within:outline-none"
                  >
                    <span>Upload a file</span>
                    <input
                      id="photo-upload"
                      name="photo-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={handleFileSelect}
                      disabled={uploading}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="relative inline-block rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50 p-2">
          <img
            src={preview}
            alt="Uploaded complaint preview"
            className="h-44 w-auto object-cover rounded-md"
          />
          <div className="mt-2 flex items-center justify-between px-1">
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Uploaded
            </span>
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center text-xs font-medium text-red-600 hover:text-red-800"
            >
              <X className="w-3.5 h-3.5 mr-0.5" />
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
