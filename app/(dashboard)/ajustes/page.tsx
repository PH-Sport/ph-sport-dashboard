'use client';

import { SettingsDialog } from '@/components/features/account/settings-dialog';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [open, setOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      router.back();
    }
  }, [open, router]);

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 max-w-4xl mx-auto">
      <SettingsDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
