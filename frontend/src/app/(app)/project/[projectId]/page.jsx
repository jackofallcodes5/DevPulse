'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { projectAPI } from '../../../../lib/api';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import Badge from '../../../../components/ui/Badge';
import { KanbanSquare, Github, Activity, BarChart3 } from 'lucide-react';

export default function ProjectOverviewPage() {
  const params = useParams();
  const projectId = params.projectId;

  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      projectAPI
        .getById(projectId)
        .then((res) => {
          if (res.data?.project) {
            setProject(res.data.project);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!project) {
    return <p className="text-gray-400">Project not found.</p>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Project Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/20">
              {project.key}
            </span>
            <h1 className="text-2xl font-extrabold text-white">{project.name}</h1>
            <Badge variant="ACTIVE">ACTIVE</Badge>
          </div>
          <p className="text-xs text-gray-400 max-w-2xl">{project.description || 'No description provided.'}</p>
        </div>

        <div className="flex items-center space-x-3">
          <Link href={`/project/${projectId}/issues`}>
            <Button variant="primary">
              <KanbanSquare className="w-4 h-4 mr-2" />
              Open Kanban
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Modules Quick Access */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link href={`/project/${projectId}/issues`}>
          <Card hover className="space-y-3">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 w-fit border border-purple-500/20">
              <KanbanSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Kanban Issues</h3>
            <p className="text-xs text-gray-400">Manage tasks, assignees, priorities, and status columns.</p>
          </Card>
        </Link>

        <Link href={`/project/${projectId}/github`}>
          <Card hover className="space-y-3">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 w-fit border border-blue-500/20">
              <Github className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">GitHub Activity</h3>
            <p className="text-xs text-gray-400">View commits, PRs, and automatic issue linking via webhooks.</p>
          </Card>
        </Link>

        <Link href={`/project/${projectId}/monitoring`}>
          <Card hover className="space-y-3">
            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 w-fit border border-cyan-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">API Monitoring</h3>
            <p className="text-xs text-gray-400">Automated endpoint uptime checks, response times, & incidents.</p>
          </Card>
        </Link>

        <Link href={`/project/${projectId}/analytics`}>
          <Card hover className="space-y-3">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 w-fit border border-emerald-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Engineering Analytics</h3>
            <p className="text-xs text-gray-400">Charts on resolution rates, commit velocity, and uptime.</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
