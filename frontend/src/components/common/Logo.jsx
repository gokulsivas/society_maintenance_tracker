import React from 'react';

/**
 * Socivio Branded Logo
 * An original geometric mark representing modern apartment/society buildings
 * connected by a shared community archway.
 */
export default function Logo({ className = 'h-5 w-5', ariaLabel = 'Socivio' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label={ariaLabel}
      role="img"
    >
      {/* Ground baseline */}
      <path d="M2 21h20" />
      {/* Primary residential building */}
      <path d="M4 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16" />
      {/* Connected society wing */}
      <path d="M12 9a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v12" />
      {/* Central community entrance arch connecting both structures */}
      <path d="M9 21v-4a3 3 0 0 1 6 0v4" />
      {/* Residential window/balcony accents */}
      <path d="M7 8h2" />
      <path d="M7 12h2" />
      <path d="M15 12h2" />
      <path d="M15 16h2" />
    </svg>
  );
}
