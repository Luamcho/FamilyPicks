# FamilyPicks

Servicio de **predicciones deportivas de un único tipster**: picks publicados antes
del inicio, con cuota y stake, y un historial verificado y público. No es un
marketplace de tipsters y no es una casa de apuestas.

> Estado: diseño + esquema de backend. Sin frontend de producción todavía.

## Estructura

```
design-system/familypicks/
  MASTER.md              sistema de diseño (fuente de verdad)
  style-guide.html       guía visual navegable
  screens/
    landing.html         landing pública (age gate, hero, planes, FAQ)
    feed-picks.html      feed de picks de la app (filtros, pick bloqueado)
    stats.html           track record (bankroll, desglose, histórico)

supabase/
  migrations/            esquema: tablas, RLS, triggers, RPCs de stats
  seed.sql               deportes + picks de ejemplo
  functions/             edge functions (stripe-webhook: stub)
  config.toml

docs/
  backend.md             modelo de datos, reglas de acceso, cómo levantarlo
```

## Diseño

Abre cualquier `.html` en el navegador. El sistema es **oscuro por defecto** con
tema claro soportado. Regla central: el color de resultado (verde acierto, rojo
fallo) manda sobre el color de marca (azul). Ver [`design-system/familypicks/MASTER.md`](design-system/familypicks/MASTER.md).

## Backend

Supabase (Postgres + Auth + RLS + Edge Functions). Ver [`docs/backend.md`](docs/backend.md).

```bash
supabase start
supabase db reset      # aplica migraciones + seed
```

Regla de acceso central (RLS de `picks`): los `pending` solo para premium/vip al
instante, para el resto a las 24 h; los picks resueltos son siempre públicos.

## Planes

| Plan | Acceso a los picks |
|---|---|
| Gratis | 24 h de retraso · 1 deporte · histórico completo |
| Premium | tiempo real · todos los deportes · alertas email |
| VIP | + push y Telegram · picks de stake alto · cuota de cierre registrada |

## Juego responsable

18+. Las predicciones no garantizan resultados; apostar conlleva riesgo de pérdida
económica. Age gate, disclaimers y enlaces de ayuda forman parte del producto, no
son un añadido.
