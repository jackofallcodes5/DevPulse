'use client';
import React from 'react';

export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`glass-card rounded-xl p-5 border border-white/5 ${
        hover ? 'hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
