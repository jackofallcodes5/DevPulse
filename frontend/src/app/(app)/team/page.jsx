'use client';
import React, { useEffect, useState } from 'react';
import Card from '../../../components/ui/Card';
import Avatar from '../../../components/ui/Avatar';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import { useWorkspaceStore } from '../../../stores/workspaceStore';
import { workspaceAPI } from '../../../lib/api';
import { Users, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeamPage() {
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('DEVELOPER');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (currentWorkspace?.id) {
      workspaceAPI
        .getMembers(currentWorkspace.id)
        .then((res) => {
          if (res.data?.members) setMembers(res.data.members);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [currentWorkspace?.id]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim() || !currentWorkspace?.id) return;
    setInviting(true);

    try {
      const res = await workspaceAPI.inviteMember(currentWorkspace.id, { email, role });
      if (res.data?.member) {
        setMembers([...members, res.data.member]);
        toast.success('Member invited to workspace!');
        setInviteModalOpen(false);
        setEmail('');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-purple-400" />
            <span>Workspace Team Management</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage workspace members, roles (Owner, Admin, Developer, Viewer), and access
          </p>
        </div>

        <Button onClick={() => setInviteModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-1.5" />
          Invite Member
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
        </div>
      ) : (
        <Card className="p-0 overflow-hidden border-white/10">
          <div className="divide-y divide-gray-800">
            {members.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-900/40 transition">
                <div className="flex items-center space-x-3">
                  <Avatar src={m.user?.avatarUrl} name={m.user?.name || 'User'} size="md" />
                  <div>
                    <p className="text-sm font-bold text-white">{m.user?.name}</p>
                    <p className="text-xs text-gray-400">@{m.user?.username} • {m.user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge variant={m.role === 'OWNER' ? 'ACTIVE' : 'IN_PROGRESS'}>
                    {m.role}
                  </Badge>
                  <span className="text-[11px] text-gray-500">
                    Joined {new Date(m.joinedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Member to Workspace"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="User Email Address"
            type="email"
            placeholder="colleague@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-300">Workspace Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-gray-900 text-white rounded-lg border border-gray-800 focus:border-purple-500 outline-none"
            >
              <option value="ADMIN">Admin</option>
              <option value="DEVELOPER">Developer</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={inviting}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
