// components/common/AppShell.jsx
'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import TimelineSheet from '@/components/common/TimelineSheet'

import { useRouter } from 'next/navigation'
import { useUser, signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export default function AppShell({ children, workspaceId }) {
  const router = useRouter()
  const { user } = useUser()

  async function handleSignOut() {
    try { await signOut() } finally { router.replace('/auth-signin') }
  }

  return (
    <SidebarProvider>
      <AppSidebar />

      {/* FIX: allow the content flex item to shrink and clip overflow */}
      <SidebarInset className="min-w-0 overflow-hidden">
        {/* fixed user strip */}
        <div className="fixed top-3 right-4 z-40 flex items-center gap-2">
          {user ? (
            <>
              <span className="text-xs text-neutral-400 hidden sm:inline-block">
                {user.name || user.email}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={handleSignOut}
                title="Sign out"
              >
                Sign Out
              </Button>
            </>
          ) : null}
        </div>

        {/* FIX: children wrapper must also be min-w-0 and hide horizontal overflow */}
        <div className="min-w-0 w-full h-full overflow-x-hidden">
          {children}
        </div>

        <TimelineSheet workspaceId={workspaceId} />
      </SidebarInset>
    </SidebarProvider>
  )
}
