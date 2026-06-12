'use client';

/**
 * Vista de desarrollador del CONCEPTO D: conmutar entre los dos roles reales
 * (Mánager / Diseñador) sin ocupar un puesto. En la app real esto será una
 * cuenta con flag de developer que no cuenta como miembro del equipo.
 */

import { createContext, useContext, useState } from 'react';

export type ConceptRole = 'manager' | 'designer';

const RoleContext = createContext<{
  role: ConceptRole;
  setRole: (r: ConceptRole) => void;
}>({ role: 'manager', setRole: () => {} });

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<ConceptRole>('manager');
  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

export const useRole = () => useContext(RoleContext);
