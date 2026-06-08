/**
 * Fetcher común para hooks SWR que pegan a /api/*.
 *
 * - Lanza Error con mensaje del servidor si la respuesta no es ok.
 * - Devuelve la propiedad `items` cuando existe, o el body completo en otro caso,
 *   para que los hooks no tengan que hacer `.then((d) => d.items || [])` manual.
 */

interface ApiErrorBody {
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return body.error || body.message || `Error ${response.status}`;
  } catch {
    return `Error ${response.status}`;
  }
}

export async function apiFetcher<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
  return response.json() as Promise<T>;
}

/**
 * Variante específica para `/api/designs` que devuelve el array `items` directamente.
 * Los 3 hooks que pegan a este endpoint usan este fetcher.
 */
export async function designsFetcher<T = unknown>(url: string): Promise<T[]> {
  const data = await apiFetcher<{ items?: T[] }>(url);
  return data.items ?? [];
}
