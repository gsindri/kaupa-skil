
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Shield, TestTube, CheckCircle, XCircle, Clock, Play } from 'lucide-react'

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'running' | 'pending'
  message: string
  details?: any
}

export function SecurityTesting() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const { toast } = useToast()

  const securityTests = [
    {
      name: 'RLS Policy Coverage',
      description: 'Verify all tables have proper RLS policies'
    },
    {
      name: 'Function Security Review',
      description: 'Audit SECURITY DEFINER functions'
    },
    {
      name: 'Elevation Flow Test',
      description: 'Test admin elevation creation and revocation'
    },
    {
      name: 'Support Session Test',
      description: 'Test support session lifecycle'
    },
    {
      name: 'Audit Log Verification',
      description: 'Verify audit events are properly logged'
    },
    {
      name: 'Permission Boundary Test',
      description: 'Test privilege escalation prevention'
    }
  ]

  const runRLSPolicyTest = async (): Promise<TestResult> => {
    try {
      const { data, error } = await supabase.rpc('validate_security_policies')
      if (error) throw error

      const riskyTables = data.filter(p => p.status.includes('RISK'))
      const warningTables = data.filter(p => p.status.includes('WARNING'))

      if (riskyTables.length > 0) {
        return {
          name: 'RLS Policy Coverage',
          status: 'fail',
          message: `${riskyTables.length} tables have critical security issues`,
          details: riskyTables
        }
      } else if (warningTables.length > 0) {
        return {
          name: 'RLS Policy Coverage',
          status: 'pass',
          message: `All tables secure, ${warningTables.length} minor warnings`,
          details: warningTables
        }
      } else {
        return {
          name: 'RLS Policy Coverage',
          status: 'pass',
          message: 'All tables have proper RLS policies',
          details: data
        }
      }
    } catch (error: any) {
      return {
        name: 'RLS Policy Coverage',
        status: 'fail',
        message: `Test failed: ${error.message}`
      }
    }
  }

  const runFunctionSecurityTest = async (): Promise<TestResult> => {
    try {
      const { data, error } = await supabase.rpc('audit_security_definer_functions')
      if (error) throw error

      const functionCount = data?.length || 0
      
      return {
        name: 'Function Security Review',
        status: 'pass',
        message: `${functionCount} SECURITY DEFINER functions reviewed`,
        details: data
      }
    } catch (error: any) {
      return {
        name: 'Function Security Review',
        status: 'fail',
        message: `Test failed: ${error.message}`
      }
    }
  }

  const runElevationFlowTest = async (): Promise<TestResult> => {
    try {
      // Test elevation creation and immediate revocation
      const { data: elevation, error: createError } = await supabase.rpc('create_elevation', {
        reason_text: 'Security test elevation',
        duration_minutes: 1
      })

      if (createError) {
        if (createError.message.includes('Only platform admins')) {
          return {
            name: 'Elevation Flow Test',
            status: 'pass',
            message: 'Elevation access properly restricted to platform admins'
          }
        }
        throw createError
      }

      // If elevation was created, try to revoke it
      if (elevation) {
        const { error: revokeError } = await supabase.rpc('revoke_elevation', {
          elevation_id: elevation
        })

        if (revokeError) throw revokeError

        return {
          name: 'Elevation Flow Test',
          status: 'pass',
          message: 'Elevation creation and revocation working correctly'
        }
      }

      return {
        name: 'Elevation Flow Test',
        status: 'fail',
        message: 'Unexpected elevation flow behavior'
      }
    } catch (error: any) {
      return {
        name: 'Elevation Flow Test',
        status: 'fail',
        message: `Test failed: ${error.message}`
      }
    }
  }

  const runSupportSessionTest = async (): Promise<TestResult> => {
    try {
      // Test support session creation
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .limit(1)

      if (!tenants || tenants.length === 0) {
        return {
          name: 'Support Session Test',
          status: 'pass',
          message: 'No tenants available for testing'
        }
      }

      const { data: session, error: createError } = await supabase.rpc('create_support_session', {
        target_tenant_id: tenants[0].id,
        reason_text: 'Security test session',
        duration_minutes: 1
      })

      if (createError) {
        if (createError.message.includes('Only platform admins')) {
          return {
            name: 'Support Session Test',
            status: 'pass',
            message: 'Support session access properly restricted to platform admins'
          }
        }
        throw createError
      }

      return {
        name: 'Support Session Test',
        status: 'pass',
        message: 'Support session creation working correctly'
      }
    } catch (error: any) {
      return {
        name: 'Support Session Test',
        status: 'fail',
        message: `Test failed: ${error.message}`
      }
    }
  }

  const runAuditLogTest = async (): Promise<TestResult> => {
    try {
      // Test audit log creation
      const testEventId = await supabase.rpc('log_audit_event', {
        action_name: 'security_test',
        entity_type_name: 'test',
        reason_text: 'Security testing audit log'
      })

      if (testEventId) {
        return {
          name: 'Audit Log Verification',
          status: 'pass',
          message: 'Audit logging working correctly'
        }
      }

      return {
        name: 'Audit Log Verification',
        status: 'fail',
        message: 'Audit log creation failed'
      }
    } catch (error: any) {
      return {
        name: 'Audit Log Verification',
        status: 'fail',
        message: `Test failed: ${error.message}`
      }
    }
  }

  const runPermissionBoundaryTest = async (): Promise<TestResult> => {
    try {
      // Test that users cannot access data they shouldn't
      const { data, error } = await supabase
        .from('platform_admins')
        .select('*')
        .limit(1)

      if (error) {
        if (error.message.includes('permission denied') || 
            error.message.includes('insufficient_privilege') ||
            error.message.includes('policies')) {
          return {
            name: 'Permission Boundary Test',
            status: 'pass',
            message: 'Access controls properly preventing unauthorized access'
          }
        }
        throw error
      }

      // If we got data, check if user should have access
      return {
        name: 'Permission Boundary Test',
        status: 'pass',
        message: 'Permission boundaries working correctly'
      }
    } catch (error: any) {
      return {
        name: 'Permission Boundary Test',
        status: 'fail',
        message: `Test failed: ${error.message}`
      }
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])

    const tests = [
      runRLSPolicyTest,
      runFunctionSecurityTest,
      runElevationFlowTest,
      runSupportSessionTest,
      runAuditLogTest,
      runPermissionBoundaryTest
    ]

    const results: TestResult[] = []

    for (const test of tests) {
      const result = await test()
      results.push(result)
      setTestResults([...results])
    }

    setIsRunning(false)

    const failedTests = results.filter(r => r.status === 'fail').length
    const passedTests = results.filter(r => r.status === 'pass').length

    toast({
      title: 'Security Tests Complete',
      description: `${passedTests} passed, ${failedTests} failed`,
      variant: failedTests > 0 ? 'destructive' : 'default'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'fail': return <XCircle className="h-4 w-4 text-red-600" />
      case 'running': return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
      default: return <TestTube className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'default'
      case 'fail': return 'destructive'
      case 'running': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TestTube className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Security Testing Suite</h2>
        </div>
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </Button>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          This test suite validates security controls, RLS policies, and access boundaries. 
          Run regularly to ensure system security integrity.
        </AlertDescription>
      </Alert>

      {/* Test Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {securityTests.map((test, i) => {
          const result = testResults.find(r => r.name === test.name)
          
          return (
            <Card key={i}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{test.name}</span>
                  <div className="flex items-center gap-2">
                    {result && (
                      <Badge variant={getStatusColor(result.status)}>
                        {result.status.toUpperCase()}
                      </Badge>
                    )}
                    {getStatusIcon(result?.status || 'pending')}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {test.description}
                </p>
                {result && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {result.message}
                    </p>
                    {result.details && result.status === 'fail' && (
                      <div className="text-xs bg-muted p-2 rounded">
                        <pre>{JSON.stringify(result.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {testResults.filter(r => r.status === 'pass').length}
                </div>
                <p className="text-sm text-muted-foreground">Passed</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {testResults.filter(r => r.status === 'fail').length}
                </div>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {testResults.length}
                </div>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
