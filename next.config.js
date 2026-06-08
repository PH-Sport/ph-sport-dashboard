/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  // Asegurar que no hay conflicto con Pages Router
  experimental: {
    // Desactivar cualquier experimental que pueda causar problemas
  },
  // Transpile packages if needed
  transpilePackages: [],
  async redirects() {
    return [
      { source: '/dashboard', destination: '/inicio', permanent: true },
      { source: '/dashboard/:path*', destination: '/inicio/:path*', permanent: true },
      { source: '/designs', destination: '/disenos', permanent: true },
      { source: '/designs/:path*', destination: '/disenos/:path*', permanent: true },
      { source: '/my-week', destination: '/mi-semana', permanent: true },
      { source: '/my-week/:path*', destination: '/mi-semana/:path*', permanent: true },
      { source: '/team', destination: '/equipo', permanent: true },
      { source: '/team/:path*', destination: '/equipo/:path*', permanent: true },
      { source: '/settings', destination: '/ajustes', permanent: true },
      { source: '/settings/:path*', destination: '/ajustes/:path*', permanent: true },
      { source: '/communications', destination: '/inicio', permanent: true },
      { source: '/communications/:path*', destination: '/inicio', permanent: true },
    ];
  },
};

module.exports = nextConfig;