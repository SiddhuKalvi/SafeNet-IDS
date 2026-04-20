import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/mock-db';

const supabase = createClient(
  'mock',
  'mock'
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');

    // Get packet count
    const { count: packetCount, error: packetError } = await supabase
      .from('packets')
      .select('*', { count: 'exact' })
      .gt('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString());

    if (packetError) throw packetError;

    // Get alert count by severity
    const { data: alertsBySeverity, error: alertError } = await supabase
      .from('alerts')
      .select('severity')
      .gt('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString());

    if (alertError) throw alertError;

    const alertCounts = {
      critical: 0,
      warning: 0,
      info: 0,
    };

    alertsBySeverity?.forEach((alert: any) => {
      alertCounts[alert.severity as keyof typeof alertCounts]++;
    });

    // Get top attacked IPs
    const { data: topTargets, error: targetError } = await supabase
      .from('alerts')
      .select('destination_ip')
      .gt('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .limit(5);

    if (targetError) throw targetError;

    const targetCounts: { [ip: string]: number } = {};
    topTargets?.forEach((item: any) => {
      targetCounts[item.destination_ip] = (targetCounts[item.destination_ip] || 0) + 1;
    });

    // Get threat sources
    const { data: topSources, error: sourceError } = await supabase
      .from('alerts')
      .select('source_ip')
      .gt('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .limit(5);

    if (sourceError) throw sourceError;

    const sourceCounts: { [ip: string]: number } = {};
    topSources?.forEach((item: any) => {
      sourceCounts[item.source_ip] = (sourceCounts[item.source_ip] || 0) + 1;
    });

    // Get unique IPs
    const { data: allAlerts, error: allError } = await supabase
      .from('alerts')
      .select('source_ip, destination_ip')
      .gt('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString());

    if (allError) throw allError;

    const uniqueSources = new Set<string>();
    const uniqueDestinations = new Set<string>();

    allAlerts?.forEach((alert: any) => {
      uniqueSources.add(alert.source_ip);
      uniqueDestinations.add(alert.destination_ip);
    });

    return NextResponse.json({
      packetCount: packetCount || 0,
      alertCounts,
      totalAlerts: alertsBySeverity?.length || 0,
      topAttackedIps: Object.entries(targetCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([ip, count]) => ({ ip, count })),
      topThreatSources: Object.entries(sourceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([ip, count]) => ({ ip, count })),
      uniqueSourceIps: uniqueSources.size,
      uniqueDestinationIps: uniqueDestinations.size,
      timeRange: `Last ${hours} hours`,
    });
  } catch (error) {
    console.error('[v0] Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
