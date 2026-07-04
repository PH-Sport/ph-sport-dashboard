import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { parseMessageSchema } from '@/lib/api/schemas';
import { validationErrorResponse, unauthorizedResponse } from '@/lib/api/errors';
import {
  PROPOSE_DESIGNS_TOOL,
  buildSystemPrompt,
  normalizeCandidate,
  type ParseDesigner,
  type RawModelDesign,
  type ParsedDesignCandidate,
} from '@/lib/services/designs/parse-message';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_DESIGNS = 20;

type ParseResponse =
  | { fallback: false; designs: ParsedDesignCandidate[] }
  | { fallback: true; reason: 'sin_api_key' | 'error_agente' };

interface AnthropicToolUseBlock {
  type: 'tool_use';
  name: string;
  input: unknown;
}

function isToolUseBlock(block: unknown): block is AnthropicToolUseBlock {
  return (
    !!block &&
    typeof block === 'object' &&
    (block as { type?: unknown }).type === 'tool_use' &&
    (block as { name?: unknown }).name === 'propose_designs'
  );
}

/**
 * Orquesta el agente de parseo (Fase 4, Task 2): auth → diseñadores →
 * llamada a Claude Haiku (salida forzada vía tool_use) → normalización.
 * Nunca persiste; solo devuelve candidatos para que el cliente los revise.
 * Cualquier fallo tras auth/validación cae a `{ fallback: true, reason }`
 * con 200 — el compositor del agente nunca debe ver un error de servidor.
 */
export async function POST(request: Request) {
  const reqId = crypto.randomUUID();
  const startedAt = Date.now();

  const rawBody = await request.json().catch(() => ({}));
  const parsed = parseMessageSchema.safeParse(rawBody);
  if (!parsed.success) return validationErrorResponse(parsed.error, reqId);
  const { message } = parsed.data;

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) return unauthorizedResponse();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logger.serverInfo('[API Parse] Sin ANTHROPIC_API_KEY, fallback', {
      reqId,
      userId: data.user.id,
    });
    return NextResponse.json<ParseResponse>(
      { fallback: true, reason: 'sin_api_key' },
      { status: 200 }
    );
  }

  try {
    const { data: designers, error: designersError } = await supabase
      .from('profiles')
      .select('id, display_name, full_name')
      .eq('role', 'DESIGNER');

    if (designersError) throw designersError;

    const parseDesigners: ParseDesigner[] = designers ?? [];
    const designerNames = parseDesigners
      .map((d) => d.display_name || d.full_name || '')
      .filter((name) => name.length > 0);

    const today = new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'full',
      timeZone: 'Europe/Madrid',
    }).format(new Date());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 1500,
          temperature: 0,
          system: buildSystemPrompt({ today, designerNames }),
          messages: [{ role: 'user', content: message }],
          tools: [PROPOSE_DESIGNS_TOOL],
          tool_choice: { type: 'tool', name: 'propose_designs' },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Anthropic API respondió ${response.status}: ${errorText.slice(0, 500)}`);
    }

    const payload: unknown = await response.json();
    const content = (payload as { content?: unknown })?.content;
    const toolUseBlock = Array.isArray(content) ? content.find(isToolUseBlock) : undefined;

    if (!toolUseBlock) {
      throw new Error('Respuesta del modelo sin bloque tool_use "propose_designs"');
    }

    const rawDesigns = (toolUseBlock.input as { designs?: unknown })?.designs;
    if (!Array.isArray(rawDesigns)) {
      throw new Error('"designs" no es un array en la respuesta del modelo');
    }

    const capped = rawDesigns.slice(0, MAX_DESIGNS) as RawModelDesign[];
    const now = new Date();
    const designsOut = capped.map((raw) => normalizeCandidate(raw, parseDesigners, now));

    logger.serverInfo('[API Parse] Success', {
      reqId,
      userId: data.user.id,
      count: designsOut.length,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json<ParseResponse>(
      { fallback: false, designs: designsOut },
      { status: 200 }
    );
  } catch (error) {
    logger.serverError('[API Parse] Fallback por error del agente', {
      reqId,
      userId: data.user.id,
      durationMs: Date.now() - startedAt,
      error,
    });
    return NextResponse.json<ParseResponse>(
      { fallback: true, reason: 'error_agente' },
      { status: 200 }
    );
  }
}
