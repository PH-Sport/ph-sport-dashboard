# Cuenta developer + identidad de rol — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir un conmutador "Ver como" (Mánager/Diseñador, preview visual solo-cliente impersonando a un diseñador real) a la cuenta dev, renombrar Admin→Mánager, dar color por rol (Mánager dorado / Diseñador azul) con píldora persistente, y limpiar el área de Miembros (fuera lista de invitaciones pendientes, caducidad 24h, fecha de alta en el popup).

**Architecture:** El conmutador intercepta en un único punto — `useAuth()` — vía un `ViewAsProvider` montado dentro del `AuthProvider`. Cuando la cuenta dev simula a un diseñador, `useAuth()` devuelve la identidad **efectiva** (perfil + `user.id` del diseñador), de modo que todo el gating existente (sidebar, redirects, dashboards, `/mi-semana` que pasa `user.id` como `designerId`) refleja la simulación **sin tocar backend ni reescribir consumidores**. La identidad **real** se expone aparte vía `useViewAs()` para el menú de cuenta y la píldora.

**Tech Stack:** Next.js (App Router), React Context, SWR, Supabase (sin cambios de esquema), Tailwind (tokens HSL en `globals.css`), date-fns.

**Verificación:** Este repo NO usa tests unitarios; valida con `npm run type-check`, `npm run lint` y `npm run build` (la cadencia del proyecto). Cada tarea termina con type-check + lint + commit; cada fase cierra con build. Las comprobaciones manuales (requieren la cuenta dev creada) se marcan como tales.

**Referencia:** spec en `docs/superpowers/specs/2026-06-16-cuenta-developer-identidad-rol-design.md`.

---

## Fase 1 — Identidad de rol (renombrado + colores)

### Task 1: Renombrar "Admin"/"Administrador" → "Mánager"

**Files:**
- Modify: `components/features/users/invitations-card.tsx:14-17`
- Modify: `components/invitations/create-invitation-dialog.tsx:175`

- [ ] **Step 1: Renombrar en `invitations-card.tsx`**

Reemplazar el mapa `ROLE_LABELS` (líneas 14-17):

```tsx
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Mánager',
  DESIGNER: 'Diseñador',
};
```

- [ ] **Step 2: Renombrar en `create-invitation-dialog.tsx`**

En la línea 175, reemplazar:

```tsx
                  <SelectItem value="ADMIN">Administrador</SelectItem>
```

por:

```tsx
                  <SelectItem value="ADMIN">Mánager</SelectItem>
```

- [ ] **Step 3: Verificar**

Run: `npm run type-check && npm run lint`
Expected: sin errores, sin warnings.

- [ ] **Step 4: Commit**

```bash
git add components/features/users/invitations-card.tsx components/invitations/create-invitation-dialog.tsx
git commit -m "feat(roles): renombrar etiqueta Admin/Administrador a Mánager"
```

---

### Task 2: Token de color de rol (azul Diseñador) + helper + aplicación

**Files:**
- Modify: `app/globals.css` (`:root` y `.dark`)
- Modify: `tailwind.config.ts` (colors)
- Create: `lib/utils/role.ts`
- Modify: `components/features/account/members-panel.tsx` (avatares + pills)
- Modify: `components/features/designs/designs-table.tsx` (avatar de diseñador)

- [ ] **Step 1: Añadir el token `--role-designer` en `globals.css`**

En el bloque `:root` (tras la línea `--status-info: 217 80% 42%;`, línea 64), añadir:

```css
    /* Color por rol — Diseñador (azul); Mánager usa --primary (dorado) */
    --role-designer: 217 80% 42%;
```

En el bloque `.dark` (tras `--status-info: 217 80% 60%;`, línea 111), añadir:

```css
    --role-designer: 217 80% 60%;
```

- [ ] **Step 2: Registrar el color en `tailwind.config.ts`**

En el objeto `colors` (dentro de `theme.extend.colors`), tras el bloque `status` (línea 96), añadir:

```ts
        'role-designer': 'hsl(var(--role-designer))',
```

- [ ] **Step 3: Crear el helper `lib/utils/role.ts`**

