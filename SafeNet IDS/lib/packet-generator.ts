// Simulated packet generator for realistic IDS testing

export interface SimulatedPacket {
  source_ip: string
  destination_ip: string
  source_port: number
  destination_port: number
  protocol: 'TCP' | 'UDP' | 'ICMP'
  packet_size: number
  flags?: string
}

const commonIPs = {
  internal: ['192.168.1.', '192.168.2.', '10.0.0.'],
  external: [
    '203.0.113.',
    '198.51.100.',
    '192.0.2.',
    '8.8.8.8',
    '1.1.1.1',
    '8.8.4.4',
  ],
  suspicious: [
    '192.0.2.50',
    '198.51.100.99',
    '203.0.113.42',
    '192.0.2.15',
    '198.51.100.77',
  ],
}

const commonPorts = {
  web: [80, 443, 8080, 8443],
  database: [3306, 5432, 27017, 6379],
  ssh: [22],
  dns: [53],
  smtp: [25, 587],
  high: Array.from({ length: 100 }, (_, i) => 49000 + i),
}

function generateIP(range: string[]): string {
  const prefix = range[Math.floor(Math.random() * range.length)]
  if (prefix.includes('.')) {
    return prefix + Math.floor(Math.random() * 255)
  }
  return prefix
}

function getRandomPort(category: keyof typeof commonPorts): number {
  const ports = commonPorts[category]
  return ports[Math.floor(Math.random() * ports.length)]
}

function getRandomProtocol(): 'TCP' | 'UDP' | 'ICMP' {
  const protocols: ('TCP' | 'UDP' | 'ICMP')[] = ['TCP', 'UDP', 'ICMP']
  return protocols[Math.floor(Math.random() * protocols.length)]
}

/**
 * Generate a normal network packet (legitimate traffic)
 */
export function generateNormalPacket(): SimulatedPacket {
  const isOutbound = Math.random() > 0.5
  const category = ['web', 'database', 'dns', 'smtp'][Math.floor(Math.random() * 4)] as keyof typeof commonPorts

  return {
    source_ip: isOutbound ? generateIP(commonIPs.internal) : generateIP(commonIPs.external),
    destination_ip: isOutbound ? generateIP(commonIPs.external) : generateIP(commonIPs.internal),
    source_port: Math.floor(Math.random() * 65535),
    destination_port: getRandomPort(category),
    protocol: getRandomProtocol(),
    packet_size: Math.floor(Math.random() * 1500) + 20,
  }
}

/**
 * Generate a port scanning attack packet
 */
export function generatePortScanPacket(sourceIp?: string): SimulatedPacket {
  const ip = sourceIp || generateIP(commonIPs.suspicious)
  return {
    source_ip: ip,
    destination_ip: generateIP(commonIPs.internal),
    source_port: Math.floor(Math.random() * 60000) + 5000,
    destination_port: getRandomPort('high'),
    protocol: 'TCP',
    packet_size: 64,
    flags: 'SYN',
  }
}

/**
 * Generate a DoS attack packet
 */
export function generateDoSPacket(sourceIp?: string): SimulatedPacket {
  const ip = sourceIp || generateIP(commonIPs.suspicious)
  return {
    source_ip: ip,
    destination_ip: generateIP(commonIPs.internal),
    source_port: Math.floor(Math.random() * 65535),
    destination_port: getRandomPort('web'),
    protocol: Math.random() > 0.5 ? 'TCP' : 'UDP',
    packet_size: Math.floor(Math.random() * 1500) + 100,
    flags: 'PSH,ACK',
  }
}

/**
 * Generate a protocol anomaly packet
 */
export function generateAnomalyPacket(): SimulatedPacket {
  return {
    source_ip: generateIP(commonIPs.suspicious),
    destination_ip: generateIP(commonIPs.internal),
    source_port: Math.floor(Math.random() * 65535),
    destination_port: getRandomPort('web'),
    protocol: 'TCP',
    packet_size: 5000 + Math.floor(Math.random() * 5000), // Oversized packet
    flags: 'FIN,SYN,RST,PSH,ACK,URG', // All flags set (anomaly)
  }
}

/**
 * Generate geographic anomaly packet (simulated unusual location)
 */
export function generateGeoAnomalyPacket(): SimulatedPacket {
  return {
    source_ip: '203.0.113.' + Math.floor(Math.random() * 255), // Simulated unusual IP
    destination_ip: generateIP(commonIPs.internal),
    source_port: Math.floor(Math.random() * 65535),
    destination_port: getRandomPort('web'),
    protocol: 'TCP',
    packet_size: Math.floor(Math.random() * 1500),
    flags: 'ACK',
  }
}

/**
 * Generate a realistic traffic pattern with varying attack types
 */
export function generateMixedTraffic(): SimulatedPacket[] {
  const packets: SimulatedPacket[] = []
  const normalCount = Math.floor(Math.random() * 15) + 10 // 10-25 normal packets

  // Add normal packets
  for (let i = 0; i < normalCount; i++) {
    packets.push(generateNormalPacket())
  }

  // Randomly add attacks
  const attackTypes = [
    () => {
      // Port scan cluster
      const ip = generateIP(commonIPs.suspicious)
      return Array.from({ length: 6 }, () => generatePortScanPacket(ip))
    },
    () => {
      // DoS cluster
      const ip = generateIP(commonIPs.suspicious)
      return Array.from({ length: 12 }, () => generateDoSPacket(ip))
    },
    () => {
      // Protocol anomalies
      return Array.from({ length: 3 }, () => generateAnomalyPacket())
    },
    () => {
      // Geographic anomalies
      return Array.from({ length: 2 }, () => generateGeoAnomalyPacket())
    },
  ]

  if (Math.random() > 0.4) {
    const randomAttack = attackTypes[Math.floor(Math.random() * attackTypes.length)]
    packets.push(...randomAttack())
  }

  return packets
}
