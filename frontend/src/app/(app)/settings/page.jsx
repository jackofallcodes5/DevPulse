'use client';
import React, { useState } from 'react';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';
import { useAuthStore } from '../../../stores/authStore';
import { Github, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Profile updated');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Account Settings</h1>
        <p className="text-xs text-gray-400 mt-1">Manage your user profile and GitHub OAuth connection</p>
      </div>

      {/* Profile Card */}
      <Card className="space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <User className="w-4 h-4 text-purple-400" />
          <span>Profile Information</span>
        </h3>

        <div className="flex items-center space-x-4 pb-4 border-b border-gray-800">
          <Avatar src={user?.avatarUrl} name={user?.name || 'User'} size="xl" />
          <div>
            <h4 className="text-base font-bold text-white">{user?.name}</h4>
            <p className="text-xs text-gray-400">@{user?.username} • {user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 max-w-md">
          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Button type="submit" size="sm">Save Profile</Button>
        </form>
      </Card>

      {/* GitHub Integration Card */}
      <Card className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Github className="w-4 h-4 text-purple-400" />
          <span>Connected GitHub Account</span>
        </h3>

        {user?.githubAccount ? (
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-900/60 border border-white/5">
            <div className="flex items-center space-x-3">
              <Avatar src={user.githubAccount.avatarUrl} name={user.githubAccount.login} size="md" />
              <div>
                <p className="text-sm font-bold text-white">@{user.githubAccount.login}</p>
                <p className="text-xs text-gray-400">GitHub OAuth Connected</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              CONNECTED
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-900/60 border border-white/5">
            <div>
              <p className="text-sm font-bold text-white">No GitHub account connected</p>
              <p className="text-xs text-gray-400">Connect GitHub to enable repository integration and webhooks</p>
            </div>
            <a href={`${backendUrl}/api/auth/github`}>
              <Button size="sm" variant="secondary" className="flex items-center space-x-1.5 border-white/10">
                <Github className="w-4 h-4" />
                <span>Connect GitHub</span>
              </Button>
            </a>
          </div>
        )}
      </Card>
    </div>
  );
}
