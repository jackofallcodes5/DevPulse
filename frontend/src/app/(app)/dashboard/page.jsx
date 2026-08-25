'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardStats from '../../../components/dashboard/DashboardStats';
import ActivityFeed from '../../../components/dashboard/ActivityFeed';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import EmptyState from '../../../components/ui/EmptyState';
import { useWorkspaceStore } from '../../../stores/workspaceStore';
import { projectAPI } from '../../../lib/api';
import { Plus, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  useEffect(() => {
    if (currentWorkspace?.id) {
      setIsLoading(true);
      projectAPI
        .getAll(currentWorkspace.id)
        .then((res) => {
          if (res.data?.projects) {
            setProjects(res.data.projects);
          }
        })
        .catch((err) => {
          console.error(err);
          toast.error('Failed to load workspace projects');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id]);

  const handleOpenCreateProject = () => {
    if (!currentWorkspace?.id) {
      toast.error('Please create or select a workspace first');
      return;
    }
    setNewProjectModalOpen(true);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim() || !currentWorkspace?.id) {
      toast.error('Project name and workspace are required');
      return;
    }
    setCreatingProject(true);

    try {
      const res = await projectAPI.create({
        name: projectName,
        description: projectDesc,
        workspaceId: currentWorkspace.id,
      });

      if (res.data?.project) {
        setProjects([res.data.project, ...projects]);
        toast.success('Project created successfully!');
        setNewProjectModalOpen(false);
        setProjectName('');
        setProjectDesc('');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create project');
    } finally {
      setCreatingProject(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Workspace Overview — {currentWorkspace?.name || 'DevPulse'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time project tracking, engineering activity, and API uptime monitoring
          </p>
        </div>
        <Button onClick={handleOpenCreateProject}>
          <Plus className="w-4 h-4 mr-1.5" />
          Create Project
        </Button>
      </div>

      {/* Top Metrics Cards */}
      <DashboardStats
        stats={{
          openIssues: projects.reduce((acc, p) => acc + (p._count?.issues || 0), 0),
          completedIssues: 12,
          githubCommits: 48,
          openPRs: 3,
          apiUptime: 99.98,
          activeIncidents: 0,
        }}
      />

      {/* Main Grid: Projects & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Projects ({projects.length})
            </h3>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              title="No projects in this workspace"
              description="Create your first project to organize issues, connected GitHub repos, and API monitors."
              actionLabel="Create Project"
              onAction={handleOpenCreateProject}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((project) => (
                <Link key={project.id} href={`/project/${project.id}`}>
                  <Card hover className="space-y-3 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                          {project.key}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          ACTIVE
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white group-hover:text-purple-300 transition">
                        {project.name}
                      </h4>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                        {project.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-800/60 flex items-center justify-between text-xs text-gray-400">
                      <span>{project._count?.issues || 0} issues</span>
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Live Activity Feed Column */}
        <div className="lg:col-span-1">
          <ActivityFeed activities={activities} />
        </div>
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={newProjectModalOpen}
        onClose={() => setNewProjectModalOpen(false)}
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Input
            label="Project Name"
            placeholder="e.g. Mobile API / Web Client"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-300">Description</label>
            <textarea
              rows={3}
              placeholder="Brief description of project goals..."
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-gray-900/80 text-white rounded-lg border border-gray-800 focus:border-purple-500 outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setNewProjectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={creatingProject}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
