-- ============================================================================
-- FamilyPicks — candidatos de pick generados por IA
--
-- La automatización (edge function generate-picks, disparada por un cron
-- diario) NO publica directo en `picks`: inserta aquí, y el dueño aprueba o
-- descarta cada uno desde el admin. Aprobar copia la fila a `picks` con
-- source='ai'.
-- ============================================================================

create table public.pick_candidates (
  id              uuid primary key default gen_random_uuid(),
  batch_id        uuid not null,
  sport_id        smallint not null references public.sports(id),
  competition     text not null,
  event           text not null,
  market          text not null,
  market_category public.market_category not null default 'other',
  selection       text not null,
  odds            numeric(6,3) not null check (odds > 1),
  bookmaker       text not null default 'hardrockbet',
  stake           smallint not null default 3 check (stake between 1 and 10),
  confidence      smallint check (confidence between 1 and 5),
  event_start_at  timestamptz not null,
  analysis        text,
  status          text not null default 'pending' check (status in ('pending', 'approved', 'dismissed')),
  created_at      timestamptz not null default now(),
  decided_at      timestamptz
);
comment on table public.pick_candidates is 'Picks propuestos por la IA, pendientes de revisión. Aprobar los copia a picks (source=ai).';

create index pick_candidates_status_idx on public.pick_candidates (status);
create index pick_candidates_batch_idx  on public.pick_candidates (batch_id);

alter table public.pick_candidates enable row level security;

create policy pick_candidates_admin on public.pick_candidates for all
  using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.pick_candidates to authenticated;

-- ---------------------------------------------------------------------------
-- approve_pick_candidate — copia el candidato a picks (source='ai')
-- ---------------------------------------------------------------------------
create or replace function public.approve_pick_candidate(p_id uuid)
returns public.picks
language plpgsql security definer set search_path = public as $$
declare
  c public.pick_candidates;
  r public.picks;
begin
  if not public.is_admin() then
    raise exception 'Solo el admin puede aprobar picks' using errcode = '42501';
  end if;

  select * into c from public.pick_candidates where id = p_id and status = 'pending';
  if not found then
    raise exception 'Candidato % no encontrado o ya decidido', p_id;
  end if;

  insert into public.picks (
    sport_id, competition, event, market, market_category, selection,
    odds, stake, confidence, event_start_at, analysis, source
  ) values (
    c.sport_id, c.competition, c.event, c.market, c.market_category, c.selection,
    c.odds, c.stake, c.confidence, c.event_start_at, c.analysis, 'ai'
  )
  returning * into r;

  update public.pick_candidates set status = 'approved', decided_at = now() where id = p_id;
  return r;
end;
$$;

create or replace function public.dismiss_pick_candidate(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Solo el admin puede descartar candidatos' using errcode = '42501';
  end if;

  update public.pick_candidates set status = 'dismissed', decided_at = now()
  where id = p_id and status = 'pending';
end;
$$;

grant execute on function public.approve_pick_candidate(uuid) to authenticated;
grant execute on function public.dismiss_pick_candidate(uuid) to authenticated;
