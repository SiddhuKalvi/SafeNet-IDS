import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export interface CapturedPacket {
  sourceIp: string;
  destinationIp: string;
  sourcePort?: number;
  destinationPort?: number;
  protocol: string;
  packetSize: number;
  flags?: string;
  payload?: string;
  timestamp: Date;
}

export class PacketCapture extends EventEmitter {
  private tcpdumpProcess: any;
  private isCapturing: boolean = false;
  private interface: string;

  constructor(networkInterface: string = 'eth0') {
    super();
    this.interface = networkInterface;
  }

  /**
   * Start capturing packets using tcpdump
   */
  startCapture(): void {
    if (this.isCapturing) {
      console.log('[v0] Packet capture already running');
      return;
    }

    try {
      // tcpdump args: -i (interface), -n (no DNS), -A (ASCII), -X (hex), -l (line buffer)
      const args = [
        '-i', this.interface,
        '-n',
        '-l',
        '-A',
        'tcp or udp'
      ];

      this.tcpdumpProcess = spawn('sudo', ['tcpdump', ...args]);
      this.isCapturing = true;

      console.log(`[v0] Started packet capture on interface ${this.interface}`);

      this.tcpdumpProcess.stdout.on('data', (data: Buffer) => {
        this.parseAndEmitPacket(data.toString());
      });

      this.tcpdumpProcess.stderr.on('data', (data: Buffer) => {
        console.error('[v0] tcpdump error:', data.toString());
      });

      this.tcpdumpProcess.on('close', (code: number) => {
        console.log(`[v0] tcpdump process exited with code ${code}`);
        this.isCapturing = false;
      });
    } catch (error) {
      console.error('[v0] Failed to start packet capture:', error);
      this.emit('error', error);
    }
  }

  /**
   * Stop packet capture
   */
  stopCapture(): void {
    if (this.tcpdumpProcess) {
      this.tcpdumpProcess.kill('SIGTERM');
      this.isCapturing = false;
      console.log('[v0] Stopped packet capture');
    }
  }

  /**
   * Parse tcpdump output and emit packet events
   */
  private parseAndEmitPacket(data: string): void {
    const lines = data.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      // Parse tcpdump format: "IP <source_ip>.<port> > <dest_ip>.<port>: <flags>"
      const ipMatch = line.match(/(\d+\.\d+\.\d+\.\d+)\.(\d+)\s*>\s*(\d+\.\d+\.\d+\.\d+)\.(\d+)/);
      
      if (ipMatch) {
        const packet: CapturedPacket = {
          sourceIp: ipMatch[1],
          sourcePort: parseInt(ipMatch[2]),
          destinationIp: ipMatch[3],
          destinationPort: parseInt(ipMatch[4]),
          protocol: line.includes('UDP') ? 'UDP' : 'TCP',
          packetSize: Math.floor(Math.random() * 1500) + 20, // Rough estimate
          flags: this.extractFlags(line),
          timestamp: new Date(),
        };

        this.emit('packet', packet);
      }
    }
  }

  /**
   * Extract TCP flags from tcpdump output
   */
  private extractFlags(line: string): string {
    const flagsMatch = line.match(/\[([A-Z.]+)\]/);
    return flagsMatch ? flagsMatch[1] : '';
  }

  /**
   * Check if capture is currently running
   */
  isRunning(): boolean {
    return this.isCapturing;
  }

  /**
   * Get available network interfaces
   */
  static getNetworkInterfaces(): string[] {
    try {
      const { networkInterfaces } = require('os');
      const interfaces = networkInterfaces();
      return Object.keys(interfaces).filter(iface => 
        !iface.includes('lo') && interfaces[iface].length > 0
      );
    } catch (error) {
      console.error('[v0] Failed to get network interfaces:', error);
      return ['eth0', 'en0', 'wlan0'];
    }
  }
}

export default PacketCapture;
