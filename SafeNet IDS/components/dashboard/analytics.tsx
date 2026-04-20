'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { Alert, Packet } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Badge } from '@/components/ui/badge'

export function Analytics() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [packets, setPackets] = useState<Packet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [alertData, packetData] = await Promise.all([apiClient.getAlerts(200), apiClient.getPackets(200)])
      setAlerts(alertData.alerts)
      setPackets(packetData.packets)
    } catch (err) {
      console.error('Failed to fetch analytics data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Prepare data for alert timeline
  const alertTimeline = alerts.reduce(
    (acc, alert) => {
      const time = new Date(alert.timestamp).toLocaleTimeString()
      const existing = acc.find((a) => a.time === time)
      if (existing) {
        existing.count++
      } else {
        acc.push({ time, count: 1 })
      }
      return acc
    },
    [] as { time: string; count: number }[]
  )

  // Prepare data for protocol distribution
  const protocolDistribution = packets.reduce(
    (acc, packet) => {
      const existing = acc.find((p) => p.name === packet.protocol)
      if (existing) {
        existing.count++
      } else {
        acc.push({ name: packet.protocol, count: 1 })
      }
      return acc
    },
    [] as { name: string; count: number }[]
  )

  // Prepare data for severity distribution
  const severityDistribution = alerts.reduce(
    (acc, alert) => {
      const existing = acc.find((s) => s.name === alert.severity)
      if (existing) {
        existing.count++
      } else {
        acc.push({ name: alert.severity, count: 1 })
      }
      return acc
    },
    [] as { name: string; count: number }[]
  )

  // Prepare data for top source IPs
  const topSourceIPs = packets
    .reduce(
      (acc, packet) => {
        const existing = acc.find((ip) => ip.ip === packet.src_ip)
        if (existing) {
          existing.count++
        } else {
          acc.push({ ip: packet.src_ip, count: 1 })
        }
        return acc
      },
      [] as { ip: string; count: number }[]
    )
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Prepare data for top destination IPs
  const topDestIPs = packets
    .reduce(
      (acc, packet) => {
        const existing = acc.find((ip) => ip.ip === packet.dst_ip)
        if (existing) {
          existing.count++
        } else {
          acc.push({ ip: packet.dst_ip, count: 1 })
        }
        return acc
      },
      [] as { ip: string; count: number }[]
    )
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899']

  return (
    <Tabs defaultValue="timeline" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="timeline">Alert Timeline</TabsTrigger>
        <TabsTrigger value="protocols">Protocols</TabsTrigger>
        <TabsTrigger value="severity">Severity</TabsTrigger>
        <TabsTrigger value="ips">Top IPs</TabsTrigger>
      </TabsList>

      <TabsContent value="timeline">
        <Card>
          <CardHeader>
            <CardTitle>Alert Timeline</CardTitle>
            <CardDescription>Alert frequency over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={alertTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="protocols">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Protocol Distribution</CardTitle>
              <CardDescription>Network protocol breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={protocolDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {protocolDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Protocol Statistics</CardTitle>
              <CardDescription>Detailed protocol counts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {protocolDistribution.map((protocol) => (
                  <div key={protocol.name} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{protocol.name}</span>
                    <Badge variant="outline">{protocol.count} packets</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="severity">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Severity Distribution</CardTitle>
              <CardDescription>Alerts by severity level</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={severityDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Severity Breakdown</CardTitle>
              <CardDescription>Alert count by level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {severityDistribution.map((severity, index) => {
                  const severityColor: Record<string, string> = {
                    critical: 'bg-red-100 text-red-800',
                    high: 'bg-orange-100 text-orange-800',
                    medium: 'bg-yellow-100 text-yellow-800',
                    low: 'bg-blue-100 text-blue-800',
                  }
                  return (
                    <div key={severity.name} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{severity.name}</span>
                      <Badge className={severityColor[severity.name as keyof typeof severityColor] || ''}>
                        {severity.count} alerts
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="ips">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Source IPs</CardTitle>
              <CardDescription>Most active source addresses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={topSourceIPs}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="ip" type="category" width={95} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Destination IPs</CardTitle>
              <CardDescription>Most targeted addresses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={topDestIPs}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="ip" type="category" width={95} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
}
