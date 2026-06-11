'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const CONCEPTS = ['a', 'b', 'c'] as const;

/**
 * Conmutador flotante. Mantiene la subpágina al cambiar de concepto:
 * /concepts/a/disenos + «C» → /concepts/c/disenos.
 */
export function ConceptSwitcher() {
  const pathname = usePathname() ?? '';
  const match = pathname.match(/^\/concepts\/([abc])(\/.*)?$/);
  const current = match?.[1];
  const subpath = match?.[2] ?? '';

  return (
    <div className="glass-panel fixed bottom-4 right-4 z-[60] flex items-center gap-1 rounded-full px-2 py-1.5 shadow-overlay">
      <span className="px-1.5 font-mono text-eyebrow uppercase text-panel-foreground/50">
        Concepto
      </span>
      {CONCEPTS.map((id) => (
        <Link
          key={id}
          href={`/concepts/${id}${subpath}`}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-semibold uppercase transition-colors',
            current === id
              ? 'bg-primary text-primary-foreground'
              : 'text-panel-foreground/70 hover:bg-panel-hover'
          )}
        >
          {id}
        </Link>
      ))}
      <Link
        href="/concepts"
        className="ml-1 flex h-7 items-center rounded-full px-2 font-mono text-[10px] uppercase tracking-wider text-panel-foreground/50 transition-colors hover:bg-panel-hover hover:text-panel-foreground"
      >
        Índice
      </Link>
    </div>
  );
}
