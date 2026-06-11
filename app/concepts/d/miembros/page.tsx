import { redirect } from 'next/navigation';

/** En el concepto D, Miembros vive dentro de Ajustes (gestión, no uso diario). */
export default function MiembrosRedirect() {
  redirect('/concepts/d/ajustes');
}
