'use client';
import React from 'react';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import { GitCommit, GitPullRequest, KanbanSquare, AlertTriangle, CheckCircle } from 'lucide-react';

const getActivityIcon = (type) => {
  if (type?.includes('PUSH') || type?.includes('COMMIT')) return <GitCommit className="w-3.5 h-3.5 text-purple-400" />;
  if (type?.includes('PR')) return <GitPullRequest className="w-3.5 h-3.5 text-blue-400" />;
  if (type?.includes('ISSUE')) return <KanbanSquare className="w-3.5 h-3.5 text-amber-400" />;
  if (type?.includes('OPENED')) return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
  if (type?.includes('RESOLVED')) return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
  return <GitCommit className="w-3.5 h-3.5 text-gray-400" />;
};

export default function ActivityFeed({ activities = [] }) {
  if (activities.length === 0) {
    return <p className="text-xs text-gray-500 py-6 text-center italic">No recent activity</p>;
  }

  return (
    <Card className="space-y-4">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Activity Feed</h3>
      <div className="space-y-3">
        {activities.map((a) => (
          <div key={a.id} className="flex items-start space-x-3 text-xs pb-3 border-b border-white/5 last:border-none last:pb-0">
            <div className="p-1.5 rounded-lg bg-gray-900 border border-white/5 mt-0.5">
              {getActivityIcon(a.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-200 truncate">
                  {a.user?.name || a.payload?.pusher || 'System'}
                </span>
                <span className="text-[10px] text-gray-500">
                  {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-gray-400 text-[11px] truncate mt-0.5">
                {a.payload?.title || a.payload?.reason || a.type.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
