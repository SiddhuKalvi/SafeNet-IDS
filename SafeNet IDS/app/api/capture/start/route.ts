import { NextRequest, NextResponse } from 'next/server'
import { captureState } from '@/lib/capture-state'
import { createServerClient } from '@/lib/supabase'
import { generateMixedTraffic } from '@/lib/packet-generator'
import { detectThreats } from '@/lib/detection-rules'

export async function GET() {
  return NextResponse.json({
    status: captureState.isRunning() ? 'running' : 'stopped',
    message: captureState.isRunning() ? 'Packet capture is active' : 'Packet capture is inactive',
  })
}

export async function POST(request: NextRequest) {
  try {
    if (captureState.isRunning()) {
      return NextResponse.json({ status: 'already_running', message: 'Capture already running' }, { status: 400 })
    }

    captureState.setRunning(true)
    const supabase = createServerClient()

    // Get blacklisted IPs
    const { data: blacklist } = await supabase.from('ip_blacklist').select('ip')
    const blacklistedIPs = new Set((blacklist || []).map((item: any) => item.ip))

    // Start packet generation every 2 seconds
    const interval = setInterval(async () => {
      try {
        const packets = generateMixedTraffic()

        for (const packet of packets) {
          // Insert packet
          await supabase.from('packets').insert({
            source_ip: packet.source_ip,
            destination_ip: packet.destination_ip,
            source_port: packet.source_port,
            destination_port: packet.destination_port,
            protocol: packet.protocol,
            packet_size: packet.packet_size,
            flags: packet.flags,
            timestamp: new Date(),
            created_at: new Date(),
          })

          // Detect threats
          const alerts = detectThreats(packet, blacklistedIPs)
          for (const alert of alerts) {
            await supabase.from('alerts').insert({
              alert_type: alert.alert_type,
              severity: alert.severity,
              source_ip: alert.source_ip,
              destination_ip: alert.destination_ip,
              description: alert.description,
              detection_rule: alert.detection_rule,
              packet_count: alert.packet_count,
              is_resolved: false,
              created_at: new Date(),
              updated_at: new Date(),
            })
          }
        }
      } catch (error) {
        console.error('[v0] Error processing packets:', error)
      }
    }, 2000)

    captureState.setInterval(interval)

    return NextResponse.json({
      status: 'running',
      message: 'Packet capture started successfully',
    })
  } catch (error) {
    console.error('[v0] Error starting capture:', error)
    captureState.setRunning(false)
    captureState.stopCapture()
    return NextResponse.json(
      { error: 'Failed to start capture', details: String(error) },
      { status: 500 }
    )
  }
}
