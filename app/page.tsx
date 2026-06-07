import { createServerClient } from '@/lib/supabase-server'
import { getDrawStartAt } from '@/lib/draw-schedule'
import { ArisanApp } from '@/components/ArisanApp'
import { Participant, Country } from '@/types'

export const dynamic = 'force-dynamic'

async function getData() {
  const supabase = createServerClient()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const [participantsRes, countriesRaw] = await Promise.all([
    supabase
      .from('participants')
      .select('*, country:countries!country_id(*)')
      .order('created_at', { ascending: true }),
    // Fetch countries via raw REST to bypass any client issue
    fetch(`${url}/rest/v1/countries?select=*&order=name`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }),
  ])

  const countries: Country[] = await countriesRaw.json()

  return {
    participants: (participantsRes.data as Participant[]) || [],
    countries: Array.isArray(countries) ? countries : [],
  }
}

export default async function HomePage() {
  const { participants, countries } = await getData()

  return (
    <ArisanApp
      initialParticipants={participants}
      initialCountries={countries}
      drawStartAt={getDrawStartAt()?.toISOString() ?? null}
    />
  )
}
