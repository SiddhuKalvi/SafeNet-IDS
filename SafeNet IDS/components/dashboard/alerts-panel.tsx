'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { Alert } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, AlertTriangle, AlertOctagon, Info, Loader2 } from 'lucide-react'

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiClient.getAlerts(20)
        setAlerts(data.alerts)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch alerts')
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
    const interval = setInterval(fetchAlerts, 3000) // Refresh every 3 seconds
    return () => clearInterval(interval)
  }, [])

  const getSeverityConfig = (severity: string) => {
    const configs: Record<
      string,
      { icon: typeof AlertCircle; color: string; bgColor: string; textColor: string }
    > = {
      critical: {
        icon: AlertOctagon,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        textColor: 'text-red-800',
      },
      high: {
        icon: AlertTriangle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-800',
      },
      medium: {
        icon: AlertCircle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-800',
      },
      low: {
        icon: Info,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-800',
      },
    }
    return configs[severity] || configs.low
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Security Alerts</CardTitle>
        <CardDescription>Recent intrusion detection alerts</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        {loading && !alerts.length ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : (
          <div className="space-y-2 overflow-y-auto flex-1">
            {alerts.length > 0 ? (
              alerts.map((alert) => {
                const config = getSeverityConfig(alert.severity)
                const IconComponent = config.icon
                return (
                  <div key={alert.id} className={`${config.bgColor} rounded-lg p-3 border border-current border-opacity-10`}>
                    <div className="flex items-start gap-3">
                      <IconComponent className={`${config.color} h-5 w-5 flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${config.textColor} ${config.bgColor} border-current border-opacity-20`}>
                            {alert.alert_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className={`text-xs font-medium ${config.textColor}`}>{alert.severity.toUpperCase()}</span>
                        </div>
                        <p className={`text-sm ${config.textColor} break-words`}>{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          From <span className="font-mono">{alert.src_ip}</span>
                          {alert.dst_ip && <> to <span className="font-mono">{alert.dst_ip}</span></>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {!alert.resolved && (
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex items-center justify-center flex-1 text-muted-foreground">
                <p className="text-sm">No alerts detected</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
