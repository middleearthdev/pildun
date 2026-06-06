-- ============================================================
-- Arisan Piala Dunia 2026 - Supabase Setup
-- Jalankan script ini di Supabase SQL Editor
-- ============================================================

-- ============================================================
-- RESET (jalankan jika ingin mulai ulang dari awal)
-- ============================================================

-- truncate participants restart identity cascade;
-- truncate countries restart identity cascade;

-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists participants (
  id uuid default uuid_generate_v4() primary key,
  name varchar(100) not null,
  country_id uuid,
  is_spinning boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists countries (
  id uuid default uuid_generate_v4() primary key,
  name varchar(100) not null,
  flag varchar(30) not null,
  code varchar(10) not null,
  is_assigned boolean default false,
  assigned_participant_id uuid,
  created_at timestamp with time zone default now()
);

-- Foreign keys
alter table participants
  add constraint fk_participant_country
  foreign key (country_id) references countries(id);

alter table countries
  add constraint fk_country_participant
  foreign key (assigned_participant_id) references participants(id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table participants enable row level security;
alter table countries enable row level security;

create policy "Allow all on participants" on participants
  for all using (true) with check (true);

create policy "Allow all on countries" on countries
  for all using (true) with check (true);

-- ============================================================
-- REALTIME
-- ============================================================

alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table countries;

-- ============================================================
-- ATOMIC DRAW FUNCTION (Anti Race Condition)
-- ============================================================

create or replace function assign_random_country(p_participant_id uuid)
returns table(
  country_id uuid,
  country_name varchar,
  country_flag varchar,
  country_code varchar
)
language plpgsql
as $$
declare
  v_country_id uuid;
  v_existing_country_id uuid;
begin
  -- Check if participant already has a country
  select p.country_id into v_existing_country_id
  from participants p
  where p.id = p_participant_id;

  if v_existing_country_id is not null then
    raise exception 'Participant already has a country assigned';
  end if;

  -- Lock and select random available country (FOR UPDATE SKIP LOCKED = anti race condition)
  select c.id into v_country_id
  from countries c
  where c.is_assigned = false
  order by random()
  limit 1
  for update skip locked;

  if v_country_id is null then
    raise exception 'No countries available';
  end if;

  -- Mark country as assigned
  update countries
  set
    is_assigned = true,
    assigned_participant_id = p_participant_id
  where id = v_country_id;

  -- Update participant (is_spinning stays true until /api/draw/finish is called)
  update participants
  set
    country_id = v_country_id,
    updated_at = now()
  where id = p_participant_id;

  -- Return assigned country
  return query
  select c.id, c.name, c.flag, c.code
  from countries c
  where c.id = v_country_id;
end;
$$;

-- ============================================================
-- SEED: 48 Tim Piala Dunia 2026 (nama Bahasa Indonesia)
-- ============================================================

insert into countries (name, flag, code) values
  ('Argentina',      '🇦🇷', 'ARG'),
  ('Brazil',         '🇧🇷', 'BRA'),
  ('Prancis',        '🇫🇷', 'FRA'),
  ('Spanyol',        '🇪🇸', 'ESP'),
  ('Jerman',         '🇩🇪', 'GER'),
  ('Portugal',       '🇵🇹', 'POR'),
  ('Belanda',        '🇳🇱', 'NED'),
  ('Belgia',         '🇧🇪', 'BEL'),
  ('Italia',         '🇮🇹', 'ITA'),
  ('Kroasia',        '🇭🇷', 'CRO'),
  ('Uruguay',        '🇺🇾', 'URU'),
  ('Kolombia',       '🇨🇴', 'COL'),
  ('Meksiko',        '🇲🇽', 'MEX'),
  ('Amerika',        '🇺🇸', 'USA'),
  ('Kanada',         '🇨🇦', 'CAN'),
  ('Jepang',         '🇯🇵', 'JPN'),
  ('Korea Selatan',  '🇰🇷', 'KOR'),
  ('Maroko',         '🇲🇦', 'MAR'),
  ('Senegal',        '🇸🇳', 'SEN'),
  ('Ghana',          '🇬🇭', 'GHA'),
  ('Nigeria',        '🇳🇬', 'NGR'),
  ('Kamerun',        '🇨🇲', 'CMR'),
  ('Pantai Gading',  '🇨🇮', 'CIV'),
  ('Australia',      '🇦🇺', 'AUS'),
  ('Arab Saudi',     '🇸🇦', 'KSA'),
  ('Iran',           '🇮🇷', 'IRN'),
  ('Qatar',          '🇶🇦', 'QAT'),
  ('Ekuador',        '🇪🇨', 'ECU'),
  ('Peru',           '🇵🇪', 'PER'),
  ('Chili',          '🇨🇱', 'CHI'),
  ('Paraguay',       '🇵🇾', 'PAR'),
  ('Swiss',          '🇨🇭', 'SUI'),
  ('Denmark',        '🇩🇰', 'DEN'),
  ('Polandia',       '🇵🇱', 'POL'),
  ('Serbia',         '🇷🇸', 'SRB'),
  ('Austria',        '🇦🇹', 'AUT'),
  ('Swedia',         '🇸🇪', 'SWE'),
  ('Norwegia',       '🇳🇴', 'NOR'),
  ('Turki',          '🇹🇷', 'TUR'),
  ('Mesir',          '🇪🇬', 'EGY'),
  ('Aljazair',       '🇩🇿', 'ALG'),
  ('Tunisia',        '🇹🇳', 'TUN'),
  ('Inggris',        '🇬🇧', 'ENG'),
  ('Ukraina',        '🇺🇦', 'UKR'),
  ('Yunani',         '🇬🇷', 'GRE'),
  ('Ceko',           '🇨🇿', 'CZE'),
  ('Selandia Baru',  '🇳🇿', 'NZL'),
  ('Kosta Rika',     '🇨🇷', 'CRC');

-- ============================================================
-- SEED: Participants
-- ============================================================

insert into participants (name) values
  ('Apoy'),
  ('Ikuy'),
  ('Slamet'),
  ('Acil'),
  ('Fahmi'),
  ('Nabil'),
  ('Ucup kelek'),
  ('Adam'),
  ('Dadang'),
  ('S. Muchtar'),
  ('Hedi'),
  ('Dulz'),
  ('Ozan'),
  ('Kejol');
