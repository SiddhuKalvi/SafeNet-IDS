import { createClient } from '@/lib/mock-db';
import type { CapturedPacket } from './packet-capture';

export interface DetectionAlert {
  alertType: string;
  severity: 'info' | 'warning' | 'critical';
  sourceIp: string;
  destinationIp: string;
  description: string;
  detectionRule: string;
}

interface IpActivity {
  [ip: string]: {
    ports: Set<number>;
    packetCount: number;
    bytes: number;
    lastSeen: Date;
    protocols: Set<string>;
  };
}

interface GeolocationCache {
  [ip: string]: {
    country: string;
    isAnomaly: boolean;
  };
}

export class DetectionEngine {
  private supabase: any;
  private ipActivity: IpActivity = {};
  private blacklistedIps: Set<string> = new Set();
  private whitelistedIps: Set<string> = new Set();
  private geolocationCache: GeolocationCache = {};
  private lastPortScanCheck: { [ip: string]: Date } = {};
  private lastDoSCheck: { [ip: string]: Date } = {};

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.loadBlacklistAndWhitelist();
  }

  /**
   * Load blacklist and whitelist from database
   */
  private async loadBlacklistAndWhitelist(): Promise<void> {
    try {
      const [blacklist, whitelist] = await Promise.all([
        this.supabase.from('ip_blacklist').select('ip_address'),
        this.supabase.from('ip_whitelist').select('ip_address'),
      ]);

      if (blacklist.data) {
        blacklist.data.forEach((item: any) => {
          this.blacklistedIps.add(item.ip_address);
        });
      }

      if (whitelist.data) {
        whitelist.data.forEach((item: any) => {
          this.whitelistedIps.add(item.ip_address);
        });
      }

      console.log(`[v0] Loaded ${this.blacklistedIps.size} blacklisted and ${this.whitelistedIps.size} whitelisted IPs`);
    } catch (error) {
      console.error('[v0] Failed to load blacklist/whitelist:', error);
    }
  }

  /**
   * Process a captured packet through all detection rules
   */
  async analyzePacket(packet: CapturedPacket): Promise<DetectionAlert[]> {
    const alerts: DetectionAlert[] = [];

    try {
      // Store packet in database
      await this.storePacket(packet);

      // Track IP activity
      this.updateIpActivity(packet);

      // Run detection rules
      const blacklistAlert = await this.checkBlacklist(packet);
      if (blacklistAlert) alerts.push(blacklistAlert);

      const portScanAlert = await this.detectPortScanning(packet);
      if (portScanAlert) alerts.push(portScanAlert);

      const dosAlert = await this.detectDoS(packet);
      if (dosAlert) alerts.push(dosAlert);

      const protocolAlert = await this.detectProtocolAnomalies(packet);
      if (protocolAlert) alerts.push(protocolAlert);

      const geoAlert = await this.detectGeographicAnomalies(packet);
      if (geoAlert) alerts.push(geoAlert);

      // Store alerts in database
      for (const alert of alerts) {
        await this.storeAlert(alert);
      }
    } catch (error) {
      console.error('[v0] Error analyzing packet:', error);
    }

    return alerts;
  }

  /**
   * Store captured packet in database
   */
  private async storePacket(packet: CapturedPacket): Promise<void> {
    try {
      await this.supabase.from('packets').insert({
        source_ip: packet.sourceIp,
        destination_ip: packet.destinationIp,
        source_port: packet.sourcePort,
        destination_port: packet.destinationPort,
        protocol: packet.protocol,
        packet_size: packet.packetSize,
        flags: packet.flags,
        timestamp: packet.timestamp.toISOString(),
      });
    } catch (error) {
      console.error('[v0] Failed to store packet:', error);
    }
  }

  /**
   * Store alert in database
   */
  private async storeAlert(alert: DetectionAlert): Promise<void> {
    try {
      await this.supabase.from('alerts').insert({
        alert_type: alert.alertType,
        severity: alert.severity,
        source_ip: alert.sourceIp,
        destination_ip: alert.destinationIp,
        description: alert.description,
        detection_rule: alert.detectionRule,
      });
    } catch (error) {
      console.error('[v0] Failed to store alert:', error);
    }
  }

  /**
   * Update IP activity tracking
   */
  private updateIpActivity(packet: CapturedPacket): void {
    if (!this.ipActivity[packet.sourceIp]) {
      this.ipActivity[packet.sourceIp] = {
        ports: new Set(),
        packetCount: 0,
        bytes: 0,
        lastSeen: new Date(),
        protocols: new Set(),
      };
    }

    const activity = this.ipActivity[packet.sourceIp];
    if (packet.sourcePort) activity.ports.add(packet.sourcePort);
    activity.packetCount++;
    activity.bytes += packet.packetSize;
    activity.lastSeen = new Date();
    activity.protocols.add(packet.protocol);
  }

  /**
   * Detect blacklisted IPs
   */
  private async checkBlacklist(packet: CapturedPacket): Promise<DetectionAlert | null> {
    if (this.blacklistedIps.has(packet.sourceIp)) {
      return {
        alertType: 'blacklist_match',
        severity: 'critical',
        sourceIp: packet.sourceIp,
        destinationIp: packet.destinationIp,
        description: `Connection from blacklisted IP: ${packet.sourceIp}`,
        detectionRule: 'blacklist_check',
      };
    }

    return null;
  }

  /**
   * Detect potential port scanning activity
   */
  private async detectPortScanning(packet: CapturedPacket): Promise<DetectionAlert | null> {
    const sourceIp = packet.sourceIp;
    const activity = this.ipActivity[sourceIp];

    if (!activity) return null;

    // Check if same IP accessed multiple different ports within time window
    if (activity.ports.size >= 10) {
      const now = new Date();
      const lastCheck = this.lastPortScanCheck[sourceIp];

      if (!lastCheck || now.getTime() - lastCheck.getTime() > 60000) {
        this.lastPortScanCheck[sourceIp] = now;

        await this.supabase.from('port_scan_events').insert({
          source_ip: sourceIp,
          ports_accessed: Array.from(activity.ports),
          port_count: activity.ports.size,
          is_threat: true,
        });

        return {
          alertType: 'port_scanning',
          severity: 'warning',
          sourceIp: sourceIp,
          destinationIp: packet.destinationIp,
          description: `Potential port scanning detected: ${activity.ports.size} ports accessed from ${sourceIp}`,
          detectionRule: 'port_scan_detection',
        };
      }
    }

    return null;
  }

  /**
   * Detect potential DoS attacks
   */
  private async detectDoS(packet: CapturedPacket): Promise<DetectionAlert | null> {
    const sourceIp = packet.sourceIp;
    const activity = this.ipActivity[sourceIp];

    if (!activity) return null;

    // Check if excessive packets from same IP within time window
    if (activity.packetCount >= 1000) {
      const now = new Date();
      const lastCheck = this.lastDoSCheck[sourceIp];

      if (!lastCheck || now.getTime() - lastCheck.getTime() > 10000) {
        this.lastDoSCheck[sourceIp] = now;

        await this.supabase.from('dos_events').insert({
          source_ip: sourceIp,
          packet_count: activity.packetCount,
          bytes_sent: activity.bytes,
          target_ip: packet.destinationIp,
          is_threat: true,
        });

        return {
          alertType: 'dos_attack',
          severity: 'critical',
          sourceIp: sourceIp,
          destinationIp: packet.destinationIp,
          description: `Potential DoS attack detected: ${activity.packetCount} packets from ${sourceIp}`,
          detectionRule: 'dos_attack_detection',
        };
      }
    }

    return null;
  }

  /**
   * Detect protocol anomalies
   */
  private async detectProtocolAnomalies(packet: CapturedPacket): Promise<DetectionAlert | null> {
    const sourceIp = packet.sourceIp;
    const activity = this.ipActivity[sourceIp];

    if (!activity || activity.protocols.size < 5) return null;

    // If IP uses too many different protocols, it might be suspicious
    if (activity.protocols.size >= 5) {
      await this.supabase.from('protocol_anomalies').insert({
        source_ip: sourceIp,
        protocol: packet.protocol,
        anomaly_type: 'multi_protocol_usage',
        description: `IP using ${activity.protocols.size} different protocols`,
        severity: 'warning',
      });

      return {
        alertType: 'protocol_anomaly',
        severity: 'warning',
        sourceIp: sourceIp,
        destinationIp: packet.destinationIp,
        description: `Unusual protocol activity: ${activity.protocols.size} different protocols from ${sourceIp}`,
        detectionRule: 'protocol_anomaly',
      };
    }

    return null;
  }

  /**
   * Detect geographic anomalies
   */
  private async detectGeographicAnomalies(packet: CapturedPacket): Promise<DetectionAlert | null> {
    // This would normally check against a geolocation database
    // For now, we'll simulate it based on IP ranges
    const sourceIp = packet.sourceIp;

    if (this.geolocationCache[sourceIp]) {
      const geo = this.geolocationCache[sourceIp];
      if (geo.isAnomaly) {
        return {
          alertType: 'geographic_anomaly',
          severity: 'warning',
          sourceIp: sourceIp,
          destinationIp: packet.destinationIp,
          description: `Connection from unusual geographic location: ${geo.country}`,
          detectionRule: 'geographic_anomaly',
        };
      }
    }

    return null;
  }

  /**
   * Add IP to blacklist
   */
  async addToBlacklist(ip: string, reason: string, threatLevel: string = 'high'): Promise<void> {
    try {
      await this.supabase.from('ip_blacklist').insert({
        ip_address: ip,
        reason,
        threat_level: threatLevel,
      });
      this.blacklistedIps.add(ip);
      console.log(`[v0] Added ${ip} to blacklist`);
    } catch (error) {
      console.error('[v0] Failed to add to blacklist:', error);
    }
  }

  /**
   * Add IP to whitelist
   */
  async addToWhitelist(ip: string, description: string = ''): Promise<void> {
    try {
      await this.supabase.from('ip_whitelist').insert({
        ip_address: ip,
        description,
      });
      this.whitelistedIps.add(ip);
      console.log(`[v0] Added ${ip} to whitelist`);
    } catch (error) {
      console.error('[v0] Failed to add to whitelist:', error);
    }
  }
}

export default DetectionEngine;
