import React from 'react';

/**
 * Socivio Branded Logo
 * A bespoke solid architectural "S" mark composed of interlocking geometric
 * structural planes and cantilevered pavilions with negative-space community arches.
 */
export default function Logo({ className = 'h-5 w-5', ariaLabel = 'Socivio' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-label={ariaLabel}
      role="img"
    >
      {/* Upper architectural cantilever & tower wing */}
      <path
        d="M3 4.5A1.5 1.5 0 0 1 4.5 3h15A1.5 1.5 0 0 1 21 4.5V9a1 1 0 0 1-1 1h-9.5a1 1 0 0 0-1 1v2.5a1 1 0 0 1-1 1H4.5A1.5 1.5 0 0 1 3 13V4.5z"
      />
      {/* Lower residential foundation & terrace wing */}
      <path
        d="M21 19.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5V15a1 1 0 0 1 1-1h9.5a1 1 0 0 0 1-1v-2.5a1 1 0 0 1 1-1h5a1.5 1.5 0 0 1 1.5 1.5v8z"
      />
    </svg>
  );
}
