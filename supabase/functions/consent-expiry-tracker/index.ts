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
    const { apiKey } = body;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'MISSING_API_KEY', message: 'apiKey is required' }),
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

    // Get consent records with expiry info
    const { data: consents } = await supabase
      .from('consent_records')
      .select('user_id_hash, consent_method, consent_status, expires_at, verified_at')
      .eq('developer_id', developerId)
      .eq('consent_status', 'verified')
      .order('expires_at', { ascending: true });

    const now = new Date();
    const timeline = (consents || []).map((c: any) => {
      const expiresAt = new Date(c.expires_at);
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        userIdHash: c.user_id_hash.slice(0, 16) + '...',
        method: c.consent_method,
        expiresAt: c.expires_at,
        daysRemaining,
        status: daysRemaining <= 7 ? 'urgent' : daysRemaining <= 30 ? 'warning' : 'ok',
      };
    });

    return new Response(
      JSON.stringify({
        timeline,
        totalExpiringSoon: timeline.filter((t: any) => t.status === 'urgent').length,
        totalExpiringThisMonth: timeline.filter((t: any) => t.status === 'warning').length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('consent-expiry-tracker error:', err);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});