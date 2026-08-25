'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  Users,
  Bell,
  Settings,
  Plus,
  ChevronDown,
  LogOut,
  FolderGit2,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { authAPI } from '@/lib/api';

export default function Sidebar({ workspaces = [], currentWorkspace, onSelectWorkspace, onOpenNewWorkspace }) {
  const pathname = usePathname();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);

  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      clearUser();
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Projects', icon: FolderGit2, href: currentWorkspace ? `/workspace/${currentWorkspace.id}` : '/dashboard' },
    { label: 'Notifications', icon: Bell, href: '/notifications' },
    { label: 'Team', icon: Users, href: '/team' },
    { label: 'Settings', icon: Settings, href: '/settings' },
  ];

  return (
    <aside className="w-64 h-screen glass-panel border-r border-white/5 flex flex-col justify-between p-4 fixed left-0 top-0 z-30">
      <div className="space-y-6">
        {/* Logo */}
        <div className="flex items-center space-x-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none gradient-text">DevPulse</h1>
            <p className="text-[10px] text-gray-400 font-mono">DEVELOPER PLATFORM</p>
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className="relative">
          <button
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gray-900/60 border border-white/5 hover:border-purple-500/30 transition text-left text-sm"
          >
            <div className="truncate">
              <p className="text-xs text-gray-400">Workspace</p>
              <p className="font-medium text-white truncate">
                {currentWorkspace?.name || 'Select Workspace'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
          </button>

          {workspaceDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-2 glass-panel rounded-xl border border-white/10 p-1.5 shadow-2xl z-40 space-y-1">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    onSelectWorkspace(ws);
                    setWorkspaceDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg transition ${
                    currentWorkspace?.id === ws.id
                      ? 'bg-purple-600/20 text-purple-300 font-semibold'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {ws.name}
                </button>
              ))}
              <button
                onClick={() => {
                  setWorkspaceDropdownOpen(false);
                  onOpenNewWorkspace && onOpenNewWorkspace();
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-lg text-purple-400 hover:bg-purple-500/10 flex items-center space-x-1.5 font-medium border-t border-gray-800/60 mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Workspace</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/10 text-purple-300 border border-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info Footer */}
      <div className="pt-4 border-t border-gray-800/60 flex items-center justify-between">
        <div className="flex items-center space-x-3 truncate">
          <Avatar src={user?.avatarUrl} name={user?.name || 'User'} size="md" />
          <div className="truncate text-xs">
            <p className="font-semibold text-white truncate">{user?.name || 'Developer'}</p>
            <p className="text-gray-400 truncate">@{user?.username || 'dev'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Log out"
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
