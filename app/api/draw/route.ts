import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const supabase = createServerClient()
  const body = await request.json()
  const { participantId } = body

  if (!participantId) {
    return NextResponse.json({ error: 'participantId wajib diisi' }, { status: 400 })
  }

  // Set participant as spinning
  await supabase
    .from('participants')
    .update({ is_spinning: true, updated_at: new Date().toISOString() })
    .eq('id', participantId)

  // Atomically assign a random country using the safe RPC function
  const { data: assignResult, error: rpcError } = await supabase
    .rpc('assign_random_country', { p_participant_id: participantId })

  if (rpcError) {
    // Reset spinning state if failed
    await supabase
      .from('participants')
      .update({ is_spinning: false, updated_at: new Date().toISOString() })
      .eq('id', participantId)

    if (rpcError.message.includes('already has a country')) {
      return NextResponse.json({ error: 'Peserta ini sudah mendapatkan negara' }, { status: 409 })
    }
    if (rpcError.message.includes('No countries available')) {
      return NextResponse.json({ error: 'Tidak ada negara yang tersisa' }, { status: 409 })
    }
    return NextResponse.json({ error: rpcError.message }, { status: 500 })
  }

  const assignedCountry = assignResult?.[0]
  if (!assignedCountry) {
    return NextResponse.json({ error: 'Gagal mendapatkan negara' }, { status: 500 })
  }

  return NextResponse.json({
    country: {
      id: assignedCountry.country_id,
      name: assignedCountry.country_name,
      flag: assignedCountry.country_flag,
      code: assignedCountry.country_code,
    },
  })
}
