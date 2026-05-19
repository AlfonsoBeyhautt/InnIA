# Deploy CheckInn en Vercel + Supabase

## 1. Supabase

1. Crear proyecto en [Supabase](https://supabase.com).
2. En **SQL Editor**, ejecutar en orden:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_profiles_auth.sql`
   - `supabase/migrations/003_claim_demo_owner.sql`
   - `supabase/seed.sql` (opcional — propiedades base con owner demo legacy)
3. En **Authentication → Providers**, habilitar **Email** (password).
4. En **Authentication → URL Configuration**, añadir redirect:
   - `http://localhost:3000/auth/callback`
   - `https://tu-dominio.vercel.app/auth/callback`
5. Copiar **Project URL** y **anon key** (Settings → API).
6. Copiar **service_role key** (solo tareas admin; el CRUD usa la sesión del usuario y RLS con `auth.uid()`).

### Datos demo para tu cuenta

Tras iniciar sesión, la app ejecuta `POST /api/demo/bootstrap` y carga reservas, huéspedes, mensajes, tareas y notificaciones de demostración.

Si ya existía seed con el UUID legacy, la migración `003_claim_demo_owner.sql` reasigna esas filas a usuarios cuyo email contiene `alfonsobeyhaut`.

Para reclamar manualmente en SQL:

```sql
SELECT public.claim_checkinn_demo('tu@email.com');
```

## 2. Variables en Vercel

En el proyecto Vercel → **Settings → Environment Variables**:

| Variable | Entorno | Exponer al cliente |
|----------|---------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | **No** (opcional) |
| `OPENAI_API_KEY` | Production, Preview | **No** |

## 3. Deploy

```bash
npm run build
```

Conectar el repositorio a Vercel; el framework detecta Next.js automáticamente.

## 4. Sin Supabase (desarrollo local)

Sin variables configuradas, la UI sigue funcionando con **mock data** local. Las rutas `/api/*` responden `503` y los hooks usan fallback.

## 5. API principales

- `GET/POST /api/guests`
- `PATCH /api/guests/[id]`
- `GET/PATCH /api/properties/[id]`
- `GET/POST /api/reservations`
- `GET /api/conversations`
- `POST /api/conversations/[id]/messages`
- `POST /api/ai/process-message`
- `POST /api/integrations/sync`
- `GET/PATCH /api/notifications`
