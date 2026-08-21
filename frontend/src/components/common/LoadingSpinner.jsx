import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading...', size = 'default' }) {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3" role="status">
      <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size] || sizeClasses.default}`} />
      {message && <p className="text-sm font-medium text-gray-500">{message}</p>}
      <span className="sr-only">Loading</span>
    </div>
  );
}
