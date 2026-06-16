import { redirect } from 'next/navigation';

/** Miembros vive ahora dentro de Ajustes (pestaña). Mantiene los enlaces antiguos. */
export default function UsuariosRedirect() {
  redirect('/ajustes?tab=miembros');
}