Tipo `Role` local (autónomo, sin depender del orden de fases):

```ts
export type Role = 'ADMIN' | 'DESIGNER';

/** Etiqueta de cara al usuario. */
export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Mánager',
  DESIGNER: 'Diseñador',
};

/** Clases de color por rol — literales completos para que Tailwind las detecte. */
export const ROLE_ACCENT: Record<Role, string> = {
  ADMIN: 'bg-primary/15 text-primary',
  DESIGNER: 'bg-role-designer/15 text-role-designer',
};
```

- [ ] **Step 4: Aplicar color de rol en `members-panel.tsx` (tarjeta)**

En la tarjeta de miembro, el avatar (líneas 158-165) usa hoy:
`admin ? 'bg-primary/15 text-primary' : 'bg-muted text-foreground'`.
Reemplazar por el accent de rol. Importar el helper al principio del fichero:

```tsx
import { ROLE_ACCENT } from '@/lib/utils/role';
```

Avatar de la tarjeta (línea 158-165) → cambiar la expresión condicional del `cn`:

```tsx
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full font-mono text-base font-semibold',
                  ROLE_ACCENT[m.role]
                )}
              >
                {getInitial(m.full_name)}
              </div>
```

Pill de rol de la tarjeta (líneas 172-179) → cambiar:

```tsx
              <span
                className={cn(
                  'mt-3 inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
                  ROLE_ACCENT[m.role]
                )}
              >
                {ROLE_LABELS[m.role]}
              </span>
```

- [ ] **Step 5: Aplicar color de rol en `members-panel.tsx` (popup)**

Avatar del popup (líneas 225-232) → cambiar la condicional por `ROLE_ACCENT[member.role]`:

```tsx
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-full font-mono text-base font-semibold',
                      ROLE_ACCENT[member.role]
                    )}
                  >
                    {getInitial(member.full_name)}
                  </div>
```

Pill de rol del popup (líneas 254-263) → cambiar la condicional por `ROLE_ACCENT[member.role]`:

```tsx
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                        ROLE_ACCENT[member.role]
                      )}
                    >
                      {ROLE_LABELS[member.role]}
                    </span>
```

- [ ] **Step 6: Aplicar color de rol al avatar de diseñador en `designs-table.tsx`**

En la celda "Diseñador" (líneas ~317-319), el chip del avatar usa hoy
`bg-primary/10 text-primary`. Como esa columna siempre muestra diseñadores,
cambiar a azul:

```tsx
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-role-designer/15 text-xs font-medium text-role-designer">
                          {designer.name.charAt(0)}
                        </div>
```

- [ ] **Step 7: Verificar**

Run: `npm run type-check && npm run lint`
Expected: sin errores ni warnings.

- [ ] **Step 8: Build (cierre de fase 1)**

Run: `npm run build`
Expected: build correcto (las clases `bg-role-designer/15` y `text-role-designer` compilan).

- [ ] **Step 9: Commit**

```bash
git add app/globals.css tailwind.config.ts lib/utils/role.ts components/features/account/members-panel.tsx components/features/designs/designs-table.tsx
git commit -m "feat(roles): color por rol (Diseñador azul / Mánager dorado) con token y helper"
```

---

## Fase 2 — Limpieza de Miembros / invitaciones

### Task 3: Invitaciones caducan en 24h

**Files:**
- Modify: `components/invitations/create-invitation-dialog.tsx:61-63, 139`

- [ ] **Step 1: Cambiar el cálculo de caducidad**

Reemplazar (líneas 61-63):

```tsx
      // Fixed: 7 days expiration, 1 use
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
```

por:

```tsx
      // Caducidad corta: 24h, 1 uso (evita invitaciones "flotando")
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
```

- [ ] **Step 2: Cambiar el texto de la descripción**

En la línea 139, reemplazar:

```tsx
              : 'La invitación expira en 7 días y es de un solo uso.'}
```

por:

```tsx
              : 'La invitación expira en 24 horas y es de un solo uso.'}
```

- [ ] **Step 3: Verificar**

Run: `npm run type-check && npm run lint`
Expected: sin errores ni warnings.

