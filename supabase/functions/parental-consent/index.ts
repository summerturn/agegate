import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { apiKey, userId, consentMethod, consentToken, parentEmail, parentIdUpload } = body;

    if (!apiKey || !userId || !consentMethod || !consentToken) {
      return new Response(
        JSON.stringify({ error: 'MISSING_FIELDS', message: 'apiKey, userId, consentMethod, and consentToken are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate API key
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(apiKey));
    const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const { data: keyData } = await supabase
      .from('api_keys')
      .select('developer_id')
      .eq('key_hash', keyHash)
      .single();

    if (!keyData) {
      return new Response(
        JSON.stringify({ error: 'INVALID_API_KEY', message: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const developerId = keyData.developer_id;
    const userIdHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(userId + developerId)))).map(b => b.toString(16).padStart(2, '0')).join('');

    // Check if consent token exists and is valid
    const { data: existingConsent } = await supabase
      .from('consent_records')
      .select('*')
      .eq('developer_id', developerId)
      .eq('user_id_hash', userIdHash)
      .eq('consent_token', consentToken)
      .single();

    if (!existingConsent) {
      return new Response(
        JSON.stringify({ error: 'INVALID_TOKEN', message: 'Consent token not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingConsent.consent_status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'CONSENT_EXPIRED', message: `Consent already ${existingConsent.consent_status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (new Date(existingConsent.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'CONSENT_EXPIRED', message: 'Consent token has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify consent based on method
    let verified = false;
    let verificationNote = '';

    switch (consentMethod) {
      case 'email':
        if (!parentEmail) {
          return new Response(
            JSON.stringify({ error: 'MISSING_PARENT_EMAIL', message: 'parentEmail required for email consent method' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // TODO: Send real verification email via Resend
        // For now, auto-verify in sandbox (production would send email with link)
        console.log(`[MOCK] Would send consent verification email to ${parentEmail}`);
        verified = true;
        verificationNote = 'Email consent verified (mock mode)';
        break;

      case 'creditcard':
        // TODO: Integrate Stripe for $0.30 microcharge verification
        console.log('[MOCK] Would process $0.30 credit card verification (refunded immediately)');
        verified = true;
        verificationNote = 'Credit card consent verified (mock mode - $0.30 charge refunded)';
        break;

      case 'idupload':
        if (!parentIdUpload) {
          return new Response(
            JSON.stringify({ error: 'MISSING_ID_UPLOAD', message: 'parentIdUpload required for ID upload method' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // TODO: Real ID verification backend (OCR + liveness check)
        console.log('[MOCK] Would verify uploaded government ID');
        verified = true;
        verificationNote = 'ID upload consent verified (mock mode - no real OCR)';
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'INVALID_METHOD', message: `Consent method ${consentMethod} not supported` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    if (verified) {
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year consent
      
      await supabase.from('consent_records').update({
        consent_status: 'verified',
        parent_email: parentEmail || existingConsent.parent_email,
        verified_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      }).eq('id', existingConsent.id);

      // Update verification request to allowed
      await supabase.from('verification_requests')
        .update({ result: 'allowed', reason: verificationNote })
        .eq('developer_id', developerId)
        .eq('user_id_hash', userIdHash)
        .eq('result', 'pending_consent');

      return new Response(
        JSON.stringify({
          consentVerified: true,
          expiresAt: expiresAt.toISOString(),
          method: consentMethod,
          note: verificationNote,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ consentVerified: false, reason: 'Verification failed' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('parental-consent error:', err);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});