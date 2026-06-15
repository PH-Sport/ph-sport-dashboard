import { redirect } from 'next/navigation';

/** La raíz redirige a /inicio en el servidor (sin flash de "Cargando…" ni hidratación). */
export default function HomePage() {
  redirect('/inicio');
}