- [ ] **Step 4: Commit**

```bash
git add components/invitations/create-invitation-dialog.tsx
git commit -m "feat(invitaciones): caducidad de 24h en lugar de 7 días"
```

---

### Task 4: Quitar la lista "Invitaciones pendientes"

**Files:**
- Modify: `components/features/account/members-panel.tsx` (import, destructure, render)
- Delete: `components/features/users/invitations-card.tsx`

- [ ] **Step 1: Quitar el render del `InvitationsCard`**

En `members-panel.tsx`, eliminar el bloque (líneas 194-196):

```tsx
      <motion.div variants={rise}>
        <InvitationsCard invitations={invitations} onMutate={mutate} />
      </motion.div>
```

- [ ] **Step 2: Quitar el import**

En `members-panel.tsx`, eliminar la línea 25:

```tsx
import { InvitationsCard } from '@/components/features/users/invitations-card';
```

- [ ] **Step 3: Dejar de desestructurar `invitations`**

En `members-panel.tsx`, línea 44, cambiar:

```tsx
  const { users, invitations, mutate } = useUsersData();
```

por:

```tsx
  const { users, mutate } = useUsersData();
```

- [ ] **Step 4: Borrar el componente**

```bash
git rm components/features/users/invitations-card.tsx
```

- [ ] **Step 5: Verificar**

Run: `npm run type-check && npm run lint`
Expected: sin errores ni warnings (confirma que `invitations` ya no se usa en ningún sitio del panel).

- [ ] **Step 6: Commit**

```bash
git add components/features/account/members-panel.tsx
git commit -m "feat(miembros): eliminar la lista de invitaciones pendientes (se mantiene invitar)"
```

---

### Task 5: Fecha de alta — fuera de la tarjeta, "Se unió el DD/MM/YYYY" en el popup

**Files:**
- Modify: `components/features/account/members-panel.tsx` (imports, tarjeta línea ~169-171, popup línea ~264)

- [ ] **Step 1: Cambiar los imports de date-fns**

En `members-panel.tsx`, líneas 17-18, reemplazar:

```tsx
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
```

por:

```tsx
import { format } from 'date-fns';
```

- [ ] **Step 2: Quitar "Desde…" de la tarjeta**

En la tarjeta de miembro, eliminar las líneas 169-171:

```tsx
              <p className="truncate font-mono text-xs text-muted-foreground">
                Desde {formatDistanceToNow(new Date(m.created_at), { locale: es, addSuffix: true })}
              </p>
```

(La tarjeta queda: avatar → nombre → pill de rol, sin la línea de fecha.)

- [ ] **Step 3: "Se unió el DD/MM/YYYY" en el popup**

En el popup, línea 264, reemplazar:

```tsx
                    Desde {formatDistanceToNow(new Date(member.created_at), { locale: es, addSuffix: true })}
```

por:

```tsx
                    Se unió el {format(new Date(member.created_at), 'dd/MM/yyyy')}
```

- [ ] **Step 4: Verificar**

Run: `npm run type-check && npm run lint`
Expected: sin errores ni warnings (`formatDistanceToNow` y `es` ya no se importan ni usan).

- [ ] **Step 5: Build (cierre de fase 2)**

Run: `npm run build`
Expected: build correcto.

- [ ] **Step 6: Commit**

```bash
git add components/features/account/members-panel.tsx
git commit -m "feat(miembros): fecha de alta solo en el popup como 'Se unió el DD/MM/YYYY'"
```

---

## Fase 3 — Motor "Ver como" + gate de dev

### Task 6: Allowlist de cuentas dev

**Files:**
- Create: `lib/auth/dev-accounts.ts`

- [ ] **Step 1: Crear el módulo**

```ts
/**
 * Cuentas developer — pueden ver la app como Mánager o Diseñador (preview visual).
 * El gate es COSMÉTICO: el backend sigue exigiendo ADMIN real. No tiene
 * implicación de seguridad. Para añadir devs, ampliar la lista.
 */
export const DEV_EMAILS: readonly string[] = ['mariorodpz@gmail.com'];

export function isDevAccount(email: string | null | undefined): boolean {
  if (!email) return false;
  return DEV_EMAILS.includes(email.toLowerCase());
}
```

