'use client';
import React from 'react';
import Card from '../ui/Card';
import { KanbanSquare, CheckCircle2, GitCommit, GitPullRequest, Activity, AlertTriangle } from 'lucide-react';

export default function DashboardStats({ stats = {} }) {
  const items = [
    {
      label: 'Open Issues',
      value: stats.openIssues ?? 0,
      icon: KanbanSquare,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Completed This Week',
      value: stats.completedIssues ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'GitHub Commits',
      value: stats.githubCommits ?? 0,
      icon: GitCommit,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      label: 'Open PRs',
      value: stats.openPRs ?? 0,
      icon: GitPullRequest,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'API Uptime',
      value: stats.apiUptime ? `${stats.apiUptime}%` : '99.9%',
      icon: Activity,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      label: 'Active Incidents',
      value: stats.activeIncidents ?? 0,
      icon: AlertTriangle,
      color: stats.activeIncidents > 0 ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                {item.label}
              </span>
              <div className={`p-1.5 rounded-lg border ${item.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-white tracking-tight">{item.value}</p>
          </Card>
        );
      })}
    </div>
  );
}
