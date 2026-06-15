import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// State law configurations with enforcement dates and strictness
const STATE_LAWS: Record<string, {
  minAge: number;
  parentalConsentRequired: boolean;
  effectiveDate: string;
  dataRetentionDays: number;
  consentMethods: string[];
  strictness: 'low' | 'medium' | 'high';
  deletionTrigger: 'consent_expiry' | 'user_request' | 'both';
  note: string;
  lastUpdated: string;
}> = {
  TX: {
    minAge: 13,
    parentalConsentRequired: true,
    effectiveDate: '2026-01-01',
    dataRetentionDays: 365,
    consentMethods: ['email', 'creditcard', 'idupload'],
    strictness: 'medium',
    deletionTrigger: 'consent_expiry',
    note: 'Texas HB 18 — Effective Jan 1, 2026. Auto-delete verification data after consent expires.',
    lastUpdated: '2024-06-15',
  },
  CA: {
    minAge: 13,
    parentalConsentRequired: true,
    effectiveDate: '2027-01-01',
    dataRetentionDays: 365,
    consentMethods: ['email', 'creditcard'],
    strictness: 'medium',
    deletionTrigger: 'both',
    note: 'California — Effective Jan 1, 2027. Warning mode until enforcement.',
    lastUpdated: '2024-06-15',
  },
  LA: {
    minAge: 18,
    parentalConsentRequired: true,
    effectiveDate: '2026-07-01',
    dataRetentionDays: 180,
    consentMethods: ['email', 'creditcard', 'idupload'],
    strictness: 'high',
    deletionTrigger: 'consent_expiry',
    note: 'Louisiana — Effective Jul 1, 2026. Minimum age 18 for social apps.',
    lastUpdated: '2024-06-15',
  },
  UT: {
    minAge: 13,
    parentalConsentRequired: true,
    effectiveDate: '2026-05-01',
    dataRetentionDays: 90,
    consentMethods: ['creditcard', 'idupload'],
    strictness: 'high',
    deletionTrigger: 'both',
    note: 'Utah SB 152 — Effective May 1, 2026. Strictest: credit card or government ID required for minors.',
    lastUpdated: '2024-06-15',
  },
  Federal: {
    minAge: 13,
    parentalConsentRequired: true,
    effectiveDate: '2024-01-01',
    dataRetentionDays: 365,
    consentMethods: ['email', 'creditcard'],
    strictness: 'medium',
    deletionTrigger: 'user_request',
    note: 'Federal COPPA baseline — Already enforced.',
    lastUpdated: '2024-06-15',
  },
};

// Mock mode responses for testing
const MOCK_RESPONSES: Record<string, any> = {
  adult_tx: { allowed: true, requiresConsent: false, reason: 'Age verification passed: 25 >= 13', state: 'TX' },
  minor_tx: { allowed: false, requiresConsent: true, consentMethod: 'email', consentDeadline: '2026-01-08T00:00:00Z', reason: 'Underage: declared 12, minimum 13 for TX', state: 'TX' },
  minor_ut: { allowed: false, requiresConsent: true, consentMethod: 'creditcard', consentDeadline: '2026-01-08T00:00:00Z', reason: 'UT requires parental consent for users under 18', state: 'UT' },
  no_age: { allowed: false, requiresConsent: true, consentMethod: 'email', consentDeadline: '2026-01-08T00:00:00Z', reason: 'Age not declared — parental consent required', state: 'TX' },
};

interface VerifyRequest {
  apiKey: string;
  userId: string;
  declaredAge?: number;
  devicePlatform?: string;
  stateHint?: string;
  mockMode?: boolean;
  mockScenario?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: VerifyRequest = await req.json();
    const { apiKey, userId, declaredAge, devicePlatform, stateHint, mockMode, mockScenario } = body;

