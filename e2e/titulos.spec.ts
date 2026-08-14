import { test, expect } from '@playwright/test';
import { RUTA_SESION } from './sesion-ruta';

/**
 * El título de cada página, en reposo y desplazado.
 *
 * La cabecera es compartida por todas las pantallas, así que un ajuste en ella
 * las toca todas a la vez. Esto recorre las cinco y deja constancia de dos cosas
 * que se han roto ya una vez:
 *   - que el título no se meta bajo la campana y el avatar,
 *   - que al desplazar, el rótulo de sección releve al título sin que se lean
 *     los dos a la vez.
 */

const haySesion = Boolean(process.env.PLAYWRIGHT_USER && process.env.PLAYWRIGHT_PASS);

const PAGINAS = [
  { ruta: '/inicio', seccion: 'Inicio' },
  { ruta: '/mi-semana', seccion: 'Mi semana' },
  { ruta: '/disenos', seccion: 'Diseños' },
  { ruta: '/equipo', seccion: 'Equipo' },
  { ruta: '/ajustes', seccion: 'Ajustes' },
];

test.describe('Títulos de página', () => {
  test.skip(!haySesion, 'Requiere sesión: define PLAYWRIGHT_USER y PLAYWRIGHT_PASS.');
  test.use({ storageState: haySesion ? RUTA_SESION : undefined });

  for (const { ruta, seccion } of PAGINAS) {
    test(`${seccion}: el título no se mete bajo los controles`, async ({ page, isMobile }) => {
      await page.goto(ruta);
      const titulo = page.locator('h1').first();
      await expect(titulo).toBeVisible();

      const caja = await titulo.boundingBox();
      expect(caja, 'sin caja para el título').not.toBeNull();

      if (!isMobile) return; // en escritorio la barra empuja y no hay solape posible

      // Los controles ocupan la esquina derecha de la barra. El título tiene que
      // terminar antes de que empiecen, o se pinta debajo de ellos.
      const controles = await page.getByRole('button', { name: /notificaciones/i }).boundingBox();
      expect(controles, 'sin caja para la campana').not.toBeNull();
      expect(
        caja!.x + caja!.width,
        `el título de ${seccion} invade la zona de la campana`
      ).toBeLessThanOrEqual(controles!.x);
    });
  }

  test('al desplazar, el rótulo releva al título sin solaparse', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'El relevo de título solo existe en móvil.');

    await page.goto('/inicio');
    const titulo = page.locator('h1').first();
    await expect(titulo).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 400));
    const rotulo = page.getByRole('banner').getByText('Inicio', { exact: true });
    await expect(rotulo).toBeVisible();

    // Con el rótulo ya visible, el título grande debe haber quedado por encima
    // del borde inferior de la barra, es decir, tapado por ella.
    const barra = await page.locator('header').boundingBox();
    const h1 = await titulo.boundingBox();
    expect(
      h1!.y + h1!.height,
      'el título asoma por debajo de la barra mientras el rótulo ya está puesto'
    ).toBeLessThanOrEqual(barra!.y + barra!.height + 1);
  });
});
