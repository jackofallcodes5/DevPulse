'use client';
import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { workspaceAPI } from '@/lib/api';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function AppLayout({ children, title }) {
  const [workspaces, setWorkspaces] = useState([]);
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const [newWorkspaceModalOpen, setNewWorkspaceModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creatingWs, setCreatingWs] = useState(false);

  useEffect(() => {
    workspaceAPI
      .getAll()
      .then(async (res) => {
        if (res.data?.workspaces) {
          let list = res.data.workspaces;
          if (list.length === 0) {
            // Auto-create initial workspace if none exists
            try {
              const createRes = await workspaceAPI.create({ name: 'My Workspace' });
              if (createRes.data?.workspace) {
                list = [createRes.data.workspace];
              }
            } catch (err) {
              console.error('Failed to auto-create workspace:', err);
            }
          }
          setWorkspaces(list);
          if (!currentWorkspace && list.length > 0) {
            setCurrentWorkspace(list[0]);
          }
        }
      })
      .catch((err) => console.error(err));
  }, [currentWorkspace, setCurrentWorkspace]);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setCreatingWs(true);
    try {
      const res = await workspaceAPI.create({ name: newWorkspaceName });
      if (res.data?.workspace) {
        setWorkspaces([res.data.workspace, ...workspaces]);
        setCurrentWorkspace(res.data.workspace);
        setNewWorkspaceModalOpen(false);
        setNewWorkspaceName('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingWs(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <Sidebar
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSelectWorkspace={setCurrentWorkspace}
        onOpenNewWorkspace={() => setNewWorkspaceModalOpen(true)}
      />

      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header title={title} />
        <main className="p-8 flex-1">{children}</main>
      </div>

      <Modal
        isOpen={newWorkspaceModalOpen}
        onClose={() => setNewWorkspaceModalOpen(false)}
        title="Create New Workspace"
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <Input
            label="Workspace Name"
            placeholder="e.g. Acme Corp / Engineering"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            required
          />
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setNewWorkspaceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={creatingWs}>
              Create Workspace
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
