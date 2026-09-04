-- ============================================================================
-- FamilyPicks — Row Level Security
-- ============================================================================

alter table public.sports        enable row level security;
alter table public.profiles      enable row level security;
alter table public.picks         enable row level security;
alter table public.pick_saves    enable row level security;
alter table public.subscriptions enable row level security;

-- ---------------------------------------------------------------------------
-- sports: lectura pública, escritura solo admin
-- ---------------------------------------------------------------------------
create policy sports_read  on public.sports for select using (true);
create policy sports_write on public.sports for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- profiles: cada usuario el suyo; el admin, todos.
-- El insert lo hace handle_new_user() (security definer): sin política de insert.
-- Los cambios de role/plan los bloquea el trigger protect_profile_columns().
-- ---------------------------------------------------------------------------
create policy profiles_select_self on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy profiles_update_self on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- picks: visibilidad por plan + antigüedad; escritura solo admin
--
--   · admin                              -> todo
--   · cualquiera (incl. visitante):
--       - status <> 'pending'            -> histórico público
--       - publicado hace >= 24 h         -> free / anónimo
--       - plan premium|vip               -> al instante
--           (los picks is_vip solo si el plan es 'vip')
-- ---------------------------------------------------------------------------
create policy picks_select_visible on public.picks for select using (
  public.is_admin()
  or status <> 'pending'
  or published_at + interval '24 hours' <= now()
  or (
    public.auth_plan() in ('premium','vip')
    and (not is_vip or public.auth_plan() = 'vip')
  )
);

create policy picks_write_admin on public.picks for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- pick_saves: solo el propietario
-- ---------------------------------------------------------------------------
create policy pick_saves_all_self on public.pick_saves for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- subscriptions: lectura propia (y admin). Sin política de escritura:
-- solo service_role (que salta la RLS) puede insertar/actualizar desde el
-- webhook de Stripe.
-- ---------------------------------------------------------------------------
create policy subscriptions_select_self on public.subscriptions for select
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Grants (la RLS sigue filtrando filas; esto es acceso a nivel de tabla)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on public.sports  to anon, authenticated;
grant select on public.picks   to anon, authenticated;
grant select on public.profiles      to authenticated;
grant select on public.subscriptions to authenticated;
grant select, insert, delete on public.pick_saves to authenticated;
grant update (display_name, age_verified_at) on public.profiles to authenticated;

grant execute on function public.verify_age()                                       to authenticated;
grant execute on function public.settle_pick(uuid, public.pick_status, numeric)      to authenticated;
grant execute on function public.is_admin()                                          to anon, authenticated;
grant execute on function public.auth_plan()                                         to anon, authenticated;
