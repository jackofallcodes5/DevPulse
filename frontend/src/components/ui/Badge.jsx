'use client';
import React from 'react';

const badgeStyles = {
  // Statuses
  TODO: 'bg-gray-800 text-gray-300 border-gray-700',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  DONE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',

  // Priorities
  LOW: 'bg-slate-800 text-slate-300 border-slate-700',
  MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  URGENT: 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse',

  // General
  UP: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  DOWN: 'bg-red-500/10 text-red-400 border-red-500/30',
  ACTIVE: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  ARCHIVED: 'bg-gray-800 text-gray-400 border-gray-700',
};

export default function Badge({ children, variant = 'TODO', className = '' }) {
  const style = badgeStyles[variant] || 'bg-gray-800 text-gray-300 border-gray-700';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      {children || variant}
    </span>
  );
}
