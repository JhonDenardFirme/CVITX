'use client';
import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

const Toaster = ({ ...props }) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          // Make the toast a positioning context and reserve space on the left for the X
          toast:
            [
              'relative pl-10', // space for close button on the left
              'group toast',
              'group-[.toaster]:bg-background/90 group-[.toaster]:text-foreground',
              'group-[.toaster]:border-border group-[.toaster]:shadow-lg',
            ].join(' '),

          description: 'group-[.toast]:text-muted-foreground',

          // Style the action (Undo) as bordered, no bg
          actionButton:
            [
              'h-7 px-3 rounded-md',
              'border border-neutral-700',
              'bg-transparent hover:bg-transparent',
              'text-foreground',
              'group-[.toast]:transition-colors',
              'focus-visible:outline-none focus-visible:ring-0',
            ].join(' '),

          // If you ever use `cancel` actions, keep them subtle too
          cancelButton:
            [
              'h-7 px-3 rounded-md',
              'border border-neutral-800',
              'bg-transparent hover:bg-transparent',
              'text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-0',
            ].join(' '),

          // Reposition the X (close) to center-left
          closeButton:
            [
              'absolute left-2 top-1/2 -translate-y-1/2',
              'h-7 w-7 grid place-items-center rounded-md',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-neutral-800/50',
              'focus-visible:outline-none focus-visible:ring-0',
            ].join(' '),
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
