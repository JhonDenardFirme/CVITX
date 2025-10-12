'use client';

import { Suspense } from 'react';
import AuthPage from '@/components/AuthPage';

export default function Home() {
  // (kept: no behavior change)
  const handleSubmit = () => {};

  return (
    <div className="w-full h-auto bg-neutral-950 flex flex-col justify-center items-center">
      {/* Wrap the subtree that uses useSearchParams() in Suspense */}
      <Suspense
        fallback={
          <div className="w-full h-screen flex items-center justify-center text-xs text-neutral-400">
            Loading…
          </div>
        }
      >
        <AuthPage />
      </Suspense>
    </div>
  );
}
