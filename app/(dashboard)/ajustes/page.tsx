'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Settings, Save, Loader2 } from 'lucide-react';
import { DashboardPage } from '@/components/ui/dashboard-page';
import { Button } from '@/components/ui/button';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';
import { useUserPreferences } from '@/lib/hooks/use-user-preferences';
import { AccountTab } from '@/components/features/account/account-tab';
import { NotificationsTab } from '@/components/features/account/notifications-tab';
import { AppearanceTab } from '@/components/features/account/appearance-tab';
import { MembersPanel } from '@/components/features/account/members-panel';
import { PageTransition } from '@/components/ui/page-transition';
import { SettingsSkeleton } from '@/components/skeletons/settings-skeleton';

type Tab = 'general' | 'miembros';

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

/** Subapartado del concepto D: rótulo eyebrow + descripción, placa debajo. */
function Section({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="font-mono text-eyebrow uppercase text-primary">{label}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
      <div className="mt-3 rounded-2xl border border-border bg-card p-lg shadow-raised">
        {children}
      </div>
    </section>
  );
}

function SettingsContent() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'ADMIN';
  const searchParams = useSearchParams();
  const initialTab: Tab = isAdmin && searchParams.get('tab') === 'miembros' ? 'miembros' : 'general';
  const [tab, setTab] = useState<Tab>(initialTab);

  const {
    givenName,
    setGivenName,
    familyName,
    setFamilyName,
    alias,
    setAlias,
    defaultView,
    setDefaultView,
    preferences,
    togglePreference,
    saving,
    uploading,
    loading,
    save,
    uploadAvatar,
  } = useUserPreferences();

  const tabs: { id: Tab; label: string }[] = isAdmin
    ? [
        { id: 'general', label: 'General' },
        { id: 'miembros', label: 'Miembros' },
      ]
    : [{ id: 'general', label: 'General' }];

  const activeTab: Tab = isAdmin ? tab : 'general';

  return (
    <PageTransition
      loading={loading}
      skeleton={<SettingsSkeleton isAdmin={isAdmin} />}
      variant="fadeSlide"
    >
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: STAGGER } } }}
        className="space-y-4"
      >
      {isAdmin && (
        <motion.div
          variants={rise}
          className="inline-flex items-center gap-0.5 rounded-xl border border-border bg-card p-1 shadow-raised"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'h-8 rounded-lg px-3.5 text-xs font-medium transition-colors',
                activeTab === t.id
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </motion.div>
      )}

      {activeTab === 'general' ? (
        <motion.div variants={rise} className="max-w-2xl space-y-xl pb-xl">
          <Section label="Cuenta" hint="Tu nombre y datos de acceso">
            <AccountTab
              givenName={givenName}
              onGivenNameChange={setGivenName}
              familyName={familyName}
              onFamilyNameChange={setFamilyName}
              alias={alias}
              onAliasChange={setAlias}
              email={user?.email}
              role={profile?.role}
              avatarUrl={profile?.avatar_url}
              uploading={uploading}
              onAvatarConfirm={uploadAvatar}
            />
          </Section>

          <Section label="Apariencia" hint="Cómo se ve la app en este dispositivo">
            <AppearanceTab defaultView={defaultView} onDefaultViewChange={setDefaultView} />
          </Section>

          <Section label="Notificaciones" hint="Qué te avisa la app y por dónde">
            <NotificationsTab preferences={preferences} onToggle={togglePreference} />
          </Section>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} className="min-w-[150px]">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </Button>
          </div>
        </motion.div>
      ) : (
        <MembersPanel />
      )}
      </motion.div>
    </PageTransition>
  );
}

export default function SettingsPage() {
  return (
    <DashboardPage
      title="Ajustes"
      icon={Settings}
      subtitle="Tu cuenta, apariencia, notificaciones y la gestión del equipo"
      maxWidth="4xl"
      loading={false}
      skeleton={null}
    >
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </DashboardPage>
  );
}
