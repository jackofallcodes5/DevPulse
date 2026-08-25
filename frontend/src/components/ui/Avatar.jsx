'use client';
import React from 'react';

const sizes = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-14 h-14 text-base',
};

export default function Avatar({ src, name = 'User', size = 'md', className = '' }) {
  const sizeClass = sizes[size] || sizes.md;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover border border-white/10 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 text-white font-semibold flex items-center justify-center border border-white/10 ${className}`}
    >
      {initials}
    </div>
  );
}