    if (!apiKey || !userId) {
      return new Response(
        JSON.stringify({ error: 'INVALID_API_KEY', message: 'apiKey and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // MOCK MODE: Return canned responses without hitting DB
    if (mockMode && mockScenario) {
      const mock = MOCK_RESPONSES[mockScenario] || MOCK_RESPONSES.adult_tx;
      return new Response(
        JSON.stringify({ ...mock, mockMode: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Validate API key (hash lookup)
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(apiKey));
    const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('id, developer_id, revoked_at, requests_today, requests_this_month')
      .eq('key_hash', keyHash)
      .single();

    if (keyError || !keyData || keyData.revoked_at) {
      return new Response(
        JSON.stringify({ error: 'INVALID_API_KEY', message: 'Invalid or revoked API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const developerId = keyData.developer_id;

    // 2. Check plan limits
    const { data: devData } = await supabase
      .from('developers')
      .select('plan_tier, mau_limit, mau_current')
      .eq('id', developerId)
      .single();

    const rateLimit = devData?.plan_tier === 'free' ? 100 : 1000;
    if (keyData.requests_today >= rateLimit) {
      return new Response(
        JSON.stringify({ error: 'RATE_LIMITED', message: `Daily rate limit exceeded (${rateLimit}/day). Upgrade your plan.` }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (devData?.mau_current >= devData?.mau_limit) {
      return new Response(
        JSON.stringify({ error: 'RATE_LIMITED', message: `MAU limit exceeded (${devData.mau_limit}). Upgrade your plan.` }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Get compliance config
    const { data: config } = await supabase
      .from('compliance_configs')
      .select('*')
      .eq('developer_id', developerId)
      .single();

    // 4. Detect state and apply law
    let detectedState = stateHint?.toUpperCase() || 'TX';
    const statesEnabled = config?.states_enabled || ['TX'];
    
    if (!statesEnabled.includes(detectedState) && !statesEnabled.includes('Federal')) {
      return new Response(
        JSON.stringify({ error: 'STATE_NOT_SUPPORTED', message: `State ${detectedState} not enabled in your config` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stateLaw = STATE_LAWS[detectedState] || STATE_LAWS['Federal'];
    const now = new Date();
    const isEnforced = now >= new Date(stateLaw.effectiveDate);
    const minAge = config?.minimum_age || stateLaw.minAge;
    const userAge = declaredAge || 0;

    let result: any = { allowed: false, requiresConsent: false, reason: '', state: detectedState };

    if (!declaredAge) {
      result = {
        allowed: false,
        requiresConsent: true,
        consentMethod: stateLaw.consentMethods[0],
        consentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Age not declared — parental consent required',
        state: detectedState,
      };
    } else if (userAge < minAge) {
      result = {
        allowed: false,
        requiresConsent: stateLaw.parentalConsentRequired,
        consentMethod: stateLaw.consentMethods[0],
        consentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        reason: `Underage: declared ${userAge}, minimum ${minAge} for ${detectedState}`,
        state: detectedState,
      };
    } else if (userAge < 18 && stateLaw.parentalConsentRequired && stateLaw.strictness === 'high') {
      result = {
        allowed: false,
        requiresConsent: true,
        consentMethod: stateLaw.consentMethods[0],
        consentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        reason: `${detectedState} requires parental consent for users under 18`,
        state: detectedState,
      };
    } else {
      result = {
        allowed: true,
        requiresConsent: false,
        reason: `Age verification passed: ${userAge} >= ${minAge}`,
        state: detectedState,
      };
    }

    if (!isEnforced) {
      result.warning = `${detectedState} law not yet enforced (effective ${stateLaw.effectiveDate}). Operating in advisory mode.`;
    }

    // 5. Log verification
    const userIdHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(userId + developerId)))).map(b => b.toString(16).padStart(2, '0')).join('');
    
    await supabase.from('verification_requests').insert({
      developer_id: developerId,
      user_id_hash: userIdHash,
      declared_age: declaredAge || null,
      detected_state: detectedState,
      device_platform: devicePlatform || 'unknown',
      result: result.allowed ? 'allowed' : (result.requiresConsent ? 'pending_consent' : 'blocked'),
      requires_consent: result.requiresConsent,
      consent_method: result.consentMethod || null,
      reason: result.reason,
    });

    // 6. Update counters
    await supabase.from('api_keys').update({
      requests_today: keyData.requests_today + 1,
      requests_this_month: keyData.requests_this_month + 1,
      last_used_at: new Date().toISOString(),
    }).eq('id', keyData.id);

    await supabase.rpc('increment_mau', { dev_id: developerId });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('verify-age error:', err);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});