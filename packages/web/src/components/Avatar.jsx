import React from 'react';

export default function Avatar({ username, size = 40, className = '' }) {
  const firstLetter = username ? username.charAt(0).toUpperCase() : 'U';
  
  return (
    <div 
      className={`flex items-center justify-center rounded-full border-2 border-[var(--orange-wheel)] bg-[var(--prussian-blue)] text-[var(--vanilla)] font-semibold ${className}`}
      style={{ width: size, height: size }}
    >
      {firstLetter}
    </div>
  );
} 