import { defineConfig, devices } from '@playwright/test';

/**
 * Matriz de navegadores de PHSPORT.
 *
 * LO QUE ESTO CUBRE Y LO QUE NO — léelo antes de fiarte de un verde:
 *
 * Playwright emula DISPOSITIVOS (viewport, densidad, táctil, user-agent), no
 * SISTEMAS OPERATIVOS ni sus versiones. Y trae una única build de cada motor:
 * hoy Chromium 151, Firefox 153 y WebKit 26.5. No existe un "WebKit de iOS 18"
 * que instalar, ni forma de pedir "Windows 10 en vez de 11".
 *
 * Consecuencias prácticas:
 *   - Windows 10 vs 11 y Android 14 vs 15 no cambian el render: es el mismo
 *     Chrome. Separarlos en proyectos daría cobertura falsa, así que no se hace.
 *   - `ios-safari` NO es Safari de iPhone. Es WebKit de escritorio con el
 *     viewport de un iPhone. Comparte motor de base, pero no el compositing de
 *     iOS, ni la barra dinámica del navegador, ni las safe-area reales. El fallo
 *     de la cabecera de agosto de 2026 —contenido colándose bajo la barra en un
 *     iPhone con iOS 18, correcto en Chrome— NO se reproduce aquí.
 *
 * Lo que sí atrapa, que no es poco: regresiones de maquetación, y divergencias
 * entre Blink, Gecko y WebKit, que es de donde salen la mayoría de sorpresas.
 * Para lo específico de iOS real hacen falta dispositivos o simuladores de
 * verdad; ver docs/testing-navegadores.md.
 */

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  // Las capturas de regresión visual se guardan junto a su test.
  snapshotPathTemplate: '{testDir}/__capturas__/{testFilePath}/{arg}-{projectName}{ext}',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['html', { open: 'never' }]],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Inicia sesión una vez y la deja en disco para el resto. Si no hay
    // credenciales en el entorno se salta, y los demás proyectos siguen
    // corriendo todo lo que no necesita estar dentro.
    { name: 'sesion', testMatch: /sesion\.setup\.ts/ },

    // ---- Escritorio ----
    // Windows 10 y 11 corren el mismo Chrome: un solo proyecto los cubre a los
    // dos. Lo que de verdad cambia entre ambos es la tipografía del sistema, y
    // eso se ve en las capturas, no en el motor.
    {
      name: 'windows-chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      dependencies: ['sesion'],
    },
    {
      name: 'macos-safari',
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } },
      dependencies: ['sesion'],
    },

    // ---- Móvil ----
    // El perfil de iPhone da tamaño, densidad y táctil; el motor es WebKit de
    // escritorio. Sirve para maquetación, no para juzgar comportamiento de iOS.
    {
      name: 'ios-safari-aprox',
      use: { ...devices['iPhone 15'] },
      dependencies: ['sesion'],
    },
    {
      name: 'android-chrome',
      use: { ...devices['Pixel 7'] },
      dependencies: ['sesion'],
    },
  ],

  // Se mide sobre el build de producción, nunca sobre `next dev`: en dev el
  // CSS y el JS van sin optimizar y las diferencias de pintado no son las reales.
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
