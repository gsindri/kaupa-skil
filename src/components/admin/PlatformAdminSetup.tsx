import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, CheckCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export function PlatformAdminSetup() {
  const [isSetup, setIsSetup] = useState(false)
  const [loading, setLoading] = useState(false)

  const setupPlatformAdmin = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('setup_initial_platform_admin')
      
      if (error) throw error
      
      if (data) {
        setIsSetup(true)
        toast({
          title: 'Platform Admin Setup Complete',
          description: 'You now have platform administrator privileges.',
        })
      } else {
        toast({
          title: 'Setup Not Available',
          description: 'Platform admin already exists or setup failed.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Platform admin setup failed:', error)
      toast({
        title: 'Setup Failed',
        description: 'Failed to setup platform admin. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (isSetup) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Platform admin setup complete! You now have administrator privileges.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Platform Admin Setup
        </CardTitle>
        <CardDescription>
          Initialize platform administration for security management.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            This will make you the first platform administrator. Only available if no admins exist yet.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={setupPlatformAdmin} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Setting up...' : 'Setup Platform Admin'}
        </Button>
      </CardContent>
    </Card>
  )
}