- [ ] **Step 2: Verificar + commit**

Run: `npm run type-check`
Expected: sin errores.

```bash
git add lib/auth/dev-accounts.ts
git commit -m "feat(dev): allowlist de cuentas developer por email"
```

---

### Task 7: Exportar `AuthContext` y el tipo `Profile`

**Files:**
- Modify: `lib/auth/auth-context.tsx:14, 39`

- [ ] **Step 1: Exportar el tipo `Profile`**

En la línea 14, cambiar:

```tsx
interface Profile {
```

por:

```tsx
export interface Profile {
```

- [ ] **Step 2: Exportar el `AuthContext`**

En la línea 39, cambiar:

```tsx
const AuthContext = createContext<AuthContextType>({
```

por:

```tsx
export const AuthContext = createContext<AuthContextType>({
```

- [ ] **Step 3: Verificar + commit**

Run: `npm run type-check && npm run lint`
Expected: sin errores ni warnings.

```bash
git add lib/auth/auth-context.tsx
git commit -m "refactor(auth): exportar AuthContext y Profile para el ViewAsProvider"
```

---

### Task 8: `ViewAsProvider` + `useViewAs` y montaje

**Files:**
- Create: `lib/auth/view-as-context.tsx`
- Modify: `app/(dashboard)/layout.tsx`

- [ ] **Step 1: Crear el provider**

`lib/auth/view-as-context.tsx`:

```tsx
'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { AuthContext, useAuth, type Profile } from '@/lib/auth/auth-context';
import { isDevAccount } from '@/lib/auth/dev-accounts';

const STORAGE_KEY = 'phsport:view-as';

interface ViewAsState {
  mode: 'real' | 'designer';
  designerId: string | null;
  designerName: string | null;
}

interface ViewAsContextValue {
  /** La cuenta real es dev (email en allowlist) y su rol real es ADMIN. */
  isDev: boolean;
  /** Hay una simulación de diseñador activa. */
  simulating: boolean;
  simulatedDesignerId: string | null;
  simulatedDesignerName: string | null;
  enterDesignerView: (designerId: string, designerName: string) => void;
  exitToManager: () => void;
  /** Identidad REAL (para el menú de cuenta y la píldora). */
  realName: string | null;
  realEmail: string | null;
  realRole: Profile['role'] | null;
}

const ViewAsContext = createContext<ViewAsContextValue>({
  isDev: false,
  simulating: false,
  simulatedDesignerId: null,
  simulatedDesignerName: null,
  enterDesignerView: () => {},
  exitToManager: () => {},
  realName: null,
  realEmail: null,
  realRole: null,
});

export function ViewAsProvider({ children }: { children: React.ReactNode }) {
  // useAuth() aquí resuelve al AuthProvider de la raíz => identidad REAL.
  const auth = useAuth();
  const realUser = auth.user;
  const realProfile = auth.profile;

  const isDev = isDevAccount(realUser?.email) && realProfile?.role === 'ADMIN';

  const [state, setState] = useState<ViewAsState>({
    mode: 'real',
    designerId: null,
    designerName: null,
  });

  // Cargar estado persistido (solo cliente, tras montar para evitar mismatch SSR).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ViewAsState;
      if (parsed && (parsed.mode === 'real' || parsed.mode === 'designer')) {
        setState(parsed);
      }
    } catch {
      // storage corrupto: ignorar
    }
  }, []);

  // Persistir cambios.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const enterDesignerView = useCallback((designerId: string, designerName: string) => {
    setState({ mode: 'designer', designerId, designerName });
  }, []);

  const exitToManager = useCallback(() => {
    setState({ mode: 'real', designerId: null, designerName: null });
  }, []);

  // Solo dev+admin puede simular; en cualquier otro caso, identidad real.
  const simulating = isDev && state.mode === 'designer' && !!state.designerId;

  // Identidad EFECTIVA inyectada en el AuthContext para todos los consumidores.
  const effectiveAuth = useMemo(() => {
    if (!simulating || !realUser) return auth;
    return {
      ...auth,
      user: { ...realUser, id: state.designerId! },
      profile: {
        id: state.designerId!,
        full_name: state.designerName ?? 'Diseñador',
        role: 'DESIGNER' as const,
        avatar_url: undefined,
      } satisfies Profile,
    };
  }, [auth, simulating, realUser, state.designerId, state.designerName]);

  const viewAsValue = useMemo<ViewAsContextValue>(
    () => ({
      isDev,
      simulating,
      simulatedDesignerId: simulating ? state.designerId : null,
      simulatedDesignerName: simulating ? state.designerName : null,
      enterDesignerView,
      exitToManager,
      realName: realProfile?.full_name ?? null,
      realEmail: realUser?.email ?? null,
      realRole: realProfile?.role ?? null,
    }),
    [
      isDev,
      simulating,
      state.designerId,
      state.designerName,
      enterDesignerView,
      exitToManager,
      realProfile?.full_name,
      realProfile?.role,
      realUser?.email,
    ]
  );

  return (
    <AuthContext.Provider value={effectiveAuth}>
      <ViewAsContext.Provider value={viewAsValue}>{children}</ViewAsContext.Provider>
    </AuthContext.Provider>
  );
}

export const useViewAs = () => useContext(ViewAsContext);
```

