'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { TRANSITIONS, animations } from '@/components/ui/animations';
import { Settings, Bell, Eye, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useUserPreferences } from '@/lib/hooks/use-user-preferences';
import { AccountTab } from './account-tab';
import { NotificationsTab } from './notifications-tab';
import { AppearanceTab } from './appearance-tab';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
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
  } = useUserPreferences({
    open,
    onSaved: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background border-border shadow-xl p-0 overflow-hidden">
        <motion.div
          layout
          transition={TRANSITIONS.layoutSpring}
          className="flex flex-col h-full"
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-border p-6 pb-4">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Configuración</h2>
          </div>

          <div className="p-6 pt-0">
            <Tabs defaultValue="account" className="w-full flex flex-col min-h-[400px]">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50">
                <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary">
                  <Settings className="h-4 w-4" />
                  Cuenta
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary">
                  <Bell className="h-4 w-4" />
                  Notificaciones
                </TabsTrigger>
                <TabsTrigger value="appearance" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-primary">
                  <Eye className="h-4 w-4" />
                  Apariencia
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto overflow-x-hidden -mx-1 px-1">
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
                      <NotificationsTab
                        preferences={preferences}
                        onToggle={togglePreference}
                      />
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
            </Tabs>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
                className="border-input hover:bg-accent hover:text-accent-foreground"
              >
                Cancelar
              </Button>
              <Button
                onClick={save}
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[100px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
