export interface Country {
  id: string
  name: string
  flag: string
  code: string
  is_assigned: boolean
  assigned_participant_id: string | null
  assigned_at: string | null
  created_at: string
}

export interface Participant {
  id: string
  name: string
  is_spinning: boolean
  created_at: string
  updated_at: string
  countries: Country[]
}

// Setiap peserta boleh mengundi sampai 2 negara.
export const MAX_COUNTRIES_PER_PARTICIPANT = 2
