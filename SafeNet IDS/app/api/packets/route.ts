import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const protocol = searchParams.get('protocol')
    const sourceIp = searchParams.get('source_ip')

    const supabase = createServerClient()

    let query = supabase
      .from('packets')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (protocol) {
      query = query.eq('protocol', protocol)
    }

    if (sourceIp) {
      query = query.eq('source_ip', sourceIp)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      packets: data || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('[v0] Failed to fetch packets:', error)
    return NextResponse.json({ error: 'Failed to fetch packets' }, { status: 500 })
  }
}
