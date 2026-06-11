'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { PageContainer } from './page-container';
import { PageHeader } from './page-header';
import { PageTransition } from './page-transition';

type MaxWidth = 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';

interface DashboardPageProps {
  /** Header title. */
  title: ReactNode;
  /** Optional Lucide icon shown next to the title. */
  icon?: LucideIcon;
  /** Optional subtitle/description. */
  subtitle?: ReactNode;
  /** Right-side header slot for actions. */
  actions?: ReactNode;
  /** Page body content. */
  children: ReactNode;
  /** Skeleton shown while `loading` is true. Required because each page has its own. */
  skeleton: ReactNode;
  /** Whether to render the skeleton instead of children. */
  loading: boolean;
  /** Container max-width. Default: '7xl'. */
  maxWidth?: MaxWidth;
}

export function DashboardPage({
  title,
  icon,
  subtitle,
  actions,
  children,
  skeleton,
  loading,
  maxWidth = '7xl',
}: DashboardPageProps) {
  return (
    <PageTransition loading={loading} skeleton={skeleton} variant="fadeSlide">
      <PageContainer maxWidth={maxWidth}>
        <PageHeader
          title={title}
          icon={icon}
          subtitle={subtitle}
          actions={actions}
        />
        {children}
      </PageContainer>
    </PageTransition>
  );
}
