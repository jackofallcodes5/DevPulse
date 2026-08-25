'use client';
import React from 'react';
import Link from 'next/link';
import { Activity } from 'lucide-react';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col justify-center items-center p-4">
      <div className="mb-8 text-center space-y-2">
        <Link href="/" className="inline-flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-2xl leading-none gradient-text">DevPulse</span>
        </Link>
        <p className="text-xs text-gray-400">Developer Collaboration & API Monitoring</p>
      </div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl">
        {children}
      </div>
    </div>
  );
}
