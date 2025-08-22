
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, Shield, Users } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { 
  Capability, 
  PermissionScope, 
  GrantInput, 
  PERMISSION_PACKS, 
  CAPABILITY_LABELS,
  BaseRole
} from '@/lib/types/permissions'

interface UserPermissionsPanelProps {
  membershipId: string
  tenantId: string
  currentRole: BaseRole
  onClose?: () => void
}

export function UserPermissionsPanel({ 
  membershipId, 
  tenantId, 
  currentRole,
  onClose 
}: UserPermissionsPanelProps) {
  const { grants, addGrants, removeGrant } = usePermissions()
  const [selectedCapabilities, setSelectedCapabilities] = useState<Set<Capability>>(new Set())
  const [customGrants, setCustomGrants] = useState<GrantInput[]>([])

  const userGrants = grants?.filter(g => g.membership_id === membershipId) || []

  const handleCapabilityToggle = (capability: Capability, checked: boolean) => {
    const newSet = new Set(selectedCapabilities)
    if (checked) {
      newSet.add(capability)
    } else {
      newSet.delete(capability)
    }
    setSelectedCapabilities(newSet)
  }

  const handleApplyPermissionPack = (packKey: string) => {
    const pack = PERMISSION_PACKS[packKey]
    if (!pack) return

    addGrants.mutate({
      membershipId,
      tenantId,
      grants: pack.grants
    })
  }

  const handleAddCustomGrant = () => {
    setCustomGrants([...customGrants, {
      capability: 'view_prices',
      scope: 'tenant'
    }])
  }

  const handleRemoveCustomGrant = (index: number) => {
    setCustomGrants(customGrants.filter((_, i) => i !== index))
  }

  const handleUpdateCustomGrant = (index: number, field: keyof GrantInput, value: any) => {
    const updated = [...customGrants]
    updated[index] = { ...updated[index], [field]: value } as GrantInput
    setCustomGrants(updated)
  }

  const handleSaveCustomGrants = () => {
    if (customGrants.length === 0) return

    addGrants.mutate({
      membershipId,
      tenantId,
      grants: customGrants
    })

    setCustomGrants([])
  }

  if (currentRole === 'owner') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Owner Permissions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Shield className="h-12 w-12 mx-auto text-primary mb-2" />
            <p className="text-lg font-medium">Full Access</p>
            <p className="text-sm text-muted-foreground">
              Owners have unrestricted access to all features and capabilities.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Permissions</span>
            </div>
            <Badge variant={currentRole === 'admin' ? 'default' : 'secondary'}>
              {currentRole}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="current">Current</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-4">
              <div className="space-y-2">
                {userGrants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No permissions assigned. Use templates or custom grants to add capabilities.
                  </p>
                ) : (
                  userGrants.map((grant) => (
                    <div key={grant.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex-1">
                        <div className="font-medium">
                          {CAPABILITY_LABELS[grant.capability as Capability]}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Scope: {grant.scope}
                          {grant.scope_id && ` (${grant.scope_id})`}
                          {grant.constraints && Object.keys(grant.constraints).length > 0 && (
                            <span className="ml-2">
                              Constraints: {JSON.stringify(grant.constraints)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGrant.mutate(grant.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="grid gap-4">
                {Object.entries(PERMISSION_PACKS).map(([key, pack]) => (
                  <Card key={key}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{pack.name}</h4>
                          <p className="text-sm text-muted-foreground">{pack.description}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {pack.grants.map((grant, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {CAPABILITY_LABELS[grant.capability]}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApplyPermissionPack(key)}
                          disabled={addGrants.isPending}
                        >
                          Apply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-4">
                {customGrants.map((grant, index) => (
                  <div key={index} className="p-4 border rounded-md space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Grant #{index + 1}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCustomGrant(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Capability</Label>
                        <Select
                          value={grant.capability}
                          onValueChange={(value) => 
                            handleUpdateCustomGrant(index, 'capability', value as Capability)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CAPABILITY_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Scope</Label>
                        <Select
                          value={grant.scope}
                          onValueChange={(value) => 
                            handleUpdateCustomGrant(index, 'scope', value as PermissionScope)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tenant">Tenant</SelectItem>
                            <SelectItem value="relationship">Relationship</SelectItem>
                            <SelectItem value="supplier">Supplier</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {grant.scope !== 'tenant' && (
                      <div>
                        <Label>Scope ID (optional)</Label>
                        <Input
                          placeholder="Leave empty for all"
                          value={grant.scope_id || ''}
                          onChange={(e) => 
                            handleUpdateCustomGrant(index, 'scope_id', e.target.value || null)
                          }
                        />
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex space-x-3">
                  <Button variant="outline" onClick={handleAddCustomGrant}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Grant
                  </Button>
                  
                  {customGrants.length > 0 && (
                    <Button 
                      onClick={handleSaveCustomGrants}
                      disabled={addGrants.isPending}
                    >
                      Save Grants
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
