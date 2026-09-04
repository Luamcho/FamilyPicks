-- ============================================================================
-- FamilyPicks — datos de ejemplo (entorno local)
-- Se ejecuta con `supabase db reset`. Corre como superusuario (sin RLS).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Deportes
-- ---------------------------------------------------------------------------
insert into public.sports (slug, name, icon, sort_order) values
  ('futbol',           'Fútbol',            'circle-dot', 10),
  ('baloncesto',       'Baloncesto',        'circle',     20),
  ('tenis',            'Tenis',             'circle',     30),
  ('futbol-americano', 'Fútbol americano',  'shield',     40),
  ('otros',            'Otros',             'activity',   99)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Picks de ejemplo — para que las funciones de estadísticas devuelvan datos.
-- created_by = NULL: en local todavía no hay un usuario admin (ver abajo).
-- Los picks liquidados calculan result_units / settled_at por trigger.
-- ---------------------------------------------------------------------------
insert into public.picks
  (sport_id, competition, event, market, market_category, selection,
   odds, closing_odds, stake, confidence, event_start_at, published_at, status)
select s.id, v.competition, v.event, v.market, v.market_category::public.market_category, v.selection,
       v.odds, v.closing_odds, v.stake, v.confidence,
       now() + v.start_offset, now() + v.pub_offset, v.status::public.pick_status
from (values
  ('futbol',           'Premier League', 'Arsenal vs Tottenham',        'Ambos marcan',      'btts',        'Sí',                1.72, 1.68, 6, 4, interval '-1 day',  interval '-2 days', 'won'),
  ('baloncesto',       'NBA',            'Nuggets vs Suns',             'Total puntos',      'totals',      'Más de 224.5',      1.95, 1.90, 5, 3, interval '-1 day',  interval '-2 days', 'won'),
  ('tenis',            'ATP 500',        'Sinner vs Medvedev',          'Resultado exacto',  'other',       'Sinner 2-0',        2.30, 2.45, 3, 2, interval '-1 day',  interval '-2 days', 'lost'),
  ('futbol-americano', 'NFL',            'Chiefs vs Bills',             'Hándicap',          'handicap',    'Chiefs -2.5',       1.90, 1.90, 4, 3, interval '-1 day',  interval '-2 days', 'void'),
  ('futbol',           'LaLiga',         'Sevilla vs Betis',            'Línea de goles',    'goals_lines', 'Menos de 2.5 goles',1.85, 1.80, 5, 3, interval '-2 days', interval '-3 days', 'won'),
  ('baloncesto',       'NBA',            'Celtics vs Heat',             'Hándicap',          'handicap',    'Celtics -6.5',      1.91, 1.95, 4, 3, interval '-3 days', interval '-4 days', 'lost'),
  ('futbol',           'Serie A',        'Inter vs Milan',              'Ganador',           'moneyline',   'Inter',             2.05, 1.95, 6, 4, interval '-4 days', interval '-5 days', 'won'),
  ('tenis',            'ATP Masters',    'Alcaraz vs Zverev',           'Juegos hándicap',   'handicap',    'Alcaraz -4.5',      1.87, 1.90, 4, 3, interval '-5 days', interval '-6 days', 'won'),
  -- pendientes: visibles al instante para premium/vip, a las 24 h para el resto
  ('futbol',           'LaLiga',         'Real Madrid vs Barcelona',    'Línea de goles',    'goals_lines', 'Más de 2.5 goles',  2.10, null, 7, 4, interval '6 hours',  interval '-3 hours', 'pending'),
  ('baloncesto',       'NBA',            'Lakers vs Celtics',           'Hándicap',          'handicap',    'Lakers +4.5',       1.91, null, 5, 3, interval '10 hours', interval '-1 hour',  'pending')
) as v(sport_slug, competition, event, market, market_category, selection,
       odds, closing_odds, stake, confidence, start_offset, pub_offset, status)
join public.sports s on s.slug = v.sport_slug;

-- ============================================================================
-- CONVERTIRTE EN ADMIN (el tipster)
-- ----------------------------------------------------------------------------
-- 1. Levanta el stack:            supabase start
-- 2. Regístrate desde la app o el Studio (Authentication) con tu email.
-- 3. En el SQL editor del Studio (o `supabase db` psql), ejecuta:
--
--      update public.profiles set role = 'admin'
--      where id = (select id from auth.users where email = 'TU_EMAIL');
--
-- 4. Ya puedes crear picks (insert en public.picks) y liquidarlos:
--
--      select public.settle_pick('<uuid-del-pick>', 'won', 1.95);
--
-- Para dar plan premium/vip a un usuario de prueba sin Stripe:
--
--      insert into public.subscriptions (user_id, plan, status, current_period_end)
--      values ((select id from auth.users where email='TEST_EMAIL'),
--              'premium', 'active', now() + interval '30 days');
--   (el trigger sincroniza profiles.plan automáticamente)
-- ============================================================================
