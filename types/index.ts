export interface Country {
  id: string
  name: string
  flag: string
  code: string
  is_assigned: boolean
  assigned_participant_id: string | null
  created_at: string
}

export interface Participant {
  id: string
  name: string
  country_id: string | null
  is_spinning: boolean
  created_at: string
  updated_at: string
  country?: Country | null
}
