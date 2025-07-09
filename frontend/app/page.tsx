'use client';

import { AuthPage } from '@/components/AuthPage';
import { CommentApp } from '@/components/CommentApp';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <CommentApp />;
}
