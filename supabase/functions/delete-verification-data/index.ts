import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'
import { corsHeaders } from '../_shared/cors.ts'

interface DeleteRequest {
  verificationId: string
  userId: string
  reason?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { verificationId, userId, reason }: DeleteRequest = await req.json()

    if (!verificationId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Verify the verification belongs to the user
    const { data: verification, error: verifyError } = await supabaseClient
      .from('verifications')
      .select('user_id, status')
      .eq('id', verificationId)
      .single()

    if (verifyError || !verification) {
      return new Response(
        JSON.stringify({ error: 'Verification not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    if (verification.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Log the deletion request
    await supabaseClient.from('deletion_logs').insert({
      verification_id: verificationId,
      user_id: userId,
      reason: reason || 'User requested deletion',
      requested_at: new Date().toISOString(),
    })

    // Delete associated data
    const tables = ['verification_images', 'verification_sessions', 'parental_consent', 'audit_logs']
    for (const table of tables) {
      const { error } = await supabaseClient
        .from(table)
        .delete()
        .eq('verification_id', verificationId)
      
      if (error) {
        console.error(`Error deleting from ${table}:`, error)
      }
    }

    // Soft delete the verification record
    const { error: updateError } = await supabaseClient
      .from('verifications')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString(),
        deletion_reason: reason,
      })
      .eq('id', verificationId)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification data deleted successfully',
        verificationId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in delete-verification-data function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
