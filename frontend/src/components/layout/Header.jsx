'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, Search, Plus } from 'lucide-react';
import Button from '../ui/Button';
import NotificationBell from '../notifications/NotificationBell';

export default function Header({ title = 'Dashboard', onOpenNewIssue, onOpenNewProject }) {
  return (
    <header className="h-16 border-b border-white/5 glass-panel px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center space-x-4">
        {/* Real-time Notification Bell */}
        <NotificationBell />

        {/* Action Buttons */}
        {onOpenNewProject && (
          <Button variant="secondary" size="sm" onClick={onOpenNewProject}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Project
          </Button>
        )}

        {onOpenNewIssue && (
          <Button variant="primary" size="sm" onClick={onOpenNewIssue}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Issue
          </Button>
        )}
      </div>
    </header>
  );
}
