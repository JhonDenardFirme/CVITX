'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import AppShell from '@/components/common/AppShell';
import { Toaster } from '@/components/ui/sonner';

export default function WorkspaceLayout({ children }) {
  const { workspaceId } = useParams() || {};
  const setCurrentWorkspace = useAppStore((s) => s.setCurrentWorkspace);

  useEffect(() => {
    if (!workspaceId) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}`, { cache: 'no-store' });

        if (!res.ok) {
          console.warn('[layout] workspace fetch failed', res.status);
          if (!cancelled) {
            setCurrentWorkspace({
              id: workspaceId,
              title: (workspaceId || '').toUpperCase(),
              code: '-', // explicit so TeamSwitcher shows "-"
            });
          }
          return;
        }

        const data = await res.json();
        const code =
          data.code ??
          data.workspace_code ??
          data.workspaceCode ??
          null;

        const title = data.title ?? 'Workspace';

        console.log('[layout] fetched workspace:', {
          id: data.id,
          title,
          code,
          raw: data,
        });

        if (!cancelled) {
          setCurrentWorkspace({
            id: data.id ?? workspaceId,
            title,
            code,
            plan: data.plan ?? '—',
          });
        }
      } catch (err) {
        console.error('[layout] fetch error:', err);
        if (!cancelled) {
          setCurrentWorkspace({
            id: workspaceId,
            title: (workspaceId || '').toUpperCase(),
            code: '-', // explicit dash when we can’t fetch
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, setCurrentWorkspace]);

  return (
    <>
      <AppShell workspaceId={workspaceId}>{children}</AppShell>
      {/* Sonner toaster mounted once per workspace layout */}
      <Toaster position="top-center" closeButton />
    </>
  );
}
