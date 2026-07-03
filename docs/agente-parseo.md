# Agente de Parseo - POST /api/designs/parse

## Qué hace

El endpoint `POST /api/designs/parse` orquesta el agente de interpretación de mensajes (Fase 4, Task 2):

- **Entrada:** `{ message }` entre 1 y 4000 caracteres. Requiere autenticación.
- **Proceso:** Llama a Claude Haiku (`claude-haiku-4-5-20251001`) con salida forzada vía `tool_use`, normaliza candidatos.
- **Salida:** `{ fallback: false, designs: [...] }` con candidatos normalizados (campos: `type`, `player`, `match_home`, `match_away`, `deadline_at`, `designer_id`, `details`, `warnings`) **nunca persiste nada**. Las tarjetas se crean solo al confirmar en el diálogo del compositor.

## Configuración: ANTHROPIC_API_KEY

- **En desarrollo:** `.env.local` en la raíz del proyecto
  ```
  ANTHROPIC_API_KEY=sk-ant-...
  ```
- **En Vercel:** Settings → Environment Variables → marcar `Production` y `Preview` → agregar la key de [console.anthropic.com](https://console.anthropic.com)

## Comportamiento sin key / con error

Si falta `ANTHROPIC_API_KEY` o hay timeout (15s) / error del agente:

- El endpoint retorna `{ fallback: true, reason: "sin_api_key" | "error_agente" }` con HTTP 200 (nunca error 5xx).
- El compositor crea **UNA tarjeta** con el texto íntegro en el campo Detalles + chip de aviso `agente_no_disponible`.
- El usuario nunca ve un error de servidor; simplemente confirma o descarta la tarjeta.

## Cómo probarlo

1. En "Crear Diseños", pega un mensaje multilínea (WhatsApp, email, etc.) en la barra del agente.
2. Envía con **Ctrl/Cmd+Enter**.
3. Revisa las tarjetas propuestas:
   - Sello **Agente** en la esquina superior.
   - Chips de aviso (ej. `sin_diseñador_exacto`) si hay incidencias.
   - Campos rellenos: tipo, jugador(es), encuentro, plazo, etc.
4. **Confirma o descarta sin crear** (no ensuciar producción). Si no hay key: verás una tarjeta con todo en Detalles + aviso.

## Matching de diseñadores

- **Solo match exacto normalizado:** sin tildes ni mayúsculas contra el nombre (`display_name` o `full_name`) del diseñador.
- **Sin match:** asignación automática (round-robin o por peso) + chip de aviso `sin_diseñador_exacto`.
- **Con match:** `designer_id` se rellena automáticamente.

## Timeout y reintentos

El timeout está configurado en **15 segundos**. No hay reintentos automáticos; el cliente maneja la UX (mostrar fallback).
