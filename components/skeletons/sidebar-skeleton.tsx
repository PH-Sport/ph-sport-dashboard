import { cn } from '@/lib/utils';

interface SidebarSkeletonProps {
  collapsed: boolean;
}

export function SidebarSkeleton({ collapsed }: SidebarSkeletonProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out',
        'bg-sidebar text-sidebar-foreground',
        'flex flex-col',
        collapsed ? 'w-20' : 'w-64',
        'hidden md:flex'
      )}
    >
      <div className="p-4">
        <div
          className={cn(
            'h-10 rounded-lg animate-pulse bg-foreground/5',
            collapsed ? 'w-12' : 'w-32'
          )}
        />
      </div>

      <div className="mx-4 border-b border-border" />

      <div className="flex flex-col gap-2 p-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-10 rounded-lg animate-pulse bg-foreground/5',
              collapsed ? 'w-12' : 'w-full'
            )}
          />
        ))}
      </div>
    </aside>
  );
}
