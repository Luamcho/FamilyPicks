-- ============================================================================
-- FamilyPicks — pivote a app privada de un solo usuario
--
-- Ya no es un servicio con público/planes: es un panel privado para que el
-- dueño (admin) registre y siga sus propios picks, sugeridos por IA o por él
-- mismo. Se elimina todo el modelo de planes/suscripciones y el acceso
-- anónimo: sin sesión de admin no se ve ni se escribe nada.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Fuera el modelo de planes / suscripciones
-- ---------------------------------------------------------------------------
drop policy if exists picks_select_visible on public.picks;
drop function if exists public.auth_plan();

drop table if exists public.subscriptions cascade;
drop function if exists public.sync_user_plan();

alter table public.profiles drop column if exists plan;
alter table public.profiles drop column if exists plan_renews_at;
alter table public.picks    drop column if exists is_vip;

drop type if exists public.plan_tier;
drop type if exists public.subscription_status;

-- ---------------------------------------------------------------------------
-- 2) Origen del pick: quién lo propuso
-- ---------------------------------------------------------------------------
create type public.pick_source as enum ('manual', 'ai');
alter table public.picks add column source public.pick_source not null default 'manual';
comment on column public.picks.source is 'manual: lo escribió el dueño. ai: sugerido por un asistente de IA y revisado antes de publicar.';

-- ---------------------------------------------------------------------------
-- 3) Privacidad total: solo el admin (dueño) puede ver o escribir algo.
--    picks_write_admin (FOR ALL) ya cubre select/insert/update/delete.
-- ---------------------------------------------------------------------------
revoke select on public.sports            from anon;
revoke select on public.picks             from anon;
revoke select on public.v_settled_picks   from anon;
revoke execute on function public.stats_overview(timestamptz, timestamptz)       from anon;
revoke execute on function public.stats_by_sport(timestamptz, timestamptz)       from anon;
revoke execute on function public.stats_bankroll(text, timestamptz, timestamptz) from anon;
revoke execute on function public.is_admin() from anon;
