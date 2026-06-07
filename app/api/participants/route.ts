import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('participants')
    .select(`*, countries:countries!assigned_participant_id(*)`)
    .order('created_at', { ascending: true })
    .order('assigned_at', { referencedTable: 'countries', ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ participants: data })
}

export async function POST(request: Request) {
  const supabase = createServerClient()
  const body = await request.json()
  const { name } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Nama peserta wajib diisi' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('participants')
    .insert({ name: name.trim() })
    .select(`*, countries:countries!assigned_participant_id(*)`)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ participant: data }, { status: 201 })
}
