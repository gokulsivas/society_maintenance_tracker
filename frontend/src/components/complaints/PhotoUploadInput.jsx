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
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] dark:text-[#d8cdbc]">
        Attached Photo <span className="text-[#8F8778] dark:text-[#a89e91] font-normal text-[11px]">(Optional, max 5 MB)</span>
      </label>

      {!preview ? (
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border border-dashed border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] hover:border-[#5f4b3b]/60 dark:hover:border-[#d8cdbc]/40 transition-colors bg-[#FAF8F5] dark:bg-[#2b2723] rounded-none">
          <div className="space-y-2 text-center">
            {uploading ? (
              <div className="flex flex-col items-center py-3">
                <Loader2 className="h-8 w-8 text-[#5f4b3b] dark:text-[#d8cdbc] animate-spin mb-2" />
                <p className="text-xs font-semibold uppercase tracking-wider text-[#5f4b3b] dark:text-[#d8cdbc]">Uploading photo securely...</p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-8 w-8 text-[#8F8778] dark:text-[#a89e91]" />
                <div className="flex text-sm text-[#6b665e] dark:text-[#c8bfb3]">
                  <label
                    htmlFor="photo-upload"
                    className="relative cursor-pointer bg-transparent font-semibold text-[#5f4b3b] dark:text-[#d8cdbc] hover:text-[#24211e] dark:hover:text-[#f5f2ec] focus-within:outline-none"
                  >
                    <span>Upload a photo</span>
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
                <p className="text-[11px] text-[#8F8778] dark:text-[#a89e91]">PNG, JPG, WebP up to 5MB</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="relative inline-block border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)] bg-[#FAF8F5] dark:bg-[#2b2723] p-2 shadow-sm rounded-none">
          <img
            src={preview}
            alt="Uploaded complaint preview"
            className="h-44 w-auto object-cover border border-[#d8cdbc] dark:border-[rgba(245,242,236,0.16)]"
          />
          <div className="mt-2 flex items-center justify-between px-1">
            <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[#52634a] dark:text-[#a3c99b]">
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Attached
            </span>
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[#8a4d43] dark:text-[#efb2a8] hover:text-[#5f4b3b] dark:hover:text-[#ffe6e1]"
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