- [ ] **Step 2: Montar el provider en el layout del dashboard**

`app/(dashboard)/layout.tsx` completo:

```tsx
import { AppLayout } from '@/components/layout/app-layout';
import { ViewAsProvider } from '@/lib/auth/view-as-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewAsProvider>
      <AppLayout>{children}</AppLayout>
    </ViewAsProvider>
  );
}
```

- [ ] **Step 3: Verificar**

Run: `npm run type-check && npm run lint`
Expected: sin errores ni warnings.

- [ ] **Step 4: Build (cierre de fase 3)**

Run: `npm run build`
Expected: build correcto. (Sin simulación activa, el comportamiento es idéntico al actual.)

- [ ] **Step 5: Commit**

```bash
git add lib/auth/view-as-context.tsx "app/(dashboard)/layout.tsx"
git commit -m "feat(dev): ViewAsProvider (identidad efectiva en useAuth, gate dev, persistencia)"
```

---

## Fase 4 — Conmutador en el menú + píldora de rol

### Task 9: Sección "Ver como" en el menú de cuenta + identidad real

**Files:**
- Create: `components/layout/view-as-menu-section.tsx`
- Modify: `components/layout/user-menu.tsx`

- [ ] **Step 1: Crear la sección "Ver como" (dev only)**

`components/layout/view-as-menu-section.tsx`:

```tsx
'use client';

import { Check, Crown, UserCog } from 'lucide-react';
import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useViewAs } from '@/lib/auth/view-as-context';
import { useDesigners } from '@/lib/hooks/use-designers';

/**
 * Sección "Ver como" del menú de cuenta. Solo se RENDERIZA para cuentas dev,
 * por lo que useDesigners() solo se ejecuta para el dev (no para usuarios normales).
 */
export function ViewAsMenuSection() {
  const { simulating, simulatedDesignerId, enterDesignerView, exitToManager } = useViewAs();
  const { designers } = useDesigners();

  return (
    <>
      <DropdownMenuSeparator className="bg-border" />
      <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Ver como
      </DropdownMenuLabel>
      <DropdownMenuItem
        onClick={exitToManager}
        className="cursor-pointer text-foreground hover:bg-accent"
      >
        <Crown className="mr-2 h-4 w-4 text-primary" />
        <span className="flex-1">Mánager</span>
        {!simulating && <Check className="h-4 w-4 text-primary" />}
      </DropdownMenuItem>
      {designers.map((d) => (
        <DropdownMenuItem
          key={d.id}
          onClick={() => enterDesignerView(d.id, d.name)}
          className="cursor-pointer text-foreground hover:bg-accent"
        >
          <UserCog className="mr-2 h-4 w-4 text-role-designer" />
          <span className="flex-1 truncate">{d.name}</span>
          {simulating && simulatedDesignerId === d.id && (
            <Check className="h-4 w-4 text-role-designer" />
          )}
        </DropdownMenuItem>
      ))}
    </>
  );
}
```

