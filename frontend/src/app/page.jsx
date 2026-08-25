'use client';
import React from 'react';
import Link from 'next/link';
import {
  Activity,
  KanbanSquare,
  Github,
  BellRing,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import Button from '../components/ui/Button';

export default function LandingPage() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col justify-between selection:bg-purple-500 selection:text-white">
      {/* Header / Nav */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-white/5 max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl leading-none gradient-text">DevPulse</span>
        </div>

        <div className="flex items-center space-x-4">
          <Link href="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-8 animate-pulse">
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          <span>Real-time Engineering Operations & Monitoring</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight mb-6">
          Ship Faster. <br />
          <span className="gradient-text">Monitor Everything.</span> Collaborate Better.
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          DevPulse unifies issue tracking, GitHub commit & PR activity, and automated API health monitoring into a single real-time developer workspace.
        </p>

        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-16">
          <Link href="/register">
            <Button size="lg" className="px-8 shadow-xl shadow-purple-500/25">
              <span>Start Free Workspace</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <a href={`${backendUrl}/api/auth/github`}>
            <Button size="lg" variant="secondary" className="px-8 flex items-center space-x-2 border-white/10">
              <Github className="w-5 h-5" />
              <span>Continue with GitHub</span>
            </Button>
          </a>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mt-8">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-purple-500/30 transition">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 w-fit mb-4 border border-purple-500/20">
              <KanbanSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Kanban & Issue Tracking</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Drag-and-drop issues across TODO, In Progress, Review, and Done columns with assignees, priorities, and labels.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-purple-500/30 transition">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 w-fit mb-4 border border-blue-500/20">
              <Github className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">GitHub Webhooks & Commit Linking</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Automatically link commits like <code className="text-purple-300">#142</code> to DevPulse issues with BullMQ background job processing.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-purple-500/30 transition">
            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 w-fit mb-4 border border-cyan-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Automated API Monitoring</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Periodic background health checks, automated incident creation on failure, and historical uptime & response time analytics.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-white/5 text-center text-xs text-gray-500">
        <p>Built with Next.js, Express, MySQL, Prisma, Redis, BullMQ & Socket.IO.</p>
      </footer>
    </div>
  );
}
