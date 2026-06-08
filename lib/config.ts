/**
 * Client-side environment variables configuration
 *
 * Next.js replaces these at build time, so they're safe to use in browser.
 */

import { logger } from '@/lib/utils/logger';

export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
};

// Validar configuración crítica en desarrollo
if (!config.supabase.url || !config.supabase.anonKey) {
  logger.error('Faltan variables de entorno de Supabase (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)');
}
