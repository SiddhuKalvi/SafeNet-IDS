'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { BlacklistItem, WhitelistItem } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function IPManagement() {
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([])
  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newIP, setNewIP] = useState('')
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [blacklistData, whitelistData] = await Promise.all([apiClient.getBlacklist(), apiClient.getWhitelist()])
      setBlacklist(blacklistData.blacklist)
      setWhitelist(whitelistData.whitelist)
    } catch (err) {
      toast.error('Failed to fetch IP lists')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToBlacklist = async () => {
    if (!newIP.trim()) {
      toast.error('Please enter an IP address')
      return
    }

    try {
      await apiClient.addToBlacklist(newIP, reason || undefined)
      setNewIP('')
      setReason('')
      toast.success(`IP ${newIP} added to blacklist`)
      fetchData()
    } catch (err) {
      toast.error('Failed to add IP to blacklist')
    }
  }

  const handleAddToWhitelist = async () => {
    if (!newIP.trim()) {
      toast.error('Please enter an IP address')
      return
    }

    try {
      await apiClient.addToWhitelist(newIP, description || undefined)
      setNewIP('')
      setDescription('')
      toast.success(`IP ${newIP} added to whitelist`)
      fetchData()
    } catch (err) {
      toast.error('Failed to add IP to whitelist')
    }
  }

  const handleRemoveFromBlacklist = async (ip: string) => {
    try {
      await apiClient.removeFromBlacklist(ip)
      setBlacklist(blacklist.filter((item) => item.ip_address !== ip))
      toast.success(`IP ${ip} removed from blacklist`)
    } catch (err) {
      toast.error('Failed to remove IP from blacklist')
    }
  }

  const handleRemoveFromWhitelist = async (ip: string) => {
    try {
      await apiClient.removeFromWhitelist(ip)
      setWhitelist(whitelist.filter((item) => item.ip_address !== ip))
      toast.success(`IP ${ip} removed from whitelist`)
    } catch (err) {
      toast.error('Failed to remove IP from whitelist')
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>IP Management</CardTitle>
        <CardDescription>Manage blacklisted and whitelisted IP addresses</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue="blacklist" className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="blacklist">Blacklist</TabsTrigger>
            <TabsTrigger value="whitelist">Whitelist</TabsTrigger>
          </TabsList>

          <TabsContent value="blacklist" className="flex-1 overflow-hidden flex flex-col">
            <div className="space-y-2 mb-4">
              <div className="flex gap-2">
                <Input
                  placeholder="IP Address"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddToBlacklist}
                  size="sm"
                  className="gap-1"
                  disabled={!newIP.trim() || loading}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              <Input
                placeholder="Reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="overflow-x-auto flex-1 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="w-20">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blacklist.length > 0 ? (
                    blacklist.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono">{item.ip_address}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.reason || '—'}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFromBlacklist(item.ip_address)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        No blacklisted IPs
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="whitelist" className="flex-1 overflow-hidden flex flex-col">
            <div className="space-y-2 mb-4">
              <div className="flex gap-2">
                <Input
                  placeholder="IP Address"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddToWhitelist}
                  size="sm"
                  className="gap-1"
                  disabled={!newIP.trim() || loading}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              <Input
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="overflow-x-auto flex-1 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-20">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {whitelist.length > 0 ? (
                    whitelist.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono">{item.ip_address}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.description || '—'}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFromWhitelist(item.ip_address)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        No whitelisted IPs
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
