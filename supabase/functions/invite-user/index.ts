
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InviteRequest {
  email: string
  tenantId: string
  baseRole: 'owner' | 'admin' | 'member'
  fullName?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Create regular client for RLS operations
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { email, tenantId, baseRole, fullName }: InviteRequest = await req.json()

    console.log(`Inviting user ${email} to tenant ${tenantId} with role ${baseRole}`)

    // Verify current user has permission to invite users
    const { data: currentUser } = await supabaseClient.auth.getUser()
    if (!currentUser.user) {
      throw new Error('Not authenticated')
    }

    // Check if current user can manage tenant users
    const { data: canManage, error: permError } = await supabaseClient.rpc('has_capability', {
      cap: 'manage_tenant_users',
      target_scope: 'tenant',
      target_id: tenantId
    })

    if (permError || !canManage) {
      throw new Error('Insufficient permissions to invite users')
    }

    // Check if user already exists
    const { data: existingUsers, error: userCheckError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (userCheckError) {
      throw new Error(`Failed to check existing users: ${userCheckError.message}`)
    }

    let userId: string
    const existingUser = existingUsers.users.find(u => u.email === email)

    if (existingUser) {
      // User exists, just create membership
      userId = existingUser.id
      console.log(`User ${email} already exists with ID ${userId}`)
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || ''
        }
      })

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`)
      }

      userId = newUser.user.id
      console.log(`Created new user ${email} with ID ${userId}`)
    }

    // Check if membership already exists
    const { data: existingMembership, error: membershipCheckError } = await supabaseClient
      .from('memberships')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single()

    if (membershipCheckError && membershipCheckError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing membership: ${membershipCheckError.message}`)
    }

    if (existingMembership) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'User is already a member of this tenant',
          membershipId: existingMembership.id
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Create membership
    const { data: membership, error: membershipError } = await supabaseClient
      .from('memberships')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        base_role: baseRole
      })
      .select()
      .single()

    if (membershipError) {
      throw new Error(`Failed to create membership: ${membershipError.message}`)
    }

    console.log(`Created membership ${membership.id} for user ${userId}`)

    // If user is owner, set up owner grants
    if (baseRole === 'owner') {
      const { error: grantsError } = await supabaseClient.rpc('setup_owner_grants', {
        _membership_id: membership.id
      })

      if (grantsError) {
        console.error('Failed to setup owner grants:', grantsError)
        // Don't fail the whole operation, just log the error
      } else {
        console.log(`Set up owner grants for membership ${membership.id}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${email} invited successfully`,
        userId,
        membershipId: membership.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in invite-user function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
