-- Supabase schema para Control de Préstamos

create table if not exists academic_units (
  id bigserial primary key,
  name text not null
);

create table if not exists careers (
  id bigserial primary key,
  name text not null,
  unitid bigint references academic_units(id) on delete cascade
);

create table if not exists users (
  id bigserial primary key,
  name text not null,
  type text not null,
  careerid bigint references careers(id) on delete cascade
);

create table if not exists equipment (
  id bigserial primary key,
  name text not null,
  serial text,
  quantity integer not null default 1
);

create table if not exists loans (
  id bigserial primary key,
  userid bigint references users(id) on delete cascade,
  equipmentid bigint references equipment(id) on delete cascade,
  dateout date not null,
  datein date,
  quantity integer not null default 1,
  status text not null
);

-- Recomendado: habilitar políticas RLS en Supabase y permitir acceso público de lectura/escritura
-- para desarrollo rápido, o configurar roles/seguridad según el proyecto.

alter table public.academic_units enable row level security;
drop policy if exists "Anon access academic_units" on public.academic_units;
create policy "Anon access academic_units" on public.academic_units for all using (auth.role() = 'anon') with check (auth.role() = 'anon');

alter table public.careers enable row level security;
drop policy if exists "Anon access careers" on public.careers;
create policy "Anon access careers" on public.careers for all using (auth.role() = 'anon') with check (auth.role() = 'anon');

alter table public.users enable row level security;
drop policy if exists "Anon access users" on public.users;
create policy "Anon access users" on public.users for all using (auth.role() = 'anon') with check (auth.role() = 'anon');

alter table public.equipment enable row level security;
drop policy if exists "Anon access equipment" on public.equipment;
create policy "Anon access equipment" on public.equipment for all using (auth.role() = 'anon') with check (auth.role() = 'anon');

alter table public.loans enable row level security;
drop policy if exists "Anon access loans" on public.loans;
create policy "Anon access loans" on public.loans for all using (auth.role() = 'anon') with check (auth.role() = 'anon');
