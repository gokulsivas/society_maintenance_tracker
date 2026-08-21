import React from 'react';
import { AlertCircle, XCircle } from 'lucide-react';

export default function ErrorAlert({ message, onDismiss = null }) {
  if (!message) return null;

  return (
    <div
      className="bg-[#fbeeed] p-4 border border-[#d9a8a0] text-[#8a4d43] flex items-start justify-between mb-4 shadow-sm"
      role="alert"
    >
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-[#8a4d43] mt-0.5 flex-shrink-0" />
        <div className="text-sm font-medium">{message}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-[#8a4d43] hover:text-[#5f4b3b] ml-3 flex-shrink-0"
          aria-label="Dismiss alert"
        >
          <XCircle className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
