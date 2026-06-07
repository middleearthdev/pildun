-- ============================================================
-- Migrasi: izinkan setiap peserta mengundi sampai 2 negara
-- Jalankan script ini di Supabase SQL Editor (aman dijalankan
-- berulang kali — tidak mengubah/menghapus 14 data yang sudah ada).
-- ============================================================

-- Catat urutan saat sebuah negara diundi, supaya UI bisa menampilkan
-- "negara pertama" / "negara kedua" sesuai urutan yang sebenarnya.
alter table countries add column if not exists assigned_at timestamp with time zone;

-- Isi assigned_at untuk 14 negara yang sudah terisi sebelumnya, pakai
-- updated_at peserta pemiliknya sebagai perkiraan waktu pengundian.
update countries c
set assigned_at = p.updated_at
from participants p
where c.assigned_participant_id = p.id
  and c.assigned_at is null;

-- ============================================================
-- ATOMIC DRAW FUNCTION — versi multi-negara
--
-- Bedanya dengan versi lama:
--   * Tidak lagi menolak berdasarkan participants.country_id (kolom itu
--     cuma muat 1 nilai dan dibiarkan apa adanya untuk 14 data lama).
--   * Sumber kebenaran sekarang adalah countries.assigned_participant_id
--     (relasi 1 peserta -> banyak negara yang sudah didukung FK lama).
--   * Berhenti undi begitu jumlah negara peserta mencapai p_max_countries.
-- ============================================================

create or replace function assign_random_country(
  p_participant_id uuid,
  p_max_countries int default 2
)
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
  v_count int;
begin
  -- Kunci baris peserta supaya dua permintaan undi yang nyaris bersamaan
  -- untuk orang yang sama tidak bisa lolos hitungan di bawah secara bersamaan.
  perform 1 from participants where id = p_participant_id for update;

  select count(*) into v_count
  from countries
  where assigned_participant_id = p_participant_id;

  if v_count >= p_max_countries then
    raise exception 'Participant already has max countries assigned';
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
    assigned_participant_id = p_participant_id,
    assigned_at = now()
  where id = v_country_id;

  -- Touch participant (is_spinning stays true until /api/draw/finish is called)
  update participants
  set updated_at = now()
  where id = p_participant_id;

  -- Return assigned country
  return query
  select c.id, c.name, c.flag, c.code
  from countries c
  where c.id = v_country_id;
end;
$$;
