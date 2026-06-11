'use client';

/**
 * Shell del CONCEPTO B — «Editorial»: masthead tipo revista, SIN sidebar.
 * El avatar lleva a Ajustes. Doble regla editorial bajo la cabecera.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConceptSwitcher } from '../_switcher';

const NAV_ITEMS = [
  { href: '/concepts/b', label: 'Inicio', exact: true },
  { href: '/concepts/b/semana', label: 'Semana' },
  { href: '/concepts/b/disenos', label: 'Diseños' },
  { href: '/concepts/b/miembros', label: 'Miembros' },
];

export default function ConceptBLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="dark min-h-dvh bg-[hsl(220,14%,7%)] text-foreground antialiased">
      <ConceptSwitcher />

      {/* Masthead */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 pb-2 pt-6">
        <Link
          href="/concepts/b"
          className="font-heading text-sm font-semibold tracking-[0.3em] text-foreground"
        >
          PHSPORT
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'border-b-2 pb-1 font-mono text-eyebrow uppercase transition-colors',
                isActive(item)
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button className="flex h-8 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" />
            Crear
          </button>
          <Link
            href="/concepts/b/ajustes"
            title="Ajustes"
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border font-mono text-[11px] font-semibold transition-colors',
              pathname.endsWith('/ajustes')
                ? 'border-primary text-primary'
                : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
            )}
          >
            M
          </Link>
        </div>
      </header>

      {/* Doble regla editorial */}
      <div className="mx-auto max-w-5xl px-6">
        <div className="border-b border-border" />
        <div className="mt-[3px] border-b border-border/50" />
      </div>

      <main className="mx-auto max-w-5xl px-6 pb-2xl">{children}</main>
    </div>
  );
}
