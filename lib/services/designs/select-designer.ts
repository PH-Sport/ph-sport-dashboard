/**
 * Round-robin con prioridad por menor carga.
 *
 * Recibe el estado actual de cargas y un cursor (`startIndex`) para que
 * llamadas sucesivas distribuyan en empate, sin pegar siempre al mismo.
 *
 * El llamador es responsable de actualizar `loads` (incrementar el contador
 * del id devuelto) entre llamadas si quiere distribuir varios diseños
 * coherentemente en el mismo lote.
 */
export interface SelectionResult {
  /** Id del diseñador elegido, o null si no hay diseñadores. */
  id: string | null;
  /** Próximo cursor a pasar en la siguiente llamada del mismo lote. */
  nextIndex: number;
}

export function selectDesignerByLoad(
  designerIds: string[],
  loads: Map<string, number>,
  startIndex = 0
): SelectionResult {
  if (designerIds.length === 0) return { id: null, nextIndex: 0 };

  let minCount = Infinity;
  for (const id of designerIds) {
    const count = loads.get(id) ?? 0;
    if (count < minCount) minCount = count;
  }

  let selectedIndex = -1;
  for (let i = 0; i < designerIds.length; i++) {
    const idx = (startIndex + i) % designerIds.length;
    const id = designerIds[idx];
    if ((loads.get(id) ?? 0) === minCount) {
      selectedIndex = idx;
      break;
    }
  }

  if (selectedIndex === -1) selectedIndex = 0;
  const selectedId = designerIds[selectedIndex];

  return {
    id: selectedId,
    nextIndex: (selectedIndex + 1) % designerIds.length,
  };
}
