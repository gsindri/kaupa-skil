
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Filter } from 'lucide-react'
import { useAuditLogs } from '@/hooks/useAuditLogs'
import { useToast } from '@/hooks/use-toast'

export function AuditLogExport() {
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    startDate: '',
    endDate: ''
  })
  const [isExporting, setIsExporting] = useState(false)
  
  const { auditLogs } = useAuditLogs(filters)
  const { toast } = useToast()

  const exportToCsv = () => {
    if (!auditLogs?.length) {
      toast({
        title: 'No data to export',
        description: 'Please adjust your filters to include audit logs',
        variant: 'destructive'
      })
      return
    }

    setIsExporting(true)

    try {
      const headers = ['Date', 'Actor', 'Tenant', 'Action', 'Entity Type', 'Reason']
      const csvContent = [
        headers.join(','),
        ...auditLogs.map(log => [
          new Date(log.created_at).toISOString(),
          log.actor_id || '',
          log.tenant?.name || '',
          log.action,
          log.entity_type || '',
          log.reason || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Export successful',
        description: `Exported ${auditLogs.length} audit log entries`
      })
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export audit logs',
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Audit Log Filters & Export
        </CardTitle>
        <CardDescription>
          Filter and export audit log data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="action">Action</Label>
            <Select
              value={filters.action || 'all'}
              onValueChange={value =>
                setFilters(prev => ({ ...prev, action: value === 'all' ? '' : value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="elevation_created">Elevation Created</SelectItem>
                <SelectItem value="elevation_revoked">Elevation Revoked</SelectItem>
                <SelectItem value="support_session_created">Support Session Created</SelectItem>
                <SelectItem value="user_invited">User Invited</SelectItem>
                <SelectItem value="tenant_created">Tenant Created</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entityType">Entity Type</Label>
            <Select
              value={filters.entityType || 'all'}
              onValueChange={value =>
                setFilters(prev => ({
                  ...prev,
                  entityType: value === 'all' ? '' : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                <SelectItem value="admin_elevation">Admin Elevation</SelectItem>
                <SelectItem value="support_session">Support Session</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="tenant">Tenant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {auditLogs?.length || 0} entries match current filters
          </p>
          <Button 
            onClick={exportToCsv}
            disabled={isExporting || !auditLogs?.length}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
