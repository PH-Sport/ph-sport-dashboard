# PHSPORT Dashboard

Dashboard para el equipo de diseño de PHSPORT.

## Características

### Gestión de Diseños

- **Vista principal**: Tabla con filtros avanzados
- **Estados de flujo**: Pendiente → Entregado
- **Asignación inteligente**: Algoritmo de reparto basado en carga de trabajo

### Comunicaciones

- **Chat en tiempo real**: Mensajería instantánea por diseño
- **Edición de mensajes**: Edita tus mensajes (límite 15 minutos)
- **Sincronización**: Actualizaciones en tiempo real entre usuarios
- **Indicadores**: Muestra "(editado)" en mensajes modificados

### Usuarios y Configuración

- **Roles**: Manager y Designer con permisos diferenciados
- **Perfil unificado**: Gestión de nombre, avatar y contraseña
- **Autenticación**: Sistema seguro vía Supabase Auth

### Actividad

- **Vista de actividad**: Seguimiento de conversaciones activas
- **Mensajes no leídos**: Indicadores visuales de nuevos mensajes

## Stack Tecnológico

- **Frontend**: Next.js 15, React 19, TypeScript
- **Estilos**: Tailwind CSS, Shadcn UI
- **Animaciones**: Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)

## Requisitos Previos

- Node.js 18+
- Cuenta de Supabase

## Configuración

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno en `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
4. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Scripts disponibles

| Comando              | Descripción                                |
| -------------------- | ------------------------------------------ |
| `npm run dev`        | Servidor de desarrollo en `localhost:3000` |
| `npm run build`      | Build de producción                        |
| `npm run start`      | Arranca el build generado                  |
| `npm run lint`       | Ejecuta ESLint                             |
| `npm run type-check` | Valida tipos TypeScript                    |

## Estructura del Proyecto

```
app/
  api/                    # API Routes (endpoints)
  dashboard/              # Vista Manager
  my-week/                # Vista Designer
  communications/         # Sistema de chat
  designs/                # Gestión de diseños
components/
  ui/                     # Componentes base (Shadcn)
  features/               # Componentes de negocio
    comments/             # Chat y comentarios
    account/              # Configuración de usuario
lib/
  supabase/               # Cliente y utilidades
  services/               # Lógica de negocio
  hooks/                  # Hooks de React
supabase/
  migrations/             # Migraciones SQL
```
