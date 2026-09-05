# FamilyPicks

App **privada y personal** de predicciones deportivas. No es un servicio público,
no tiene planes ni suscripciones: es un panel de un solo usuario (tú) para
registrar picks —sugeridos por IA o escritos a mano— y seguir tu propio
rendimiento (ROI, yield, bankroll, histórico).

Todo el sitio requiere iniciar sesión. Sin sesión de admin no se puede leer ni
escribir nada: la RLS de Supabase lo bloquea a nivel de base de datos, no solo
en la interfaz.

## Stack

- **Frontend:** React + Vite + TypeScript, React Router, CSS con tokens de diseño.
- **Backend:** Supabase (Postgres + Auth + RLS).
- **Deploy:** Vercel.

Sin `VITE_SUPABASE_URL` la app arranca en **modo demo** con datos de ejemplo
(`src/lib/mock.ts`) para poder desarrollar la interfaz sin backend.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc + vite build -> dist/
```

Copia `.env.example` a `.env.local` y rellena con tu proyecto Supabase para datos
reales (o usa el `.env` ya versionado del proyecto).

## Estructura

```
src/
  pages/        Home (redirección), Login (/entrar), Feed (picks), Stats,
                Results, Account
  pages/admin/  Dashboard, NewPick (publicar), AllPicks (+ liquidar / eliminar)
  components/   AppLayout, AdminLayout, PickCard, BankrollChart, SettleControl,
                AgeGate, ThemeToggle, Toast, bits
  lib/          supabase, api (fallback a mock), store (persistencia demo),
                auth (useIsAdmin), types, format
  context/      ThemeContext, AuthContext (sesión + perfil)
  styles/       tokens (3 estados de tema) + base + components

supabase/
  migrations/   esquema: tablas, RLS, triggers, RPCs de stats
  seed.sql      deportes de ejemplo

design-system/familypicks/
  MASTER.md         sistema de diseño original (algunas secciones —planes,
                     landing pública— quedaron obsoletas tras el pivote a app
                     privada; el código es la fuente de verdad actual)
  style-guide.html, screens/   mockups HTML históricos

docs/backend.md     modelo de datos y reglas de acceso (repasar tras el pivote)
```

## Cómo funciona

- **Un pick tiene un `source`:** `manual` (lo escribiste tú) o `ai` (te lo
  sugirió un asistente de IA y lo revisaste antes de publicarlo). Se marca al
  publicar en `/admin/nuevo`.
- **Nada es público.** RLS: solo la fila de `profiles` con `role = 'admin'`
  puede leer o escribir `picks`; el resto de roles no tiene ni siquiera
  permiso de tabla (`revoke ... from anon`).
- **Transparencia contigo mismo:** todo pick con cuota de registro y de cierre;
  todo KPI con periodo y tamaño de muestra — para que el ROI que veas sea real,
  no un promedio maquillado.

## Cuentas

`/entrar` — email + contraseña, login o registro. Supabase pide confirmación
por email por defecto: tras registrarte verás "revisa tu correo". `/cuenta`
muestra tu perfil si tienes sesión, o un aviso para entrar si no.

## Panel del tipster

`/admin` — resumen (con cola de picks por liquidar), publicar pick, liquidar
(acierto/fallo/nulo + cuota de cierre), listado completo. Gated por
`role = 'admin'` (en modo demo está siempre abierto y los cambios se guardan en
`localStorage`).

Para convertir tu cuenta en admin, en el SQL editor de Supabase:
```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'tu_email');
```

## Automatización de picks (IA)

Cada día, `/admin` puede generar picks automáticamente: busca hasta 10
partidos por deporte de las ligas/torneos principales que juegan hoy (fútbol,
baloncesto, tenis, fútbol americano), se queda solo con los que **Hard Rock
Bet** cotiza, y le pide a Claude que elija los mejores picks entre esas cuotas
reales. **No publica directo** — los deja en `/admin/candidatos` para que
apruebes o descartes uno por uno; aprobar copia el pick a tu tabla real con
`source = 'ai'`.

Piezas:
- `supabase/functions/generate-picks` — hace las llamadas a oddspapi.io y a la
  API de Claude, valida la respuesta contra las cuotas reales (nunca inserta
  algo que Claude "inventó") y guarda los candidatos.
- `pick_candidates` (tabla) + `approve_pick_candidate` / `dismiss_pick_candidate`
  (RPCs, solo admin) — la cola de revisión.
- Un cron diario (`pg_cron` + `pg_net`, migración
  `20260904160000_daily_picks_cron.sql`) llama a `generate-picks` a las 13:00
  UTC. También hay un botón "Generar ahora" en `/admin/candidatos` para
  correrlo manualmente.

**Dos cosas que tienes que configurar tú (yo nunca manejo estas claves):**

1. **`ANTHROPIC_API_KEY`** — Supabase → Project Settings → Edge Functions →
   Secrets. Es la key de la API de Claude que usa `generate-picks` para elegir
   los picks. Ya deberías tener `ODDS_API_KEY` puesta ahí desde antes; agrega
   esta al lado.
2. **Autenticación del cron** — para que `pg_cron` pueda llamar al edge
   function sin que tú estés logueado, necesita tu `service_role` key guardada
   en Supabase Vault (nunca en texto plano en una migración). Una sola vez, en
   el SQL Editor de Supabase:
   ```sql
   select vault.create_secret('PEGA_AQUI_TU_SERVICE_ROLE_KEY', 'service_role_key');
   ```
   La `service_role` key está en Project Settings → API → `service_role`
   (secret). Si alguna vez la rotas, vuelve a correr ese mismo comando (crea o
   reemplaza el secreto `service_role_key`).

Sin el paso 2, el cron diario falla silenciosamente (columna `Authorization`
vacía); el botón manual "Generar ahora" **sí funciona sin ese paso**, porque
usa tu sesión de admin en vez del cron.

## Juego responsable

18+. Las predicciones no garantizan resultados; apostar conlleva riesgo de
pérdida económica.

## Pendiente

- `supabase gen types typescript` para tipar las respuestas.
- Revisar PRs de dependabot (bumps de major: vite 5→8, react-router 6→7).
- Activar "Leaked Password Protection" en Supabase Auth (aviso del linter,
  se activa desde el dashboard, no por migración).
- Guardar picks (`pick_saves`) desde la UI del feed.
- Repasar `docs/backend.md` y los mockups de `design-system/` — describen el
  modelo antiguo con planes/landing pública, ya retirado.
