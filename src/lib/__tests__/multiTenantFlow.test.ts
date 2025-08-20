import { test, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const shouldRun = process.env.RUN_SUPABASE_TESTS === 'true'

if (!shouldRun) {
  test.skip('RUN_SUPABASE_TESTS not set - skipping Supabase integration tests', () => {})
} else {
  const url = process.env.VITE_SUPABASE_URL!
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false }
  })

  test('sign-up and organization flow', async () => {
    const email = `test+${randomUUID()}@example.com`
    const password = 'Pass1234'

    const signUp = await supabase.auth.signUp({ email, password })
    expect(signUp.error).toBeNull()
    const userId = signUp.data.user?.id
    expect(userId).toBeTruthy()
    if (!userId) return

    const profile = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', userId)
      .single()
    expect(profile.data?.tenant_id).toBeNull()

    const orgName = `Org ${randomUUID()}`
    const tenant = await supabase
      .from('tenants')
      .insert({ name: orgName, created_by: userId })
      .select()
      .single()
    expect(tenant.error).toBeNull()
    const tenantId = tenant.data?.id
    expect(tenantId).toBeTruthy()
    if (!tenantId) return

    const membership = await supabase
      .from('memberships')
      .select('base_role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single()
    expect(membership.data?.base_role).toBe('owner')

    const updated = await supabase
      .from('profiles')
      .update({ tenant_id: tenantId })
      .eq('id', userId)
      .select('tenant_id')
      .single()
    expect(updated.data?.tenant_id).toBe(tenantId)
  })
}
