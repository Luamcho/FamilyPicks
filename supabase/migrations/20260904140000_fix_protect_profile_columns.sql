-- ============================================================================
-- FamilyPicks — corrige protect_profile_columns tras quitar profiles.plan
-- (se me olvidó actualizar este trigger en la migración del pivote privado)
--
-- También deja pasar los cambios hechos como 'postgres' (SQL editor / MCP) o
-- 'service_role': ahí no hay auth.uid() de sesión, así que is_admin() siempre
-- daba false y el trigger revertía el propio "hazte admin" inicial.
-- ============================================================================
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() or current_user in ('postgres', 'service_role') then
    return new;
  end if;
  new.role := old.role;
  return new;
end;
$$;
