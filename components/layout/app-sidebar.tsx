'use client';

/**
 * AppSidebar — sidebar flotante PHSPORT
 *
 * Componente self-contained (provider + hook + render + sub-piezas).
 * No depende de primitiva externa. Diseñado a medida para 3 rutas + monograma.
 *
 * Uso:
 *   <SidebarProvider>
 *     <AppSidebar />
 *     ...resto del layout (consume `useSidebar()` para padding reactivo)
 *   </SidebarProvider>
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { SPRINGS } from '@/components/ui/animations';
import {
  CalendarRange,
  Home,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth/auth-context';
import { PhSportMark } from '@/components/layout/ph-sport-mark';
import { cn } from '@/lib/utils';

// ─── Constantes ───────────────────────────────────────────────

const W_EXPANDED = 14;        // rem — ancho del panel expandido
const W_COLLAPSED = 3.5;      // rem — ancho del panel colapsado
const SIDE_INSET = 0.5;       // rem — margen del panel a los bordes del viewport
const MOBILE_MAX = 767;       // px — breakpoint móvil
const COOKIE_KEY = 'phsp-sb';

// ─── Context API ──────────────────────────────────────────────

type SidebarApi = {
  expanded: boolean;
  toggle: () => void;
  isMobile: boolean;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  /** Anchos calculados para que el contenido principal reserve hueco. */
  layout: {
    sideInsetRem: number;
    panelWidthRem: number;
    /** Padding-left que el contenido debe aplicar para esquivar el panel + gap */
    contentPadLeftRem: number;
  };
};

const SidebarCtx = createContext<SidebarApi | null>(null);

export function useSidebar(): SidebarApi {
  const ctx = useContext(SidebarCtx);
  if (!ctx) throw new Error('useSidebar() debe usarse dentro de <SidebarProvider>');
  return ctx;
}

