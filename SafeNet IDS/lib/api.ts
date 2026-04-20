import { Packet, Alert, Log, Statistics, DetectionRule, BlacklistItem, WhitelistItem } from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class APIClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE) {
    this.baseURL = baseURL
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  }

  // Packet endpoints
  async getPackets(limit: number = 100, offset: number = 0): Promise<{ packets: Packet[]; count: number }> {
    return this.request(`/packets?limit=${limit}&offset=${offset}`)
  }

  // Alert endpoints
  async getAlerts(limit: number = 100, offset: number = 0, severity?: string): Promise<{ alerts: Alert[]; count: number }> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (severity) params.append('severity', severity)
    return this.request(`/alerts?${params}`)
  }

  async resolveAlert(alertId: number): Promise<void> {
    return this.request(`/alerts/${alertId}`, { method: 'PATCH' })
  }

  // Log endpoints
  async getLogs(
    limit: number = 100,
    offset: number = 0,
    eventType?: string,
    srcIp?: string
  ): Promise<{ logs: Log[]; count: number }> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (eventType) params.append('event_type', eventType)
    if (srcIp) params.append('src_ip', srcIp)
    return this.request(`/logs?${params}`)
  }

  // Detection rule endpoints
  async getRules(): Promise<{ rules: DetectionRule[] }> {
    return this.request('/rules')
  }

  async updateRule(ruleId: number, data: Partial<DetectionRule>): Promise<void> {
    return this.request(`/rules/${ruleId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Blacklist endpoints
  async getBlacklist(): Promise<{ blacklist: BlacklistItem[] }> {
    return this.request('/blacklist')
  }

  async addToBlacklist(ipAddress: string, reason?: string): Promise<void> {
    return this.request('/blacklist', {
      method: 'POST',
      body: JSON.stringify({ ip_address: ipAddress, reason }),
    })
  }

  async removeFromBlacklist(ipAddress: string): Promise<void> {
    return this.request(`/blacklist/${ipAddress}`, { method: 'DELETE' })
  }

  // Whitelist endpoints
  async getWhitelist(): Promise<{ whitelist: WhitelistItem[] }> {
    return this.request('/whitelist')
  }

  async addToWhitelist(ipAddress: string, description?: string): Promise<void> {
    return this.request('/whitelist', {
      method: 'POST',
      body: JSON.stringify({ ip_address: ipAddress, description }),
    })
  }

  async removeFromWhitelist(ipAddress: string): Promise<void> {
    return this.request(`/whitelist/${ipAddress}`, { method: 'DELETE' })
  }

  // Statistics endpoint
  async getStatistics(): Promise<Statistics> {
    return this.request('/stats')
  }

  // Capture control
  async startCapture(useSimulation: boolean = true, interface_?: string): Promise<void> {
    const params = new URLSearchParams({ use_simulation: String(useSimulation) })
    if (interface_) params.append('interface', interface_)
    return this.request(`/capture/start?${params}`, { method: 'POST' })
  }

  async stopCapture(): Promise<void> {
    return this.request('/capture/stop', { method: 'POST' })
  }

  // Health check
  async healthCheck(): Promise<{ status: string; database: boolean; capture_running: boolean }> {
    return this.request('/health')
  }
}

export const apiClient = new APIClient()
