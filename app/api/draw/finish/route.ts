import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const supabase = createServerClient()
  const body = await request.json()
  const { participantId } = body

  if (!participantId) {
    return NextResponse.json({ error: 'participantId wajib diisi' }, { status: 400 })
  }

  const { error } = await supabase
    .from('participants')
    .update({ is_spinning: false, updated_at: new Date().toISOString() })
    .eq('id', participantId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