- [ ] **Step 2: Usar identidad REAL en `user-menu.tsx` y montar la sección**

Reemplazar el contenido de `components/layout/user-menu.tsx` por:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, Users } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/lib/auth/auth-context';
import { useViewAs } from '@/lib/auth/view-as-context';
import { ROLE_LABEL, ROLE_ACCENT } from '@/lib/utils/role';
import { ViewAsMenuSection } from './view-as-menu-section';
import { cn } from '@/lib/utils';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function UserMenu() {
  const router = useRouter();
  // status/logout/profile.role(efectivo) de useAuth; identidad REAL de useViewAs.
  const { status, logout, profile } = useAuth();
  const { isDev, realName, realEmail, realRole } = useViewAs();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogout = async () => {
    setLogoutDialogOpen(false);
    await logout();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push('/login');
    router.refresh();
  };

  const authLoading = status === 'INITIALIZING';

  if (authLoading) {
    return <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />;
  }

  if (!realEmail) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm">
        ?
      </div>
    );
  }

  const displayName = realName || realEmail.split('@')[0] || 'User';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Menú de usuario — ${displayName}`}
          className="rounded-full outline-none ring-primary/40 transition-shadow hover:ring-2 focus-visible:ring-2"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border border-border bg-popover text-popover-foreground shadow-xl">
        <DropdownMenuLabel className="text-foreground">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{realEmail}</p>
            {realRole && (
              <span
                className={cn(
                  'mt-1 inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                  ROLE_ACCENT[realRole]
                )}
              >
                {ROLE_LABEL[realRole]}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem
          onClick={() => router.push('/ajustes')}
          className="text-foreground hover:bg-accent cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Ajustes</span>
        </DropdownMenuItem>
        {profile?.role === 'ADMIN' && (
          <DropdownMenuItem
            onClick={() => router.push('/ajustes?tab=miembros')}
            className="text-foreground hover:bg-accent cursor-pointer"
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Miembros</span>
          </DropdownMenuItem>
        )}

        {isDev && <ViewAsMenuSection />}

        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          onClick={() => setLogoutDialogOpen(true)}
          className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>

      <ConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        title="¿Cerrar sesión?"
        description="Tendrás que volver a iniciar sesión para acceder a la aplicación."
        confirmLabel="Cerrar Sesión"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={handleLogout}
        customIcon="/images/logo-ph-sport.svg"
      />
    </DropdownMenu>
  );
}
```

> Nota de diseño: el avatar y la cabecera del menú muestran la identidad **real**
> (es tu cuenta). El item "Miembros" sigue gateado por el rol **efectivo**
> (`profile?.role` de `useAuth`), de modo que mientras simulas Diseñador se oculta
> — coherente con la experiencia de diseñador y con la página de Ajustes. La
> sección "Ver como" se muestra siempre al dev (gate por email real).

- [ ] **Step 3: Verificar**

Run: `npm run type-check && npm run lint`
Expected: sin errores ni warnings.

- [ ] **Step 4: Commit**

```bash
git add components/layout/view-as-menu-section.tsx components/layout/user-menu.tsx
git commit -m "feat(dev): sección 'Ver como' en el menú de cuenta + identidad real"
```

---

### Task 10: Píldora de rol persistente en el header

**Files:**
- Create: `components/layout/role-pill.tsx`
- Modify: `components/layout/header.tsx`

- [ ] **Step 1: Crear la píldora**

`components/layout/role-pill.tsx`:

