'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { issueAPI, commentAPI } from '../../../../../../lib/api';
import Badge from '../../../../../../components/ui/Badge';
import Avatar from '../../../../../../components/ui/Avatar';
import Card from '../../../../../../components/ui/Card';
import CommentEditor from '../../../../../../components/comments/CommentEditor';
import CommentList from '../../../../../../components/comments/CommentList';
import { useSocket } from '../../../../../../lib/socket';
import { ArrowLeft, GitCommit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { projectId, issueId } = params;

  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const socket = useSocket(null, projectId);

  const fetchIssueData = useCallback(() => {
    if (!issueId) return;
    Promise.all([issueAPI.getById(issueId), commentAPI.getByIssue(issueId)])
      .then(([issueRes, commentRes]) => {
        if (issueRes.data?.issue) setIssue(issueRes.data.issue);
        if (commentRes.data?.comments) setComments(commentRes.data.comments);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [issueId]);

  useEffect(() => {
    fetchIssueData();
  }, [fetchIssueData]);

  useEffect(() => {
    if (!socket) return;
    const handleCommentCreated = () => fetchIssueData();
    socket.on('comment:created', handleCommentCreated);
    return () => socket.off('comment:created', handleCommentCreated);
  }, [socket, fetchIssueData]);

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await issueAPI.update(issueId, { status: newStatus });
      if (res.data?.issue) {
        setIssue(res.data.issue);
        toast.success(`Status updated to ${newStatus}`);
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleAddComment = async (body) => {
    setIsSubmittingComment(true);
    try {
      const res = await commentAPI.create(issueId, body);
      if (res.data?.comment) {
        setComments([...comments, res.data.comment]);
        toast.success('Comment added');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteIssue = async () => {
    if (!confirm('Are you sure you want to delete this issue?')) return;
    try {
      await issueAPI.delete(issueId);
      toast.success('Issue deleted');
      router.push(`/project/${projectId}/issues`);
    } catch (err) {
      toast.error('Failed to delete issue');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!issue) {
    return <p className="text-gray-400">Issue not found.</p>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.push(`/project/${projectId}/issues`)}
        className="flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Kanban</span>
      </button>

      {/* Main Issue Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Comments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-start justify-between">
              <span className="text-xs font-mono text-purple-400 font-bold">
                #{issue.number}
              </span>
              <div className="flex items-center space-x-2">
                <Badge variant={issue.priority}>{issue.priority}</Badge>
                <button
                  onClick={handleDeleteIssue}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  title="Delete Issue"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white">{issue.title}</h1>

            <div className="prose prose-invert max-w-none text-xs text-gray-300 bg-gray-900/60 p-4 rounded-xl border border-white/5 whitespace-pre-wrap">
              {issue.description || 'No description provided.'}
            </div>
          </div>

          {/* Linked GitHub Commits Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <GitCommit className="w-4 h-4 text-purple-400" />
              <span>Linked GitHub Commits ({issue.commits?.length || 0})</span>
            </h3>

            {(!issue.commits || issue.commits.length === 0) ? (
              <p className="text-xs text-gray-500 italic bg-gray-900/40 p-4 rounded-xl border border-white/5">
                No linked commits yet. Push a commit with <code className="text-purple-300">#{issue.number}</code> in the message to automatically link it!
              </p>
            ) : (
              <div className="space-y-2">
                {issue.commits.map((c) => (
                  <div key={c.id} className="glass-card p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                    <div className="truncate space-y-0.5">
                      <p className="font-semibold text-white truncate">{c.message}</p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {c.authorName} • {c.sha.slice(0, 7)}
                      </p>
                    </div>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-purple-400 hover:underline shrink-0 ml-2"
                    >
                      View on GitHub
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Discussion ({comments.length})
            </h3>
            <CommentEditor onSubmit={handleAddComment} isLoading={isSubmittingComment} />
            <CommentList comments={comments} />
          </div>
        </div>

        {/* Right Sidebar: Meta & Attributes */}
        <div className="space-y-4">
          <Card className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Issue Meta</h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Status</label>
                <select
                  value={issue.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-900 text-white rounded-lg border border-gray-800 focus:border-purple-500 outline-none"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Assignee</label>
                <div className="flex items-center space-x-2">
                  {issue.assignee ? (
                    <>
                      <Avatar src={issue.assignee.avatarUrl} name={issue.assignee.name} size="sm" />
                      <span className="text-gray-200 font-medium">{issue.assignee.name}</span>
                    </>
                  ) : (
                    <span className="text-gray-500 italic">Unassigned</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Reporter</label>
                <div className="flex items-center space-x-2">
                  <Avatar src={issue.reporter?.avatarUrl} name={issue.reporter?.name || 'Reporter'} size="sm" />
                  <span className="text-gray-200 font-medium">{issue.reporter?.name}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Created</label>
                <span className="text-gray-400">{new Date(issue.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
