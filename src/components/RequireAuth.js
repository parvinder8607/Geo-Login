// components/RequireAuth.js
'use client';

import { useAuth } from '@/hooks/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = pathname === '/login';

  useEffect(() => {
    if (!loading && user === false && !isPublicRoute) {
      router.replace('/login');
    }
  }, [user, loading, isPublicRoute, router]);

  if ((loading || user === null) && !isPublicRoute) {
    return <div className="p-4 text-center">Checking authentication...</div>;
  }

  return children;
}
