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
    const { apiKey, userId } = body;

    if (!apiKey || !userId) {
      return new Response(
        JSON.stringify({ error: 'MISSING_FIELDS', message: 'apiKey and userId are required' }),
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

    // Get latest consent record
    const { data: consent } = await supabase
      .from('consent_records')
      .select('*')
      .eq('developer_id', developerId)
      .eq('user_id_hash', userIdHash)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!consent) {
      return new Response(
        JSON.stringify({ status: 'no_consent', message: 'No consent record found for this user' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const expiresAt = new Date(consent.expires_at);
    const isExpired = now > expiresAt;

    if (isExpired && consent.consent_status === 'verified') {
      // Auto-trigger data deletion for expired consent
      await supabase.from('consent_records').update({ consent_status: 'expired' }).eq('id', consent.id);
      
      // Call deletion function internally
      const deletionResponse = await fetch(`${supabaseUrl}/functions/v1/delete-verification-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
        body: JSON.stringify({ apiKey, userId, reason: 'Consent expired automatically' }),
      });

      return new Response(
        JSON.stringify({
          status: 'expired',
          consentStatus: 'expired',
          expiresAt: consent.expires_at,
          message: 'Consent has expired. All verification data has been automatically deleted per Texas HB 18.',
          deletionTriggered: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        status: consent.consent_status,
        consentStatus: consent.consent_status,
        method: consent.consent_method,
        expiresAt: consent.expires_at,
        verifiedAt: consent.verified_at,
        daysRemaining: Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('check-consent-status error:', err);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});