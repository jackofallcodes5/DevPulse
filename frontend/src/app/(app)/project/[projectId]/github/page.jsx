'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { githubAPI, projectAPI } from '../../../../../lib/api';
import Card from '../../../../../components/ui/Card';
import Button from '../../../../../components/ui/Button';
import Badge from '../../../../../components/ui/Badge';
import EmptyState from '../../../../../components/ui/EmptyState';
import Modal from '../../../../../components/ui/Modal';
import { Github, GitCommit, GitPullRequest, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GitHubIntegrationPage() {
  const params = useParams();
  const projectId = params.projectId;

  const [project, setProject] = useState(null);
  const [userRepos, setUserRepos] = useState([]);
  const [commits, setCommits] = useState([]);
  const [pulls, setPulls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    projectAPI
      .getById(projectId)
      .then((res) => {
        if (res.data?.project) {
          setProject(res.data.project);
          if (res.data.project.repositories?.length > 0) {
            const connectedRepoId = res.data.project.repositories[0].id;
            fetchRepoData(connectedRepoId);
          }
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [projectId]);

  const fetchRepoData = (repoId) => {
    Promise.all([
      githubAPI.getCommits(repoId),
      githubAPI.getPullRequests(repoId),
    ])
      .then(([commitRes, pullRes]) => {
        if (commitRes.data?.commits) setCommits(commitRes.data.commits);
        if (pullRes.data?.pulls) setPulls(pullRes.data.pulls);
      })
      .catch(console.error);
  };

  const openConnectModal = () => {
    githubAPI
      .getRepositories()
      .then((res) => {
        if (res.data?.repositories) {
          setUserRepos(res.data.repositories);
        }
      })
      .catch((err) => toast.error('Connect GitHub account first in Settings'));
    setConnectModalOpen(true);
  };

  const handleConnectRepo = async (e) => {
    e.preventDefault();
    if (!selectedRepoId) return;
    setConnecting(true);

    try {
      await githubAPI.connectRepo(selectedRepoId, projectId);
      toast.success('Repository connected!');
      setConnectModalOpen(false);
      window.location.reload();
    } catch (err) {
      toast.error(err.message || 'Failed to connect repository');
    } finally {
      setConnecting(false);
    }
  };

  const connectedRepo = project?.repositories?.[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Github className="w-6 h-6 text-purple-400" />
            <span>GitHub Integration</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Connect a GitHub repository to auto-link commits, pull requests, and webhooks
          </p>
        </div>

        {!connectedRepo && (
          <Button onClick={openConnectModal}>
            <Link2 className="w-4 h-4 mr-1.5" />
            Connect Repository
          </Button>
        )}
      </div>

      {!connectedRepo ? (
        <EmptyState
          icon={Github}
          title="No GitHub Repository Connected"
          description="Connect your GitHub repository to DevPulse to enable commit issue auto-linking (#142) and live PR tracking."
          actionLabel="Connect Repository"
          onAction={openConnectModal}
        />
      ) : (
        <div className="space-y-6">
          {/* Connected Repo Card */}
          <Card className="glass-panel border-purple-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
                <Github className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{connectedRepo.fullName}</h3>
                <a
                  href={connectedRepo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:underline"
                >
                  {connectedRepo.url}
                </a>
              </div>
            </div>
            <Badge variant="ACTIVE">CONNECTED</Badge>
          </Card>

          {/* Commits & PRs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Commits */}
            <Card className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <GitCommit className="w-4 h-4 text-purple-400" />
                <span>Recent Commits ({commits.length})</span>
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {commits.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-4">No commits recorded yet.</p>
                ) : (
                  commits.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-gray-900/60 border border-white/5 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white truncate">{c.message}</span>
                        {c.issue && (
                          <Badge variant="IN_PROGRESS" className="text-[10px]">
                            #{c.issue.number}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono">
                        {c.authorName} • {c.sha.slice(0, 7)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Pull Requests */}
            <Card className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <GitPullRequest className="w-4 h-4 text-blue-400" />
                <span>Pull Requests ({pulls.length})</span>
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {pulls.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-4">No pull requests found.</p>
                ) : (
                  pulls.map((pr) => (
                    <div key={pr.id} className="p-3 rounded-xl bg-gray-900/60 border border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">
                          #{pr.number} {pr.title}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          by @{pr.authorLogin}
                        </p>
                      </div>
                      <Badge variant={pr.merged ? 'DONE' : pr.state.toUpperCase()}>
                        {pr.merged ? 'MERGED' : pr.state}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Connect Modal */}
      <Modal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        title="Connect GitHub Repository"
      >
        <form onSubmit={handleConnectRepo} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-300">Select Repository</label>
            <select
              value={selectedRepoId}
              onChange={(e) => setSelectedRepoId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-gray-900 text-white rounded-lg border border-gray-800 focus:border-purple-500 outline-none"
              required
            >
              <option value="">-- Choose a repository --</option>
              {userRepos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConnectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={connecting}>
              Connect Repo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
