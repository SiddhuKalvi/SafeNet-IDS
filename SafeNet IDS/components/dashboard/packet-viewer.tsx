'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { Packet } from '@/lib/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

export function PacketViewer() {
  const [packets, setPackets] = useState<Packet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPackets = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiClient.getPackets(50)
        setPackets(data.packets)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch packets')
      } finally {
        setLoading(false)
      }
    }

    fetchPackets()
    const interval = setInterval(fetchPackets, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const getProtocolColor = (protocol: string) => {
    const colors: Record<string, string> = {
      TCP: 'bg-blue-100 text-blue-800',
      UDP: 'bg-green-100 text-green-800',
      ICMP: 'bg-orange-100 text-orange-800',
      IP: 'bg-gray-100 text-gray-800',
    }
    return colors[protocol] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Network Packets</CardTitle>
        <CardDescription>Real-time packet capture and analysis</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {loading && !packets.length ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Timestamp</TableHead>
                  <TableHead>Source IP</TableHead>
                  <TableHead>Dest IP</TableHead>
                  <TableHead className="w-20">Protocol</TableHead>
                  <TableHead className="w-20">Size</TableHead>
                  <TableHead className="w-20">Ports</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packets.length > 0 ? (
                  packets.map((packet) => (
                    <TableRow key={packet.id} className="text-xs">
                      <TableCell className="font-mono text-muted-foreground">
                        {new Date(packet.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="font-mono">{packet.src_ip}</TableCell>
                      <TableCell className="font-mono">{packet.dst_ip}</TableCell>
                      <TableCell>
                        <Badge className={getProtocolColor(packet.protocol)}>{packet.protocol}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{packet.packet_size}B</TableCell>
                      <TableCell className="text-right">
                        {packet.src_port && packet.dst_port ? `${packet.src_port}→${packet.dst_port}` : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No packets captured yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
