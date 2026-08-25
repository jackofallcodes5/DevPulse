'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/layout/AppLayout';
import { authAPI } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function ProtectedAppLayout({ children }) {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    authAPI
      .getMe()
      .then((res) => {
        if (res.data?.user) {
          setUser(res.data.user);
        } else {
          router.push('/login');
        }
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => {
        setInitialized(true);
      });
  }, [setUser, router]);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
