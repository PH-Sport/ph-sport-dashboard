import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

interface BulkDesign {
  title: string;
  player: string;
  match_home: string;
  match_away: string;
  deadline_at: string;
  designer_id?: string | null;
  player_status?: 'injured' | 'suspended' | 'doubt' | 'last_minute' | null;
  folder_url?: string;
}

interface BulkCreateRequest {
  designs: BulkDesign[];
}

export async function POST(request: Request) {
  const reqId = crypto.randomUUID();
  try {
    const body: BulkCreateRequest = await request.json();

    // Validar estructura básica
    if (!body.designs || !Array.isArray(body.designs)) {
      return NextResponse.json(
        { error: 'Formato inválido: se requiere designs[]' },
        { status: 400 }
      );
    }

    const { designs } = body;

    // Validar que haya al menos un diseño
    if (designs.length === 0) {
      return NextResponse.json(
        { error: 'Debe incluir al menos un diseño' },
        { status: 400 }
      );
    }

    // Validar campos por diseño (title ahora es opcional, fallback a player)
    const requiredFields = ['player', 'match_home', 'match_away', 'deadline_at'];
    for (let i = 0; i < designs.length; i++) {
      const d = designs[i];
      const missing = requiredFields.filter((f) => !d[f as keyof BulkDesign]);
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Diseño ${i + 1}: campos faltantes: ${missing.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validar fechas
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (let i = 0; i < designs.length; i++) {
      if (new Date(designs[i].deadline_at).getTime() < oneHourAgo) {
        return NextResponse.json(
          { error: `Diseño ${i + 1}: la fecha límite no puede ser anterior a hace 1 hora` },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();

    // Obtener usuario actual
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      logger.serverError('[API Bulk] Role check error', { reqId, userId: data.user.id, error: profileError });
      return NextResponse.json({ error: 'Error al verificar permisos' }, { status: 500 });
    }

    if (profile?.role !== 'ADMIN') {
      logger.serverError('[API Bulk] Forbidden attempt', { reqId, userId: data.user.id, role: profile?.role });
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }

    logger.serverInfo('[API Bulk] Attempt', {
      reqId,
      userId: data.user.id,
      count: designs.length,
      firstTitle: designs[0]?.title || designs[0]?.player || null,
      firstDeadline: designs[0]?.deadline_at || null,
    });

    // Obtener diseñadores y carga actual para asignación equitativa en lote
    const { data: designers, error: designersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'DESIGNER');

    if (designersError) {
      logger.serverError('[API Bulk] Error fetching designers', { reqId, error: designersError });
      return NextResponse.json({ error: 'Error al obtener diseñadores' }, { status: 500 });
    }

    const designerIds = (designers || []).map((d) => d.id);

    const { data: activeDesigns, error: designsError } = await supabase
      .from('designs')
      .select('id, designer_id')
      .neq('status', 'DELIVERED')
      .not('designer_id', 'is', null);

    if (designsError) {
      logger.serverError('[API Bulk] Error fetching active designs', { reqId, error: designsError });
      return NextResponse.json({ error: 'Error al obtener carga de diseñadores' }, { status: 500 });
    }

    const taskCounts = new Map<string, number>();
    designerIds.forEach((id) => taskCounts.set(id, 0));

    activeDesigns?.forEach((d) => {
      if (d.designer_id && taskCounts.has(d.designer_id)) {
        taskCounts.set(d.designer_id, (taskCounts.get(d.designer_id) || 0) + 1);
      }
    });

    let nextIndex = 0;
    const selectDesignerId = (): string | null => {
      if (designerIds.length === 0) return null;

      let minCount = Infinity;
      for (const id of designerIds) {
        const count = taskCounts.get(id) || 0;
        if (count < minCount) minCount = count;
      }

      let selectedIndex = -1;
      for (let i = 0; i < designerIds.length; i++) {
        const idx = (nextIndex + i) % designerIds.length;
        const id = designerIds[idx];
        if ((taskCounts.get(id) || 0) === minCount) {
          selectedIndex = idx;
          break;
        }
      }

      if (selectedIndex === -1) selectedIndex = 0;
      const selectedId = designerIds[selectedIndex];
      nextIndex = (selectedIndex + 1) % designerIds.length;
      return selectedId;
    };

    // Si hay más de 1 diseño, suprimimos notificaciones individuales y creamos una agregada
    const shouldAggregate = designs.length > 1;

    // Preparar inserts, asignando diseñador automáticamente si no se especifica
    const designsToInsert = designs.map((d) => {
      let designerId = d.designer_id;
      if (!designerId || designerId === 'auto') {
        designerId = selectDesignerId();
      }

      if (designerId && taskCounts.has(designerId)) {
        taskCounts.set(designerId, (taskCounts.get(designerId) || 0) + 1);
      }

      // Si no hay título, usar el nombre del jugador
      const title = d.title?.trim() || d.player;

      return {
        title,
        player: d.player,
        player_status: d.player_status || null,
        match_home: d.match_home,
        match_away: d.match_away,
        deadline_at: d.deadline_at,
        folder_url: d.folder_url || null,
        designer_id: designerId || null,
        created_by: data.user.id,
        status: 'BACKLOG' as const,
        // Solo suprimir notificación individual si vamos a agregar
        suppress_assignment_notification: shouldAggregate,
      };
    });

    // Insert batch
    const { data: createdDesigns, error } = await supabase
      .from('designs')
      .insert(designsToInsert)
      .select();

    if (error) {
      logger.serverError('[API Bulk] Insert failed', {
        reqId,
        userId: data.user.id,
        attemptedCount: designsToInsert.length,
        attemptedTitles: designsToInsert.map((d) => d.title),
        attemptedDeadlines: designsToInsert.map((d) => d.deadline_at),
        error,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const createdCount = createdDesigns?.length || 0;
    if (createdCount < designsToInsert.length) {
      logger.serverError('[API Bulk] Partial insert', {
        reqId,
        userId: data.user.id,
        attempted: designsToInsert.length,
        created: createdCount,
        missing: designsToInsert.length - createdCount,
      });
    }

    // Si hay múltiples diseños, crear notificación agregada por diseñador
    if (shouldAggregate && createdDesigns && createdDesigns.length > 0) {
      const designerMap = new Map<string, number>();

      createdDesigns.forEach((d) => {
        if (d.designer_id) {
          const currentCount = designerMap.get(d.designer_id) || 0;
          designerMap.set(d.designer_id, currentCount + 1);
        }
      });

      const notifications = [];
      for (const [designerId, count] of designerMap.entries()) {
        notifications.push({
          user_id: designerId,
          type: 'assignment',
          title: 'Nuevas asignaciones',
          message: `Se te han asignado ${count} nuevos diseños`,
          link: '/my-week',
          meta: {
            assignment_count: count,
          },
          read: false,
        });
      }

      if (notifications.length > 0) {
        const { error: notifError } = await supabase.from('notifications').insert(notifications);
        if (notifError) {
          logger.serverError('[API Bulk] Error sending notifications', { reqId, error: notifError });
        }
      }
    }

    logger.serverInfo('[API Bulk] Success', {
      reqId,
      userId: data.user.id,
      created: createdCount,
      requested: designs.length,
    });

    return NextResponse.json({
      created: createdCount,
      failed: designs.length - createdCount,
      designs: createdDesigns || [],
    }, { status: 201 });

  } catch (error) {
    logger.serverError('[API Bulk] Unhandled error', { reqId, error });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
