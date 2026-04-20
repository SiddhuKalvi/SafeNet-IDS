import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/mock-db';

const supabase = createClient(
  'mock',
  'mock'
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listType = searchParams.get('type'); // 'blacklist' or 'whitelist'

    if (!listType || !['blacklist', 'whitelist'].includes(listType)) {
      return NextResponse.json(
        { error: 'Invalid list type' },
        { status: 400 }
      );
    }

    const table = listType === 'blacklist' ? 'ip_blacklist' : 'ip_whitelist';
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ ips: data });
  } catch (error) {
    console.error('[v0] Failed to fetch IP list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch IP list' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ip, listType, reason, threatLevel, description } = body;

    if (!ip || !listType || !['blacklist', 'whitelist'].includes(listType)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const table = listType === 'blacklist' ? 'ip_blacklist' : 'ip_whitelist';
    const insertData = listType === 'blacklist'
      ? { ip_address: ip, reason, threat_level: threatLevel || 'high' }
      : { ip_address: ip, description };

    const { error } = await supabase
      .from(table)
      .insert(insertData);

    if (error) throw error;

    return NextResponse.json({
      status: 'success',
      message: `IP added to ${listType}`,
    });
  } catch (error) {
    console.error('[v0] Failed to add IP:', error);
    return NextResponse.json(
      { error: 'Failed to add IP' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ip, listType } = body;

    if (!ip || !listType || !['blacklist', 'whitelist'].includes(listType)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const table = listType === 'blacklist' ? 'ip_blacklist' : 'ip_whitelist';
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('ip_address', ip);

    if (error) throw error;

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('[v0] Failed to remove IP:', error);
    return NextResponse.json(
      { error: 'Failed to remove IP' },
      { status: 500 }
    );
  }
}
