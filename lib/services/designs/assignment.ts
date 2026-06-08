import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { selectDesignerByLoad } from './select-designer';

/**
 * Asigna automáticamente un diseñador a UN diseño basándose en la carga actual.
 * Para asignaciones masivas, ver `assign/route.ts` o `bulk/route.ts` que mantienen
 * cursor entre llamadas para mejor distribución.
 *
 * @param excludeDesignId — id del diseño a excluir del conteo (útil al actualizar)
 */
export async function assignDesignerAutomatically(excludeDesignId?: string): Promise<string | null> {
  try {
    const supabase = await createClient();

    const { data: designers, error: designersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'DESIGNER');

    if (designersError) {
      logger.error('Error fetching designers for assignment:', designersError);
      return null;
    }

    if (!designers || designers.length === 0) {
      logger.warn('No designers found for assignment');
      return null;
    }

    const designerIds = designers.map((d) => d.id);

    const { data: activeDesigns, error: designsError } = await supabase
      .from('designs')
      .select('id, designer_id')
      .neq('status', 'DELIVERED')
      .not('designer_id', 'is', null);

    if (designsError) {
      logger.error('Error fetching active designs for assignment:', designsError);
      return null;
    }

    const taskCounts = new Map<string, number>();
    designerIds.forEach((id) => taskCounts.set(id, 0));

    activeDesigns?.forEach((d) => {
      if (d.designer_id && taskCounts.has(d.designer_id)) {
        if (excludeDesignId && d.id === excludeDesignId) return;
        taskCounts.set(d.designer_id, (taskCounts.get(d.designer_id) || 0) + 1);
      }
    });

    return selectDesignerByLoad(designerIds, taskCounts).id;
  } catch (error) {
    logger.error('Unexpected error in assignDesignerAutomatically:', error);
    return null;
  }
}
