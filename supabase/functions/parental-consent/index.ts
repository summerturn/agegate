import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'
import { corsHeaders } from '../_shared/cors.ts'

interface ParentalConsentRequest {
  childEmail: string
  parentEmail: string
  childAge: number
  verificationId: string
  method: 'email' | 'credit_card' | 'id_upload'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { childEmail, parentEmail, childAge, verificationId, method }: ParentalConsentRequest = await req.json()

    // Validate inputs
    if (!childEmail || !parentEmail || !childAge || !verificationId || !method) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if child is under 18
    if (childAge >= 18) {
      return new Response(
        JSON.stringify({ error: 'Child must be under 18 for parental consent' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Generate consent token
    const consentToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 48) // 48 hour expiry

    // Store consent request in database
    const { data, error } = await supabaseClient
      .from('parental_consent')
      .insert({
        child_email: childEmail,
        parent_email: parentEmail,
        child_age: childAge,
        verification_id: verificationId,
        method,
        consent_token: consentToken,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Send email to parent (using Supabase Edge Function or external service)
    const { error: emailError } = await supabaseClient.functions.invoke('send-email', {
      body: {
        to: parentEmail,
        subject: 'Parental Consent Request',
        template: 'parental-consent',
        data: {
          childEmail,
          consentUrl: `${Deno.env.get('APP_URL')}/consent/${consentToken}`,
          expiresAt: expiresAt.toISOString(),
        },
      },
    })

    if (emailError) {
      console.error('Failed to send email:', emailError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        consentId: data.id,
        consentToken,
        expiresAt: expiresAt.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in parental-consent function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
