import React from 'react';
import { AlertCircle, XCircle } from 'lucide-react';

export default function ErrorAlert({ message, onDismiss = null }) {
  if (!message) return null;

  return (
    <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-red-800 flex items-start justify-between mb-4" role="alert">
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm font-medium">{message}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-red-500 hover:text-red-700 ml-3 flex-shrink-0"
          aria-label="Dismiss alert"
        >
          <XCircle className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
