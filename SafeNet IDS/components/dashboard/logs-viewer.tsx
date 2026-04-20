'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { Log } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Search } from 'lucide-react'

export function LogsViewer() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchIP, setSearchIP] = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => {
    fetchLogs()
  }, [page, searchIP])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getLogs(50, page * 50, undefined, searchIP || undefined)
      setLogs(data.logs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800',
    }
    return colors[severity] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Intrusion Logs</CardTitle>
        <CardDescription>Historical intrusion detection events</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <div className="mb-4 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by source IP..."
              value={searchIP}
              onChange={(e) => {
                setSearchIP(e.target.value)
                setPage(0)
              }}
              className="pl-9"
            />
          </div>
        </div>

        {loading && !logs.length ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : (
          <div className="overflow-x-auto flex-1 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Timestamp</TableHead>
                  <TableHead className="w-20">Type</TableHead>
                  <TableHead>Source IP</TableHead>
                  <TableHead>Dest IP</TableHead>
                  <TableHead className="w-16">Port</TableHead>
                  <TableHead className="w-20">Severity</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id} className="text-xs">
                      <TableCell className="font-mono text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.event_type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">{log.src_ip}</TableCell>
                      <TableCell className="font-mono">{log.dst_ip || '—'}</TableCell>
                      <TableCell className="text-center">{log.port || '—'}</TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(log.severity)}>{log.severity}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">{log.description}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {logs.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <Button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} variant="outline" size="sm">
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page + 1}</span>
            <Button onClick={() => setPage(page + 1)} disabled={logs.length < 50} variant="outline" size="sm">
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
