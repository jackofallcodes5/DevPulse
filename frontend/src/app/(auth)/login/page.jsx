'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Github } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await authAPI.login({ email, password });
      if (res.data?.user) {
        setUser(res.data.user);
        toast.success('Welcome back to DevPulse!');
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-white">Sign In</h2>
        <p className="text-xs text-gray-400">Enter your credentials to access your workspace</p>
      </div>

      <a href={`${backendUrl}/api/auth/github`}>
        <Button variant="secondary" className="w-full flex items-center justify-center space-x-2 border-white/10">
          <Github className="w-4 h-4" />
          <span>Continue with GitHub</span>
        </Button>
      </a>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-gray-800 w-full" />
        <span className="bg-[#0f111f] px-3 text-[10px] text-gray-500 uppercase font-mono absolute">
          Or with email
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="gaurang@devpulse.dev"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Sign In
        </Button>
      </form>

      <p className="text-center text-xs text-gray-400">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium">
          Register
        </Link>
      </p>
    </div>
  );
}
