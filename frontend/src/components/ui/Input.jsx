'use client';
import React from 'react';

export default function Input({ label, error, hint, className = '', id, ...props }) {
  const inputId = id || props.name;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-gray-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3.5 py-2 text-sm bg-gray-900/80 text-white rounded-lg border border-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all placeholder-gray-500 disabled:opacity-50 ${
          error ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/40' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
