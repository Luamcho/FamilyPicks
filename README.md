# FamilyPicks

Servicio de **predicciones deportivas de un único tipster**: picks publicados antes
del inicio, con cuota y stake, y un historial verificado y público. No es un
marketplace de tipsters y no es una casa de apuestas.

## Stack

- **Frontend:** React + Vite + TypeScript, React Router, CSS con tokens de diseño.
- **Backend:** Supabase (Postgres + Auth + RLS + Edge Functions).
- **Deploy:** Vercel.

Sin `VITE_SUPABASE_URL` la app arranca en **modo demo** con datos de ejemplo
(`src/lib/mock.ts`), replicando la regla de acceso por plan del lado del cliente.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc + vite build -> dist/
```

Copia `.env.example` a `.env.local` y rellena con tu proyecto Supabase para datos
reales.

## Estructura

```
src/
  pages/        Landing, Feed (picks), Stats, Results, Account
  components/   AppLayout, PickCard, BankrollChart, AgeGate, ThemeToggle, bits
  lib/          supabase, api (con fallback a mock), types, format
  context/      ThemeContext, PlanContext
  styles/       tokens (3 estados de tema) + base + components + marketing

supabase/
  migrations/   esquema: tablas, RLS, triggers, RPCs de stats
  seed.sql      deportes + picks de ejemplo
  functions/    edge functions (stripe-webhook: stub)

design-system/familypicks/
  MASTER.md         sistema de diseño (fuente de verdad)
  style-guide.html  guía visual
  screens/          mockups HTML originales

docs/backend.md     modelo de datos, reglas de acceso, cómo levantarlo
```

## Reglas del producto

- **Un solo tipster.** Nada de lenguaje de marketplace.
- **Acceso por plan** (RLS de `picks`): los `pending` solo para premium/vip al
  instante; free y visitantes a las 24 h; los picks resueltos son siempre públicos.
- **Transparencia:** todo pick con cuota de registro y de cierre; todo KPI con
  periodo y tamaño de muestra.

| Plan | Acceso a los picks |
|---|---|
| Gratis | 24 h de retraso · 1 deporte · histórico completo |
| Premium | tiempo real · todos los deportes · alertas email |
| VIP | + push y Telegram · picks de stake alto · cuota de cierre registrada |

## Juego responsable

18+. Las predicciones no garantizan resultados; apostar conlleva riesgo de pérdida
económica. Age gate, disclaimers y enlaces de ayuda forman parte del producto.

## Pendiente

- Autenticación real (Supabase Auth) y páginas de login/registro.
- Integrar Stripe (Checkout + webhook; el modelo de datos ya está).
- Crear el proyecto Supabase y conectar env vars en Vercel.
- Panel de admin para publicar y liquidar picks.
- `supabase gen types typescript` para tipar las respuestas.
