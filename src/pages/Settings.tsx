
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Settings as SettingsIcon, Bell, Shield, Database, Zap, Users, Mail } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Settings() {
  const { toast } = useToast()
  const [notificationSettings, setNotificationSettings] = useState({
    priceAlerts: true,
    stockAlerts: true,
    orderUpdates: true,
    weeklyReports: true,
    emailNotifications: true,
    pushNotifications: false
  })

  const [alertThresholds, setAlertThresholds] = useState({
    priceChangePercent: [10],
    stockLevelPercent: [20],
    anomalyConfidence: [80]
  })

  const [automationSettings, setAutomationSettings] = useState({
    autoReorder: false,
    priceTracking: true,
    supplierSync: true,
    reportGeneration: true
  })

  const handleSaveSettings = () => {
    toast({
      title: 'Settings saved',
      description: 'Your preferences have been updated successfully.'
    })
  }

  const toggleNotification = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const toggleAutomation = (key: keyof typeof automationSettings) => {
    setAutomationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Configure your procurement platform preferences
        </p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Price Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when prices change significantly
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.priceAlerts}
                    onCheckedChange={() => toggleNotification('priceAlerts')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Alerts when items go out of stock
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.stockAlerts}
                    onCheckedChange={() => toggleNotification('stockAlerts')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Order Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications about order status changes
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.orderUpdates}
                    onCheckedChange={() => toggleNotification('orderUpdates')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly procurement summaries
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.weeklyReports}
                    onCheckedChange={() => toggleNotification('weeklyReports')}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-4">Delivery Methods</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <Label>Email Notifications</Label>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={() => toggleNotification('emailNotifications')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <Label>Push Notifications</Label>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={() => toggleNotification('pushNotifications')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Thresholds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Price Change Alert Threshold</Label>
                  <Slider
                    value={alertThresholds.priceChangePercent}
                    onValueChange={(value) =>
                      setAlertThresholds(prev => ({ ...prev, priceChangePercent: value }))
                    }
                    max={50}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>1%</span>
                    <span className="font-medium">
                      Alert when price changes by {alertThresholds.priceChangePercent[0]}% or more
                    </span>
                    <span>50%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Stock Level Alert Threshold</Label>
                  <Slider
                    value={alertThresholds.stockLevelPercent}
                    onValueChange={(value) =>
                      setAlertThresholds(prev => ({ ...prev, stockLevelPercent: value }))
                    }
                    max={100}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>5%</span>
                    <span className="font-medium">
                      Alert when stock falls below {alertThresholds.stockLevelPercent[0]}%
                    </span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Anomaly Detection Sensitivity</Label>
                  <Slider
                    value={alertThresholds.anomalyConfidence}
                    onValueChange={(value) =>
                      setAlertThresholds(prev => ({ ...prev, anomalyConfidence: value }))
                    }
                    max={100}
                    min={50}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Less Sensitive</span>
                    <span className="font-medium">
                      {alertThresholds.anomalyConfidence[0]}% confidence required
                    </span>
                    <span>More Sensitive</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Automation Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatic Reordering</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically create orders when stock is low
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Beta</Badge>
                    <Switch
                      checked={automationSettings.autoReorder}
                      onCheckedChange={() => toggleAutomation('autoReorder')}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Real-time Price Tracking</Label>
                    <p className="text-sm text-muted-foreground">
                      Continuously monitor supplier prices
                    </p>
                  </div>
                  <Switch
                    checked={automationSettings.priceTracking}
                    onCheckedChange={() => toggleAutomation('priceTracking')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Supplier Data Sync</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync with supplier catalogs
                    </p>
                  </div>
                  <Switch
                    checked={automationSettings.supplierSync}
                    onCheckedChange={() => toggleAutomation('supplierSync')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Report Generation</Label>
                    <p className="text-sm text-muted-foreground">
                      Generate reports automatically on schedule
                    </p>
                  </div>
                  <Switch
                    checked={automationSettings.reportGeneration}
                    onCheckedChange={() => toggleAutomation('reportGeneration')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Third-Party Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Database className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">ERP System</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect your existing ERP for seamless data flow
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Mail className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Email Platform</h3>
                      <p className="text-sm text-muted-foreground">
                        Send orders and reports via your email system
                      </p>
                    </div>
                  </div>
                  <Badge variant="default">Connected</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Users className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Slack Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts in your team's Slack channels
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">Connect</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Data Retention Period</Label>
                  <Select defaultValue="12">
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                      <SelectItem value="24">24 months</SelectItem>
                      <SelectItem value="indefinite">Indefinite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Session Timeout</Label>
                  <Select defaultValue="8">
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t">
                  <div className="space-y-3">
                    <h3 className="font-medium">Activity Log</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>• Last login: Today at 09:15</div>
                      <div>• Password changed: 2 weeks ago</div>
                      <div>• Data export: 1 month ago</div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Full Log
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <div className="flex justify-end">
          <Button onClick={handleSaveSettings}>
            Save Settings
          </Button>
        </div>
      </Tabs>
    </div>
  )
}
