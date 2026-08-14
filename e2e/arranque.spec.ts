import { test, expect } from '@playwright/test';

/**
 * Arranque de la app sin sesión. Corre en los cuatro proyectos y no necesita
 * credenciales, así que es la red mínima que siempre está activa: si un motor
 * revienta al cargar, salta aquí.
 */

test('el login carga y es usable', async ({ page }) => {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));

  await page.goto('/login');

  await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
  await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeEnabled();

  expect(errores, `errores de JS al cargar: ${errores.join(' | ')}`).toHaveLength(0);
});

test('la página no se desborda a lo ancho', async ({ page }) => {
  await page.goto('/login');
  // Un desborde horizontal en móvil se cuela con facilidad y se nota mucho.
  const desborde = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(desborde, 'la página tiene scroll horizontal').toBe(false);
});

test('la ruta protegida rebota al login', async ({ page }) => {
  await page.goto('/inicio');
  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
});
