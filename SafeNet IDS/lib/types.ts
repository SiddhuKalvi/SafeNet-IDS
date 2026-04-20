export interface Packet {
  id: number
  timestamp: string
  src_ip: string
  dst_ip: string
  src_port: number | null
  dst_port: number | null
  protocol: string
  packet_size: number
  flags: string
  payload: string | null
}

export interface Alert {
  id: number
  timestamp: string
  alert_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  src_ip: string
  dst_ip: string | null
  message: string
  packet_count: number
  rule_id: number | null
  resolved: boolean
}

export interface Log {
  id: number
  timestamp: string
  event_type: string
  src_ip: string
  dst_ip: string | null
  port: number | null
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface BlacklistItem {
  id: number
  ip_address: string
  reason: string | null
  added_at: string
  expires_at: string | null
}

export interface WhitelistItem {
  id: number
  ip_address: string
  description: string | null
  added_at: string
}

export interface DetectionRule {
  id: number
  rule_name: string
  rule_type: 'port_scan' | 'dos' | 'blacklist' | 'whitelist' | 'protocol_anomaly' | 'geo_anomaly'
  enabled: boolean
  threshold: number
  time_window: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  created_at: string
}

export interface Statistics {
  total_packets: number
  total_alerts: number
  suspicious_ips: number
  critical_alerts: number
  alerts_by_type: Record<string, number>
}

export interface HealthStatus {
  status: string
  database: boolean
  capture_running: boolean
}
