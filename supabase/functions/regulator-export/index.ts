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
    const { apiKey, format = 'csv' } = body;

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

    // Get all verification data for this developer
    const { data: verifications } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('developer_id', developerId)
      .order('created_at', { ascending: false });

    const { data: consents } = await supabase
      .from('consent_records')
      .select('*')
      .eq('developer_id', developerId)
      .order('created_at', { ascending: false });

    const { data: deletions } = await supabase
      .from('deletion_logs')
      .select('*')
      .eq('developer_id', developerId)
      .order('created_at', { ascending: false });

    if (format === 'pdf') {
      // Return JSON that frontend can render as PDF
      return new Response(
        JSON.stringify({
          type: 'regulator_export',
          generatedAt: new Date().toISOString(),
          developerId,
          summary: {
            totalVerifications: verifications?.length || 0,
            totalConsents: consents?.length || 0,
            totalDeletions: deletions?.length || 0,
            activeConsents: consents?.filter((c: any) => c.consent_status === 'verified').length || 0,
            expiredConsents: consents?.filter((c: any) => c.consent_status === 'expired').length || 0,
          },
          verifications: verifications || [],
          consents: consents || [],
          deletions: deletions || [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CSV format
    const csvRows = [
      'timestamp,user_id_hash,state,result,requires_consent,consent_method,reason,deleted_at',
      ...(verifications || []).map((v: any) => 
        `${v.created_at},${v.user_id_hash},${v.detected_state},${v.result},${v.requires_consent},${v.consent_method || 'n/a'},${v.reason},${v.deleted_at || 'active'}`
      ),
    ].join('\n');

    return new Response(
      JSON.stringify({ csv: csvRows, filename: `copply-audit-${developerId.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.csv` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('regulator-export error:', err);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});