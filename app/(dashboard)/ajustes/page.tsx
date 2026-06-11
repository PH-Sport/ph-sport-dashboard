'use client';

import { Settings, Bell, Eye, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardPage } from '@/components/ui/dashboard-page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TRANSITIONS, animations } from '@/components/ui/animations';
import { useAuth } from '@/lib/auth/auth-context';
import { useUserPreferences } from '@/lib/hooks/use-user-preferences';
import { AccountTab } from '@/components/features/account/account-tab';
import { NotificationsTab } from '@/components/features/account/notifications-tab';
import { AppearanceTab } from '@/components/features/account/appearance-tab';

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const {
    name,
    setName,
    defaultView,
    setDefaultView,
    preferences,
    togglePreference,
    saving,
    uploading,
    save,
    uploadAvatar,
  } = useUserPreferences();

  return (
    <DashboardPage
      title="Ajustes"
      icon={Settings}
      subtitle="Tu cuenta, notificaciones y apariencia"
      maxWidth="4xl"
      loading={false}
      skeleton={null}
    >
      <Card>
        <CardContent>
          <Tabs defaultValue="account" className="flex w-full flex-col pt-lg">
            <TabsList className="mb-lg grid w-full grid-cols-3 bg-muted/50">
              <TabsTrigger value="account" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Cuenta
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notificaciones
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Apariencia
              </TabsTrigger>
            </TabsList>

            <div className="min-h-[320px]">
              <AnimatePresence mode="wait">
                <TabsContent value="account" className="mt-0 focus-visible:outline-none">
                  <motion.div
                    key="account"
                    initial={animations.slideHorizontal.initial}
                    animate={animations.slideHorizontal.animate}
                    exit={animations.slideHorizontal.exit}
                    transition={TRANSITIONS.fade}
                  >
                    <AccountTab
                      name={name}
                      onNameChange={setName}
                      email={user?.email}
                      role={profile?.role}
                      avatarUrl={profile?.avatar_url}
                      uploading={uploading}
                      onAvatarFile={uploadAvatar}
                    />
                  </motion.div>
                </TabsContent>

                <TabsContent value="notifications" className="mt-0 focus-visible:outline-none">
                  <motion.div
                    key="notifications"
                    initial={animations.slideHorizontal.initial}
                    animate={animations.slideHorizontal.animate}
                    exit={animations.slideHorizontal.exit}
                    transition={TRANSITIONS.fade}
                  >
                    <NotificationsTab preferences={preferences} onToggle={togglePreference} />
                  </motion.div>
                </TabsContent>

                <TabsContent value="appearance" className="mt-0 focus-visible:outline-none">
                  <motion.div
                    key="appearance"
                    initial={animations.slideHorizontal.initial}
                    animate={animations.slideHorizontal.animate}
                    exit={animations.slideHorizontal.exit}
                    transition={TRANSITIONS.fade}
                  >
                    <AppearanceTab
                      defaultView={defaultView}
                      onDefaultViewChange={setDefaultView}
                    />
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </div>

            <div className="mt-md flex justify-end border-t border-border pt-md">
              <Button onClick={save} disabled={saving} className="min-w-[140px]">
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
          </Tabs>
        </CardContent>
      </Card>
    </DashboardPage>
  );
}
