# FamilyPicks — Backend (Supabase)

Backend sobre **Supabase**: Postgres + Auth + RLS + Edge Functions. Este documento
describe el modelo de datos, las reglas de acceso y cómo levantarlo en local.

> Estado actual: **migraciones locales**. Nada se ha aplicado a un proyecto remoto.
> Pagos modelados (`subscriptions`), integración de Stripe pendiente.

## Estructura

```
supabase/
  config.toml
  seed.sql
  migrations/
    20260903120000_init_schema.sql       tablas, enums, índices
    20260903120100_functions_triggers.sql funciones, triggers, RPCs
    20260903120200_rls_policies.sql       RLS + grants
    20260903120300_stats_rpc.sql          vista + funciones de estadísticas
  functions/
    stripe-webhook/index.ts               stub (integrar más adelante)
```

## Modelo de datos

| Tabla | Para qué | Quién escribe |
|---|---|---|
| `sports` | Catálogo de deportes | admin |
| `profiles` | 1:1 con `auth.users`. Rol, plan efectivo, verificación de edad | el propio usuario (campos limitados); `role`/`plan` solo admin/sistema |
| `picks` | Predicciones del tipster: evento, mercado, cuota, stake, estado, P&L | admin |
| `pick_saves` | Picks guardados por cada usuario | el propio usuario |
| `subscriptions` | Suscripciones de pago (fuente de verdad del plan) | solo `service_role` (webhook de Stripe) |

Enums: `user_role`, `plan_tier` (`free`/`premium`/`vip`), `pick_status`
(`pending`/`won`/`lost`/`void`/`cancelled`), `market_category`, `subscription_status`.

### Cálculo del resultado de un pick

Al pasar de `pending` a un estado final, el trigger `picks_compute_result` calcula
`result_units` y `settled_at`:

| Estado | `result_units` |
|---|---|
| `won` | `stake * (odds - 1)` |
| `lost` | `-stake` |
| `void` / `cancelled` | `0` |

*(Medios aciertos de hándicap asiático: fuera de la v1.)*

### Sincronización del plan

`subscriptions` es la fuente de verdad. El trigger `sync_user_plan` recalcula
`profiles.plan` en cada cambio: si hay una suscripción `active`/`trialing`, ese es
el plan (vip gana a premium); si no, `free`. `profiles.plan` está desnormalizado
para que la RLS sea rápida.

## Reglas de acceso (RLS)

### `picks` — visibilidad
Un pick es visible si:
- lo consulta el **admin**, **o**
- su estado **no es `pending`** (el histórico es siempre público), **o**
- se publicó **hace 24 h o más** (free y visitantes), **o**
- el plan del solicitante es **`premium` o `vip`** (los picks `is_vip` solo para `vip`).

Escritura de `picks`: solo admin.

### `profiles`
- Lectura: el propio + admin.
- Escritura: el propio (solo `display_name`, `age_verified_at`) + admin.
- `role` y `plan` los bloquea el trigger `protect_profile_columns` para no-admins.

### `subscriptions`
- Lectura: la propia + admin.
- Escritura: nadie vía API. Solo `service_role` desde el webhook.

## RPCs

| Función | Uso | Permiso |
|---|---|---|
| `verify_age()` | Marca `age_verified_at = now()` para el usuario actual | authenticated |
| `settle_pick(pick_id, status, closing_odds?)` | Liquida un pick | admin (comprobado dentro) |
| `stats_overview(from?, to?)` | ROI, yield, % acierto, racha, muestra | público |
| `stats_by_sport(from?, to?)` | Desglose por deporte | público |
| `stats_bankroll(bucket, from?, to?)` | Unidades acumuladas por día/semana/mes | público |

Definiciones: **ROI** = beneficio / Σ stakes · **Yield** = beneficio / nº picks ·
**Racha** = aciertos consecutivos desde el último pick liquidado (`void` no rompe).

Desde el cliente (supabase-js):
```ts
const { data } = await supabase.rpc('stats_overview')
const { data: curve } = await supabase.rpc('stats_bankroll', { p_bucket: 'month' })
```

## Levantar en local

Requisitos: [Supabase CLI](https://supabase.com/docs/guides/local-development) y Docker.

```bash
supabase start          # arranca Postgres + Studio + Auth
supabase db reset       # aplica migraciones + seed.sql
```

- Studio: http://localhost:54323
- API: http://localhost:54321

### Hacerte admin (el tipster)

1. Regístrate desde la app o el Studio (Authentication) con tu email.
2. En el SQL editor:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'TU_EMAIL');
   ```
3. Crear un pick: `insert into public.picks (...)`. Liquidarlo:
   `select public.settle_pick('<uuid>', 'won', 1.95);`

### Plan de pago de prueba (sin Stripe)

```sql
insert into public.subscriptions (user_id, plan, status, current_period_end)
values ((select id from auth.users where email='TEST_EMAIL'),
        'premium', 'active', now() + interval '30 days');
```

## Aplicar a un proyecto remoto (cuando toque)

```bash
supabase link --project-ref <ref>
supabase db push
```

## Pendiente

- [ ] Integrar Stripe: Checkout + `stripe-webhook` (el modelo ya está).
- [ ] Edge function `create-checkout-session`.
- [ ] Generar tipos: `supabase gen types typescript --local > src/types/database.ts`.
- [ ] Rate limiting / captcha en signup (Supabase Auth ya trae parte).
- [ ] Cron para recordar picks sin liquidar (evento ya pasado, `status = 'pending'`).
- [ ] Half-win/half-loss para hándicaps asiáticos si se ofrecen.
