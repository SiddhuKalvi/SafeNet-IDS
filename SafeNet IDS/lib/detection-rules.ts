import { SimulatedPacket } from './packet-generator'

export interface DetectionAlert {
  alert_type: string
  severity: 'critical' | 'warning' | 'info'
  source_ip: string
  destination_ip: string
  description: string
  detection_rule: string
  packet_count: number
}

// In-memory tracking for detection
const portScanTracker = new Map<string, { ports: Set<number>; timestamps: number[] }>()
const dosTracker = new Map<string, { count: number; timestamps: number[] }>()
const protocolAnomalyTracker = new Map<string, number>()

const CLEANUP_INTERVAL = 60000 // 1 minute
const TIME_WINDOW = 30000 // 30 seconds for port scans, 10 seconds for DoS

// Cleanup trackers periodically
setInterval(() => {
  const now = Date.now()

  // Cleanup port scan tracker
  for (const [ip, data] of portScanTracker.entries()) {
    data.timestamps = data.timestamps.filter(t => now - t < TIME_WINDOW)
    if (data.timestamps.length === 0) {
      portScanTracker.delete(ip)
    }
  }

  // Cleanup DoS tracker
  for (const [ip, data] of dosTracker.entries()) {
    data.timestamps = data.timestamps.filter(t => now - t < 10000)
    if (data.timestamps.length === 0) {
      dosTracker.delete(ip)
    }
  }
}, CLEANUP_INTERVAL)

/**
 * Detect port scanning attempts
 */
function detectPortScan(packet: SimulatedPacket): DetectionAlert | null {
  // Only TCP packets to different ports from same source
  if (packet.protocol !== 'TCP') return null

  const now = Date.now()
  const key = packet.source_ip

  if (!portScanTracker.has(key)) {
    portScanTracker.set(key, { ports: new Set(), timestamps: [now] })
  }

  const tracker = portScanTracker.get(key)!
  tracker.ports.add(packet.destination_port)
  tracker.timestamps.push(now)

  // Alert if 5+ different ports accessed in 30 seconds
  if (tracker.ports.size >= 5) {
    return {
      alert_type: 'PORT_SCAN',
      severity: 'warning',
      source_ip: packet.source_ip,
      destination_ip: packet.destination_ip,
      description: `Port scanning detected: ${tracker.ports.size} ports accessed in ${TIME_WINDOW / 1000}s`,
      detection_rule: 'port_scanning_detection',
      packet_count: tracker.timestamps.length,
    }
  }

  return null
}

/**
 * Detect DoS attacks
 */
function detectDoS(packet: SimulatedPacket): DetectionAlert | null {
  const now = Date.now()
  const key = packet.source_ip

  if (!dosTracker.has(key)) {
    dosTracker.set(key, { count: 0, timestamps: [] })
  }

  const tracker = dosTracker.get(key)!
  tracker.count++
  tracker.timestamps.push(now)

  // Alert if 1000+ packets from same source in 10 seconds
  if (tracker.count >= 1000) {
    return {
      alert_type: 'DOS_ATTACK',
      severity: 'critical',
      source_ip: packet.source_ip,
      destination_ip: packet.destination_ip,
      description: `DoS attack detected: ${tracker.count} packets from ${packet.source_ip} in 10 seconds`,
      detection_rule: 'dos_detection',
      packet_count: tracker.count,
    }
  }

  // Warning if 500+ packets
  if (tracker.count >= 500) {
    return {
      alert_type: 'DOS_ATTACK',
      severity: 'warning',
      source_ip: packet.source_ip,
      destination_ip: packet.destination_ip,
      description: `Possible DoS attack: ${tracker.count} packets from ${packet.source_ip}`,
      detection_rule: 'dos_detection',
      packet_count: tracker.count,
    }
  }

  return null
}

/**
 * Detect protocol anomalies
 */
function detectProtocolAnomaly(packet: SimulatedPacket): DetectionAlert | null {
  // Check for oversized packets (>4KB is suspicious)
  if (packet.packet_size > 4096) {
    return {
      alert_type: 'PROTOCOL_ANOMALY',
      severity: 'warning',
      source_ip: packet.source_ip,
      destination_ip: packet.destination_ip,
      description: `Oversized packet detected: ${packet.packet_size} bytes from ${packet.source_ip}`,
      detection_rule: 'protocol_anomaly_detection',
      packet_count: 1,
    }
  }

  // Check for unusual flag combinations
  if (packet.flags && packet.flags.includes('FIN') && packet.flags.includes('SYN')) {
    return {
      alert_type: 'PROTOCOL_ANOMALY',
      severity: 'warning',
      source_ip: packet.source_ip,
      destination_ip: packet.destination_ip,
      description: `Unusual TCP flags detected: ${packet.flags} from ${packet.source_ip}`,
      detection_rule: 'protocol_anomaly_detection',
      packet_count: 1,
    }
  }

  // Check for all flags set
  if (packet.flags === 'FIN,SYN,RST,PSH,ACK,URG') {
    return {
      alert_type: 'PROTOCOL_ANOMALY',
      severity: 'critical',
      source_ip: packet.source_ip,
      destination_ip: packet.destination_ip,
      description: `All TCP flags set (xmas scan) from ${packet.source_ip}`,
      detection_rule: 'protocol_anomaly_detection',
      packet_count: 1,
    }
  }

  return null
}

/**
 * Detect geographic anomalies (check against suspicious IP ranges)
 */
function detectGeoAnomaly(packet: SimulatedPacket): DetectionAlert | null {
  // Simulate geographic anomaly detection
  // In real implementation, would check against GeoIP database
  const suspiciousPatterns = [
    /^203\.0\.113\./,
    /^198\.51\.100\./,
    /^192\.0\.2\./,
  ]

  const isSuspiciousIP = suspiciousPatterns.some(pattern => pattern.test(packet.source_ip))

  if (isSuspiciousIP && Math.random() > 0.7) {
    return {
      alert_type: 'GEO_ANOMALY',
      severity: 'info',
      source_ip: packet.source_ip,
      destination_ip: packet.destination_ip,
      description: `Geographic anomaly detected: connection from unusual location (${packet.source_ip})`,
      detection_rule: 'geographic_anomaly_detection',
      packet_count: 1,
    }
  }

  return null
}

/**
 * Run all detection rules on a packet
 */
export function detectThreats(packet: SimulatedPacket, blacklistedIPs: Set<string>): DetectionAlert[] {
  const alerts: DetectionAlert[] = []

  // Check blacklist
  if (blacklistedIPs.has(packet.source_ip)) {
    alerts.push({
      alert_type: 'BLACKLIST_HIT',
      severity: 'high',
      source_ip: packet.source_ip,
      destination_ip: packet.destination_ip,
      description: `Blacklisted IP detected: ${packet.source_ip}`,
      detection_rule: 'blacklist_checking',
      packet_count: 1,
    })
  }

  // Run detection rules
  const portScanAlert = detectPortScan(packet)
  if (portScanAlert) alerts.push(portScanAlert)

  const dosAlert = detectDoS(packet)
  if (dosAlert) alerts.push(dosAlert)

  const protocolAlert = detectProtocolAnomaly(packet)
  if (protocolAlert) alerts.push(protocolAlert)

  const geoAlert = detectGeoAnomaly(packet)
  if (geoAlert) alerts.push(geoAlert)

  return alerts
}

/**
 * Reset all trackers (useful for testing)
 */
export function resetTrackers() {
  portScanTracker.clear()
  dosTracker.clear()
  protocolAnomalyTracker.clear()
}