export function SidebarProvider({
  children,
  defaultExpanded = true,
}: {
  children: ReactNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const restored = useRef(false);

  // Restaurar de cookie una sola vez
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const m = document.cookie.match(new RegExp(`${COOKIE_KEY}=([^;]+)`));
    if (m) setExpanded(m[1] === '1');
  }, []);

  // Track viewport
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const toggle = useCallback(() => {
    if (isMobile) {
      setMobileOpen((v) => !v);
      return;
    }
    setExpanded((prev) => {
      const next = !prev;
      document.cookie = `${COOKIE_KEY}=${next ? '1' : '0'}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      return next;
    });
  }, [isMobile]);

  // Cmd/Ctrl + B
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  const api = useMemo<SidebarApi>(() => {
    const panelWidthRem = expanded ? W_EXPANDED : W_COLLAPSED;
    return {
      expanded,
      toggle,
      isMobile,
      mobileOpen,
      setMobileOpen,
      layout: {
        sideInsetRem: SIDE_INSET,
        panelWidthRem,
        contentPadLeftRem: panelWidthRem + SIDE_INSET * 2,
      },
    };
  }, [expanded, toggle, isMobile, mobileOpen]);

  return <SidebarCtx.Provider value={api}>{children}</SidebarCtx.Provider>;
}

// ─── Configuración de navegación ─────────────────────────────

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

function buildNavItems(role: 'ADMIN' | 'DESIGNER' | undefined): NavItem[] {
  return [
    { href: '/inicio', label: 'Inicio', icon: Home },
    // Vista semanal de trabajo: el equipo (mánager) o la cola propia (diseñador).
    role === 'ADMIN'
      ? { href: '/equipo', label: 'Semana', icon: CalendarRange }
      : { href: '/mi-semana', label: 'Semana', icon: CalendarRange },
    { href: '/disenos', label: 'Diseños', icon: Palette },
  ];
}

function isItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/');
}

// ─── AppSidebar (entry point) ────────────────────────────────

export function AppSidebar() {
  const { isMobile, mobileOpen, setMobileOpen } = useSidebar();
  const { profile } = useAuth();
  const pathname = usePathname() ?? '';
  const items = buildNavItems(profile?.role);

  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[16rem] border-panel-border bg-panel p-0 text-panel-foreground"
        >
          <SheetTitle className="sr-only">Navegación PHSPORT</SheetTitle>
          <SheetDescription className="sr-only">
            Menú principal del producto
          </SheetDescription>
          <SidebarBody
            items={items}
            pathname={pathname}
            expanded
            onItemClick={() => setMobileOpen(false)}
            showFooterToggle={false}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return <SidebarDesktop items={items} pathname={pathname} />;
}

// ─── Desktop floating panel ──────────────────────────────────

function SidebarDesktop({ items, pathname }: { items: NavItem[]; pathname: string }) {
  const { expanded, layout } = useSidebar();
  return (
    <aside
      data-state={expanded ? 'expanded' : 'collapsed'}
      aria-label="Navegación principal"
      style={{
        width: `${layout.panelWidthRem}rem`,
        top: `${layout.sideInsetRem}rem`,
        bottom: `${layout.sideInsetRem}rem`,
        left: `${layout.sideInsetRem}rem`,
      }}
      className={cn(
        'fixed z-30 hidden flex-col',
        'glass-panel rounded-2xl shadow-overlay',
        'transition-[width] duration-200 ease-out',
        'md:flex'
      )}
    >
      <SidebarBody items={items} pathname={pathname} expanded={expanded} showFooterToggle />
    </aside>
  );
}

// ─── Cuerpo compartido (mobile + desktop) ────────────────────

function SidebarBody({
  items,
  pathname,
  expanded,
  onItemClick,
  showFooterToggle,
}: {
  items: NavItem[];
  pathname: string;
  expanded: boolean;
  onItemClick?: () => void;
  showFooterToggle: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <SidebarBrand expanded={expanded} onLinkClick={onItemClick} />
      <nav
        className="flex-1 overflow-y-auto px-2 py-3"
        aria-label="Secciones"
      >
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.href}>
              <NavLink
                item={item}
                active={isItemActive(pathname, item.href)}
                expanded={expanded}
                onClick={onItemClick}
              />
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex flex-col gap-1 border-t border-panel-border/60 p-2">
        <NavLink
          item={{ href: '/ajustes', label: 'Ajustes', icon: Settings }}
          active={isItemActive(pathname, '/ajustes')}
          expanded={expanded}
          onClick={onItemClick}
        />
        {showFooterToggle && <SidebarToggleButton expanded={expanded} />}
      </div>
    </div>
  );
}

// ─── Logo zone ───────────────────────────────────────────────

function SidebarBrand({
  expanded,
  onLinkClick,
}: {
  expanded: boolean;
  onLinkClick?: () => void;
}) {
  return (
    <Link
      href="/inicio"
      onClick={onLinkClick}
      aria-label="PHSPORT — Inicio"
      className={cn(
        'flex items-center border-b border-panel-border/60 px-3 py-4 outline-none transition-colors',
        'hover:bg-panel-hover/40',
        'focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-inset',
        expanded ? 'gap-3' : 'justify-center'
      )}
    >
      <PhSportMark
        decorative
        className={cn('shrink-0 text-panel-foreground', expanded ? 'h-7' : 'h-6')}
      />
      {expanded && (
        <span className="font-heading text-base font-semibold tracking-tight text-panel-foreground">
          PHSPORT
        </span>
      )}
    </Link>
  );
}

// ─── Item ────────────────────────────────────────────────────

function NavLink({
  item,
  active,
  expanded,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      title={!expanded ? item.label : undefined}
      className={cn(
        'relative flex h-10 items-center rounded-lg outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-inset',
        expanded ? 'gap-3 px-3' : 'mx-auto w-10 justify-center',
        active
          ? 'font-medium text-panel-active-foreground'
          : 'text-panel-foreground/80 hover:bg-panel-hover hover:text-panel-foreground'
      )}
    >
      {/* Pill activa compartida — se desliza entre items con muelle (momento firma) */}
      {active && (
        <motion.span
          layoutId="nav-active-pill"
          transition={SPRINGS.smooth}
          className="absolute inset-0 rounded-lg bg-panel-active"
          aria-hidden
        />
      )}
      <Icon className="relative z-10 h-5 w-5 shrink-0" aria-hidden />
      {expanded && <span className="relative z-10 truncate text-sm">{item.label}</span>}
    </Link>
  );
}

// ─── Footer toggle ──────────────────────────────────────────

function SidebarToggleButton({ expanded }: { expanded: boolean }) {
  const { toggle } = useSidebar();
  const Icon = expanded ? PanelLeftClose : PanelLeftOpen;
  const label = expanded ? 'Colapsar' : 'Expandir';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`${label} barra lateral`}
      title={`${label} (⌘B)`}
      className={cn(
        'flex h-9 items-center rounded-lg outline-none transition-colors',
        'text-panel-foreground/70 hover:bg-panel-hover hover:text-panel-foreground',
        'focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-inset',
        expanded ? 'gap-2 px-3 text-sm' : 'mx-auto w-9 justify-center'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {expanded && (
        <span className="font-mono text-eyebrow uppercase text-panel-foreground/50">⌘B</span>
      )}
    </button>
  );
}
