import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import { RUTA_SESION } from './sesion.setup';

/**
 * La cabecera de móvil, que es donde más nos hemos tropezado.
 *
 * En agosto de 2026 la barra pasó a no reservar los 56px de su fila para que el
 * contenido subiera, y eso destapó dos fallos seguidos: el título grande se leía
 * a través de la barra al desplazar, y el contenido se colaba por debajo en
 * iPhone mientras en Chrome se veía correcto.
 *
 * Estos tests fijan el contrato que salió de aquello:
 *   1. En móvil la barra NO le roba altura al contenido.
 *   2. Cuando se recoge, tapa de verdad lo que le pasa por debajo.
 *
 * Aviso sobre el alcance: el proyecto `ios-safari-aprox` es WebKit de escritorio
 * con viewport de iPhone, no Safari de iOS. Estos tests habrían atrapado el
 * primer fallo (el fondo translúcido), pero NO el segundo, que dependía del
 * compositing real de iOS. Ver docs/testing-navegadores.md.
 */

const haySesion = fs.existsSync(RUTA_SESION);

/** Alpha del fondo calculado de un elemento. `rgb(...)` sin alpha cuenta como 1. */
async function alphaDelFondo(page: Page, selector: string): Promise<number> {
  return page.locator(selector).evaluate((el) => {
    const fondo = getComputedStyle(el).backgroundColor;
    const m = fondo.match(/rgba?\(([^)]+)\)/);
    if (!m) return 1;
    const partes = m[1].split(',').map((p) => parseFloat(p));
    return partes.length === 4 ? partes[3] : 1;
  });
}

test.describe('Cabecera móvil', () => {
  test.skip(!haySesion, 'Requiere sesión: define PLAYWRIGHT_USER y PLAYWRIGHT_PASS.');
  test.skip(({ isMobile }) => !isMobile, 'Solo aplica al viewport móvil.');
  test.use({ storageState: haySesion ? RUTA_SESION : undefined });

  test('la barra no le roba altura al contenido', async ({ page }) => {
    await page.goto('/inicio');
    const titulo = page.locator('h1').first();
    await expect(titulo).toBeVisible();

    const barra = await page.locator('header').boundingBox();
    const h1 = await titulo.boundingBox();
    expect(barra, 'no se encontró la barra').not.toBeNull();
    expect(h1, 'no se encontró el título').not.toBeNull();

    // El título arranca DENTRO de la franja que ocupa la barra: prueba de que
    // esta flota sobre el contenido en vez de empujarlo hacia abajo. Si alguien
    // devuelve el hueco, el título caería por debajo y esto salta.
    expect(h1!.y).toBeLessThan(barra!.y + barra!.height);
  });

  test('al recogerse, tapa lo que le pasa por debajo', async ({ page }) => {
    await page.goto('/inicio');
    await expect(page.locator('h1').first()).toBeVisible();

    // Desplazar lo justo para que el título grande cruce bajo la barra.
    await page.mouse.wheel(0, 400);
    // El rótulo de sección apareciendo es la señal de que ya se ha recogido.
    await expect(page.getByText('Inicio', { exact: true }).first()).toBeVisible();

    const alpha = await alphaDelFondo(page, 'header');
    // Prácticamente opaco. El 0.99 es deliberado (ver header.tsx): con alpha
    // clavado en 1, Safari 26 recorta la capa. Lo que no vale es translúcido de
    // verdad, que es lo que dejaba leer el título por debajo.
    expect(alpha).toBeGreaterThanOrEqual(0.99);
  });

  test('la cabecera se ve igual en todos los motores', async ({ page }) => {
    await page.goto('/inicio');
    await expect(page.locator('h1').first()).toBeVisible();
    // Los saludos rotan y las cifras cambian: la captura se compara contra la
    // línea base de SU MISMO proyecto, así que sirve para detectar que un motor
    // se desvía, no para comparar unos con otros.
    await expect(page.locator('header')).toHaveScreenshot('barra-en-reposo.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
