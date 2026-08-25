'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import KanbanBoard from '../../../../../components/issues/KanbanBoard';
import IssueForm from '../../../../../components/issues/IssueForm';
import Modal from '../../../../../components/ui/Modal';
import Button from '../../../../../components/ui/Button';
import { issueAPI } from '../../../../../lib/api';
import { useSocket } from '../../../../../lib/socket';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function IssuesKanbanPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId;

  const [columnsData, setColumnsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState('TODO');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const socket = useSocket(null, projectId);

  const fetchKanban = useCallback(() => {
    if (!projectId) return;
    issueAPI
      .getKanban(projectId)
      .then((res) => {
        if (res.data?.columns) {
          setColumnsData(res.data.columns);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [projectId]);

  useEffect(() => {
    fetchKanban();
  }, [fetchKanban]);

  useEffect(() => {
    if (!socket) return;

    const handleIssueCreated = () => fetchKanban();
    const handleIssueUpdated = () => fetchKanban();
    const handleIssueDeleted = () => fetchKanban();

    socket.on('issue:created', handleIssueCreated);
    socket.on('issue:updated', handleIssueUpdated);
    socket.on('issue:deleted', handleIssueDeleted);

    return () => {
      socket.off('issue:created', handleIssueCreated);
      socket.off('issue:updated', handleIssueUpdated);
      socket.off('issue:deleted', handleIssueDeleted);
    };
  }, [socket, fetchKanban]);

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      await issueAPI.update(issueId, { status: newStatus });
      toast.success(`Moved issue to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      toast.error('Failed to update issue status');
      fetchKanban();
    }
  };

  const handleCreateIssue = async (formData) => {
    setIsSubmitting(true);
    try {
      const res = await issueAPI.create(projectId, formData);
      if (res.data?.issue) {
        toast.success(`Created Issue #${res.data.issue.number}`);
        setCreateModalOpen(false);
        fetchKanban();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = (status = 'TODO') => {
    setCreateStatus(status);
    setCreateModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Kanban Board</h1>
          <p className="text-xs text-gray-400">Drag and drop issues between columns to update status</p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search issues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-900 text-white rounded-lg border border-gray-800 focus:border-purple-500 outline-none"
            />
          </div>

          <Button onClick={() => openCreateModal('TODO')}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Issue
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
        </div>
      ) : (
        <KanbanBoard
          columnsData={columnsData}
          onStatusChange={handleStatusChange}
          onOpenCreate={openCreateModal}
          onSelectIssue={(issue) => router.push(`/project/${projectId}/issues/${issue.id}`)}
        />
      )}

      {/* Modal to Create Issue */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Issue"
        maxWidth="max-w-lg"
      >
        <IssueForm
          initialStatus={createStatus}
          onSubmit={handleCreateIssue}
          onCancel={() => setCreateModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}
