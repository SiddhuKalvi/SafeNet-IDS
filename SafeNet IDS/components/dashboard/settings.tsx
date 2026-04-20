'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Check, Copy, Database, Server, Shield } from 'lucide-react'
import { toast } from 'sonner'

export function Settings() {
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(5)
  const [packetRetention, setPacketRetention] = useState(24)
  const [maxPackets, setMaxPackets] = useState(10000)
  const [enableWebSocket, setEnableWebSocket] = useState(true)
  const [alertingEnabled, setAlertingEnabled] = useState(true)

  const handleCopyApiUrl = () => {
    navigator.clipboard.writeText(apiUrl)
    toast.success('API URL copied to clipboard')
  }

  const handleSaveSettings = () => {
    // In a real app, this would save to localStorage or a backend
    localStorage.setItem('idsSettings', JSON.stringify({
      autoRefresh,
      refreshInterval,
      packetRetention,
      maxPackets,
      enableWebSocket,
      alertingEnabled,
    }))
    toast.success('Settings saved successfully')
  }

  const handleExportConfig = () => {
    const config = {
      apiUrl,
      autoRefresh,
      refreshInterval,
      packetRetention,
      maxPackets,
      enableWebSocket,
      alertingEnabled,
      exportedAt: new Date().toISOString(),
    }
    const json = JSON.stringify(config, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `safenet-ids-config-${new Date().getTime()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Configuration exported')
  }

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="database">Database</TabsTrigger>
        <TabsTrigger value="alerts">Alerts</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Configure basic application settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="api-url">API Server URL</Label>
              <div className="flex gap-2">
                <Input id="api-url" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="flex-1" />
                <Button onClick={handleCopyApiUrl} variant="outline" size="sm" className="gap-2">
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Configure the backend API endpoint for the dashboard</p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="refresh">Auto-Refresh Dashboard</Label>
              <div className="flex items-center gap-3">
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} id="refresh" />
                <span className="text-sm text-muted-foreground">{autoRefresh ? 'Enabled' : 'Disabled'}</span>
              </div>
              <p className="text-xs text-muted-foreground">Automatically refresh data at configured intervals</p>
            </div>

            {autoRefresh && (
              <div className="space-y-3">
                <Label htmlFor="interval">Refresh Interval (seconds)</Label>
                <Input
                  id="interval"
                  type="number"
                  min="1"
                  max="60"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Dashboard will refresh every {refreshInterval} seconds
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button onClick={handleSaveSettings} className="gap-2">
                <Check className="h-4 w-4" />
                Save General Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="database" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Configuration</CardTitle>
            <CardDescription>Manage database and data retention settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>Database: SQLite (ids_database.db) • Auto-backup enabled</AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Label htmlFor="retention">Packet Retention (hours)</Label>
              <Input
                id="retention"
                type="number"
                min="1"
                max="720"
                value={packetRetention}
                onChange={(e) => setPacketRetention(parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Packets older than {packetRetention} hours will be automatically deleted
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="max-packets">Maximum Packets in Memory</Label>
              <Input
                id="max-packets"
                type="number"
                min="1000"
                max="100000"
                value={maxPackets}
                onChange={(e) => setMaxPackets(parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                System will keep up to {maxPackets.toLocaleString()} packets in buffer
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Database Statistics</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="border rounded-lg p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Tables</p>
                  <p className="text-lg font-semibold">11</p>
                </div>
                <div className="border rounded-lg p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className="w-fit">Connected</Badge>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={handleSaveSettings} className="gap-2">
                <Check className="h-4 w-4" />
                Save Database Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="alerts" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Alert Configuration</CardTitle>
            <CardDescription>Configure alert behavior and notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="alerting">Enable Alerting</Label>
              <div className="flex items-center gap-3">
                <Switch checked={alertingEnabled} onCheckedChange={setAlertingEnabled} id="alerting" />
                <span className="text-sm text-muted-foreground">{alertingEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {alertingEnabled
                  ? 'Alerts will be generated when threats are detected'
                  : 'Alert generation is currently disabled'}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Alert Severity Levels</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-600" />
                    <span className="text-sm font-medium">Critical</span>
                  </div>
                  <Badge>Immediate</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-orange-600" />
                    <span className="text-sm font-medium">High</span>
                  </div>
                  <Badge variant="secondary">Important</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-600" />
                    <span className="text-sm font-medium">Medium</span>
                  </div>
                  <Badge variant="secondary">Notice</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-600" />
                    <span className="text-sm font-medium">Low</span>
                  </div>
                  <Badge variant="secondary">Info</Badge>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={handleSaveSettings} className="gap-2">
                <Check className="h-4 w-4" />
                Save Alert Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="advanced" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Advanced Configuration</CardTitle>
            <CardDescription>Advanced settings for power users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="websocket">Enable WebSocket Support</Label>
              <div className="flex items-center gap-3">
                <Switch checked={enableWebSocket} onCheckedChange={setEnableWebSocket} id="websocket" />
                <span className="text-sm text-muted-foreground">{enableWebSocket ? 'Enabled' : 'Disabled'}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Real-time updates via WebSocket connection (experimental)
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                WebSocket support enables real-time packet and alert streaming for lower latency updates
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">System Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm border-b pb-2">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between text-sm border-b pb-2">
                  <span className="text-muted-foreground">API Version</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between text-sm border-b pb-2">
                  <span className="text-muted-foreground">Database Type</span>
                  <span className="font-medium">SQLite</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Detection Rules</span>
                  <span className="font-medium">6 Active</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <Button onClick={handleExportConfig} variant="outline" className="w-full gap-2">
                <Server className="h-4 w-4" />
                Export Configuration
              </Button>
              <Button onClick={handleSaveSettings} className="w-full gap-2">
                <Check className="h-4 w-4" />
                Save Advanced Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
