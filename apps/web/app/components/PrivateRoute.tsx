"use client";

import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { supabaseBrowser } from '@/lib/supabase-browser';


export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // セッションチェック
    const checkSession = async () => {
      try {
        const { data } = await supabaseBrowser.auth.getSession();
        setUser(data.session?.user || null);
        
        if (!data.session?.user) {
          router.push('/login');
        }
      } catch (error) {
        console.error('認証エラー:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 認証状態変更のリスナー
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(
      (_event, session) => {
        const newUser = session?.user || null;
        setUser(newUser);
        
        if (!newUser) {
          router.push('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <>{children}</> : null;
}