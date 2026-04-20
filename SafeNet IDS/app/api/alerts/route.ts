import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/mock-db';

const supabase = createClient(
  'mock',
  'mock'
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const severity = searchParams.get('severity');
    const unresolved = searchParams.get('unresolved') === 'true';

    let query = supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (unresolved) {
      query = query.eq('is_resolved', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ alerts: data });
  } catch (error) {
    console.error('[v0] Failed to fetch alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, isResolved } = body;

    const { error } = await supabase
      .from('alerts')
      .update({
        is_resolved: isResolved,
        resolved_at: isResolved ? new Date().toISOString() : null,
      })
      .eq('id', alertId);

    if (error) throw error;

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('[v0] Failed to update alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}
