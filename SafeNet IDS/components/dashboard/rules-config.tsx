'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { DetectionRule } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function RulesConfig() {
  const [rules, setRules] = useState<DetectionRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getRules()
      setRules(data.rules)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rules')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRule = async (rule: DetectionRule) => {
    try {
      await apiClient.updateRule(rule.id, { enabled: !rule.enabled })
      setRules(rules.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r)))
      toast.success(`Rule "${rule.rule_name}" ${!rule.enabled ? 'enabled' : 'disabled'}`)
    } catch (err) {
      toast.error('Failed to update rule')
    }
  }

  const handleUpdateSeverity = async (rule: DetectionRule, newSeverity: string) => {
    try {
      await apiClient.updateRule(rule.id, { severity: newSeverity as any })
      setRules(rules.map((r) => (r.id === rule.id ? { ...r, severity: newSeverity as any } : r)))
      toast.success('Rule severity updated')
    } catch (err) {
      toast.error('Failed to update severity')
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
        <CardTitle>Detection Rules</CardTitle>
        <CardDescription>Configure and manage intrusion detection rules</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {loading && !rules.length ? (
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
                  <TableHead className="w-48">Rule Name</TableHead>
                  <TableHead className="w-20">Type</TableHead>
                  <TableHead className="w-20">Threshold</TableHead>
                  <TableHead className="w-24">Severity</TableHead>
                  <TableHead className="w-16">Enabled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.length > 0 ? (
                  rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span>{rule.rule_name}</span>
                          <span className="text-xs text-muted-foreground">{rule.description}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline">{rule.rule_type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {rule.threshold}
                        {rule.time_window > 0 && <span className="text-xs text-muted-foreground"> / {rule.time_window}s</span>}
                      </TableCell>
                      <TableCell>
                        <select
                          value={rule.severity}
                          onChange={(e) => handleUpdateSeverity(rule, e.target.value)}
                          className="text-xs px-2 py-1 rounded border"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        <Switch checked={rule.enabled} onCheckedChange={() => handleToggleRule(rule)} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No rules configured
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
