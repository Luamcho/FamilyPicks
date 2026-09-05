-- ============================================================================
-- FamilyPicks — cron diario que dispara generate-picks
--
-- pg_cron llama al edge function por HTTP (pg_net) una vez al día. La
-- llamada necesita autenticarse como service_role (para que generate-picks
-- confíe en ella sin sesión de usuario) — esa key NUNCA se escribe aquí en
-- texto plano: se guarda una sola vez en Supabase Vault, a mano, desde el
-- SQL Editor (ver README, sección "Automatización de picks").
-- ============================================================================

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
begin
  perform cron.unschedule('generate-daily-picks');
exception when others then
  null; -- no existía todavía, nada que borrar
end $$;

select cron.schedule(
  'generate-daily-picks',
  '0 13 * * *', -- 13:00 UTC ≈ 8am hora Colombia/Perú/Ecuador (UTC-5)
  $cron$
  select net.http_post(
    url := 'https://eaploqxskxhqczkqubxy.supabase.co/functions/v1/generate-picks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $cron$
);
