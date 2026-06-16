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
