'use client';
import React from 'react';

export function SkeletonLine({ className = '' }) {
  return <div className={`animate-pulse bg-gray-800/80 rounded-md ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="glass-card rounded-xl p-5 border border-white/5 space-y-3">
      <SkeletonLine className="h-5 w-1/3" />
      <SkeletonLine className="h-4 w-full" />
      <SkeletonLine className="h-4 w-2/3" />
    </div>
  );
}

export function SkeletonKanban() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((col) => (
        <div key={col} className="glass-panel p-4 rounded-xl space-y-3 min-h-[400px]">
          <SkeletonLine className="h-6 w-1/2 mb-4" />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}
