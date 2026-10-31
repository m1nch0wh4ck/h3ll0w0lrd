-- 루모 스튜디오 기기 간 동기화: 데이터베이스 설정
-- Supabase 대시보드 → SQL Editor에 전체를 붙여넣고 Run 하세요. 여러 번 실행해도 안전합니다.
-- 로그인한 본인 행만 읽고 쓸 수 있습니다(RLS). 사용자마다 한 행에 스튜디오 전체 백업을 통째로 저장합니다.

create table if not exists public.studio_state (
  owner_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  -- 바로 앞 버전. 다른 기기 내용으로 덮어썼을 때 되살릴 수 있도록 서버가 자동으로 채웁니다.
  previous jsonb,
  version integer not null default 1 check (version >= 1),
  device text not null default '' check (char_length(device) <= 100),
  updated_at timestamptz not null default now(),
  constraint studio_state_size check (pg_column_size(data) < 5000000)
);

-- 저장할 때마다: 직전 내용 보관, 버전은 정확히 1씩만 증가, 주인 변경 금지
create or replace function public.studio_state_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.version <> old.version + 1 then
    raise exception 'studio_state: version must increase by 1 (old %, new %)', old.version, new.version;
  end if;
  new.owner_id := old.owner_id;
  new.previous := old.data;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists studio_state_before_update on public.studio_state;
create trigger studio_state_before_update
  before update on public.studio_state
  for each row execute function public.studio_state_before_update();

alter table public.studio_state enable row level security;

drop policy if exists studio_state_select on public.studio_state;
drop policy if exists studio_state_insert on public.studio_state;
drop policy if exists studio_state_update on public.studio_state;
drop policy if exists studio_state_delete on public.studio_state;

create policy studio_state_select on public.studio_state
  for select to authenticated using (owner_id = (select auth.uid()));
create policy studio_state_insert on public.studio_state
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy studio_state_update on public.studio_state
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy studio_state_delete on public.studio_state
  for delete to authenticated using (owner_id = (select auth.uid()));

revoke all on public.studio_state from anon;
revoke all on public.studio_state from authenticated;
grant select, insert, update, delete on public.studio_state to authenticated;

-- 일시 정지 방지용 확인 함수. GitHub Actions(.github/workflows/supabase-keepalive.yml)가 하루 한 번 부릅니다.
-- 현재 시각만 돌려주며 어떤 표도 읽지 않으므로 공개 키로 불러도 안전합니다.
create or replace function public.keepalive()
returns timestamptz
language sql
stable
set search_path = ''
as $$ select now() $$;

grant execute on function public.keepalive() to anon, authenticated;
