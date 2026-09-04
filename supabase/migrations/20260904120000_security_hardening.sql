-- ============================================================================
-- FamilyPicks — endurecimiento (avisos del linter de Supabase)
--   · search_path fijo en las funciones de trigger que faltaban
--   · las funciones de trigger y los helpers de RLS no deben ser invocables
--     por la API REST (PostgREST expone toda función con EXECUTE)
--   · verify_age / settle_pick: solo usuarios autenticados (se auto-protegen,
--     pero no hay razón para exponerlas a anónimos)
-- ============================================================================

alter function public.set_updated_at()        set search_path = public;
alter function public.picks_compute_result()  set search_path = public;

-- funciones de trigger: nadie las llama por API
revoke execute on function public.set_updated_at()          from public, anon, authenticated;
revoke execute on function public.picks_compute_result()    from public, anon, authenticated;
revoke execute on function public.handle_new_user()         from public, anon, authenticated;
revoke execute on function public.protect_profile_columns() from public, anon, authenticated;
revoke execute on function public.sync_user_plan()          from public, anon, authenticated;

-- helpers de RLS (is_admin / auth_plan): las políticas de RLS se evalúan con
-- los privilegios del usuario que consulta, así que anon/authenticated SÍ
-- necesitan EXECUTE. El aviso 0028/0029 del linter es esperado aquí: ambas
-- solo devuelven el rol/plan del propio solicitante.
grant execute on function public.is_admin()  to anon, authenticated;
grant execute on function public.auth_plan() to anon, authenticated;

-- RPCs con guardia interna: solo autenticados
revoke execute on function public.verify_age()                                  from public, anon;
revoke execute on function public.settle_pick(uuid, public.pick_status, numeric) from public, anon;
grant  execute on function public.verify_age()                                  to authenticated;
grant  execute on function public.settle_pick(uuid, public.pick_status, numeric) to authenticated;
