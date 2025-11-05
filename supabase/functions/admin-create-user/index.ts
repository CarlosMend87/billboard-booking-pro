import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the requesting user is a superadmin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is superadmin
    const { data: superadmin } = await supabaseAdmin
      .from('superadmins')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!superadmin) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate input
    const createUserSchema = z.object({
      name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
      email: z.string().email("Invalid email format").max(255, "Email too long"),
      password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password too long"),
      role: z.enum(['advertiser', 'owner', 'admin', 'superadmin'], { 
        errorMap: () => ({ message: "Invalid role" }) 
      }),
      phone: z.string().max(20, "Phone number too long").optional()
    })

    const body = await req.json()
    const validation = createUserSchema.safeParse(body)
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error.errors[0].message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { name, email, password, role, phone } = validation.data

    // Create user in Auth
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    })

    if (authCreateError) {
      throw authCreateError
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        name,
        email,
        role,
        phone: phone || null,
        status: 'active',
        created_by: user.id
      })

    if (profileError) {
      throw profileError
    }

    // Insert role into user_roles table
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role,
        granted_by: user.id
      })

    if (roleError) {
      throw roleError
    }

    // Log action
    await supabaseAdmin.rpc('log_user_action', {
      action_type: 'user_created',
      resource_type: 'user', 
      resource_id: authData.user.id,
      details: { email, role, name }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: authData.user.id, 
          email, 
          name, 
          role 
        } 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating user')
    return new Response(
      JSON.stringify({ error: 'Failed to create user. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})