```tsx
'use client';

import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';
import { useViewAs } from '@/lib/auth/view-as-context';
import { ROLE_LABEL, ROLE_ACCENT } from '@/lib/utils/role';

/**
 * Píldora de rol siempre visible:
 * - Usuario normal: su rol con su color (Mánager dorado / Diseñador azul).
 * - Dev simulando: indicador azul "Viendo como Diseñador · X" que revierte al clic.
 */
export function RolePill() {
  const { status, profile } = useAuth(); // rol EFECTIVO
  const { simulating, simulatedDesignerName, exitToManager } = useViewAs();

  if (status !== 'AUTHENTICATED' || !profile) return null;

  if (simulating) {
    return (
      <button
        type="button"
        onClick={exitToManager}
        title="Volver a Mánager"
        className="flex items-center gap-1.5 rounded-full bg-role-designer/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-role-designer transition-colors hover:bg-role-designer/25"
      >
        <Eye className="h-3 w-3" />
        <span className="hidden sm:inline">Viendo como </span>
        Diseñador · {simulatedDesignerName}
      </button>
    );
  }

  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
        ROLE_ACCENT[profile.role]
      )}
    >
      {ROLE_LABEL[profile.role]}
    </span>
  );
}
```

- [ ] **Step 2: Renderizar la píldora en el header**

En `components/layout/header.tsx`, añadir el import:

```tsx
import { RolePill } from './role-pill';
```

Y en el cluster derecho (líneas 44-48), insertar `<RolePill />` antes del `ThemeToggle`:

```tsx
        <div className="flex items-center gap-2">
          <RolePill />
          <ThemeToggle />
          <NotificationsDropdown />
          <UserMenu />
        </div>
```

(Se cambia `gap-1` por `gap-2` para dar aire a la píldora.)

- [ ] **Step 3: Verificar**

Run: `npm run type-check && npm run lint`
Expected: sin errores ni warnings.

- [ ] **Step 4: Commit**

```bash
git add components/layout/role-pill.tsx components/layout/header.tsx
git commit -m "feat(roles): píldora de rol persistente en el header (indicador 'Ver como' al simular)"
```

---

### Task 11: Verificación final (build + smoke test manual)

**Files:** ninguno (verificación).

- [ ] **Step 1: Build completo**

Run: `npm run build`
Expected: build correcto, 16/16 páginas.

- [ ] **Step 2: Smoke test manual — requiere la cuenta dev**

> Precondición (la hace el usuario): existe la cuenta `mariorodpz@gmail.com`
> con rol **Mánager/ADMIN** en Supabase.

Run: `npm run dev` y, logueado como la cuenta dev, comprobar:

1. **Píldora:** en el header se ve "MÁNAGER" en dorado.
2. **Menú → Ver como → [un diseñador]:** la sidebar pasa a mostrar "Semana"
   apuntando a `/mi-semana`; `/inicio` muestra el `DesignerDashboard` con los
   datos de ese diseñador; `/mi-semana` muestra SU cola. La píldora cambia a
   azul "Viendo como Diseñador · [nombre]".
3. **Volver:** clic en la píldora (o Menú → Ver como → Mánager) restaura la
   vista de Mánager.
4. **Persistencia:** recargar con una simulación activa la mantiene.
5. **Permisos intactos:** estando en modo Diseñador, las operaciones siguen
   funcionando (la cuenta es ADMIN real por debajo); ninguna API devuelve 403
   por el conmutador.
6. **Usuario normal:** con una cuenta no-dev, no aparece "Ver como"; la píldora
   muestra su rol real (Diseñador en azul / Mánager en dorado).

- [ ] **Step 3: (Si todo correcto) marcar la feature como lista**

Sin commit adicional (la verificación no cambia código). Reportar resultado.

---

## Notas de integración / cierre

- **Push/merge a origin:** queda como decisión aparte del usuario (no se pushea
  automáticamente). Todo el trabajo va a `main` local.
- **Pendientes del roadmap no incluidos aquí:** desplegar `admin-delete-user`,
  Leaked Password Protection, y la creación real de la cuenta dev (setup manual).
- **Punto técnico resuelto en diseño:** `/mi-semana` (`useMyWeek`) usa
  `useAuth().user.id` como `designerId` en la llamada a `/api/designs`, y
  `/inicio` (`DesignerDashboard`) filtra por `userId`. Al devolver `useAuth()` la
  identidad efectiva, ambos muestran los datos del diseñador impersonado sin
  tocar backend. Verificado en el smoke test (Task 11, paso 2).
