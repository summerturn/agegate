import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.207.0/crypto/mod.ts';

// State law configurations
const STATE_LAWS: Record<string, {
  minAge: number;
  parentalConsentRequired: boolean;
  effectiveDate: string;
  dataRetentionDays: number;
  consentMethods: string[];
  strictness: 'low' | 'medium' | 'high';
  note?: string;
}> = {
  TX: {
    minAge: 13,
    parentalConsentRequired: true,
    effectiveDate: '2026-01-01',
    dataRetentionDays: 365,
    consentMethods: ['email', 'creditcard', 'idupload'],
    strictness: 'medium',
    note: 'Texas HB 18 - Effective Jan 1, 2026',
  },
  CA: {
    minAge: 13,
    parentalConsentRequired: true,
    effectiveDate: '2027-01-01',
    dataRetentionDays: 365,
    consentMethods: ['email', 'creditcard'],
    strictness: 'medium',
    note: 'California - Effective Jan 1, 2027 (warning if not yet enforced)',
  },
  LA: {
    minAge: 18,
    parentalConsentRequired: true,
    effectiveDate: '2026-07-01',
    dataRetentionDays: 180,
    consentMethods: ['email', 'creditcard', 'idupload'],
    strictness: 'high',
    note: 'Louisiana - Effective Jul 1, 2026. Min age 18 for social apps.',
  },
  UT: {
    minAge: 13,
    parentalConsentRequired: true,
    effectiveDate: '2026-05-01',
    dataRetentionDays: 90,
    consentMethods: ['creditcard', 'idupload'],
    strictness: 'high',
    note: 'Utah SB 152 - Effective May 1, 2026. Strictest: credit card or govt ID required for minors.',
  },
  Federal: {
    minAge: 13,
    parentalConsentRequired: true,
    effectiveDate: '2026-01-01',
    dataRetentionDays: 365,
    consentMethods: ['email', 'creditcard'],
    strictness: 'medium',
    note: 'Federal COPPA baseline',
  },
};

interface VerifyRequest {
  apiKey: string;
  userId: string;
  declaredAge?: number;
  devicePlatform?: string;
  stateHint?: string;
}

interface VerifyResult {
  allowed: boolean;
  requiresConsent: boolean;
  consentMethod?: string;
  consentDeadline?: string;
  reason: string;
  state: string;
  warning?: string;
}

// Hash API key for lookup
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: VerifyRequest = await req.json();
    const { apiKey, userId, declaredAge, devicePlatform, stateHint } = body;

    if (!apiKey || !userId) {
      return new Response(
        JSON.stringify({ error: 'INVALID_API_KEY', message: 'apiKey and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Validate API key
    const keyHash = await hashKey(apiKey);
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('id, developer_id, revoked_at, requests_today, requests_this_month')
      .eq('key_hash', keyHash)
      .single();

    if (keyError || !keyData) {
      return new Response(
        JSON.stringify({ error: 'INVALID_API_KEY', message: 'Invalid or revoked API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (keyData.revoked_at) {
      return new Response(
        JSON.stringify({ error: 'INVALID_API_KEY', message: 'API key has been revoked' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const developerId = keyData.developer_id;

    // 2. Check plan limits
    const { data: devData, error: devError } = await supabase
      .from('developers')
      .select('plan_tier, mau_limit, mau_current')
      .eq('id', developerId)
      .single();

    if (devError || !devData) {
      return new Response(
        JSON.stringify({ error: 'INVALID_API_KEY', message: 'Developer account not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    const rateLimit = devData.plan_tier === 'free' ? 100 : 1000;
    if (keyData.requests_today >= rateLimit) {
      return new Response(
        JSON.stringify({ error: 'RATE_LIMITED', message: `Daily rate limit exceeded (${rateLimit}/day). Upgrade your plan.` }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // MAU limit check
    if (devData.mau_current >= devData.mau_limit) {
      return new Response(
        JSON.stringify({ error: 'RATE_LIMITED', message: `MAU limit exceeded (${devData.mau_limit}). Upgrade your plan.` }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Get developer's compliance config
    const { data: config, error: configError } = await supabase
      .from('compliance_configs')
      .select('*')
      .eq('developer_id', developerId)
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: 'CONFIG_NOT_FOUND', message: 'Compliance configuration not found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Detect state
    let detectedState = stateHint?.toUpperCase() || 'TX';
    // TODO: Auto-detect from IP/geolocation if stateHint is null
    // For now, default to TX if not provided
    if (!detectedState) {
      detectedState = 'TX';
    }

    // Check if state is enabled in config
    const statesEnabled = config.states_enabled || [];
    if (!statesEnabled.includes(detectedState) && !statesEnabled.includes('Federal')) {
      return new Response(
        JSON.stringify({ error: 'STATE_NOT_SUPPORTED', message: `State ${detectedState} is not enabled in your compliance config` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Apply state law
    const stateLaw = STATE_LAWS[detectedState] || STATE_LAWS['Federal'];
    const now = new Date();
    const effectiveDate = new Date(stateLaw.effectiveDate);
    const isEnforced = now >= effectiveDate;

    let result: VerifyResult = {
      allowed: false,
      requiresConsent: false,
      reason: '',
      state: detectedState,
    };

    // Age check
    const minAge = config.minimum_age || stateLaw.minAge;
    const userAge = declaredAge || 0;

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
      // High strictness states require consent for minors under 18
      result = {
        allowed: false,
        requiresConsent: true,
        consentMethod: stateLaw.consentMethods[0],
        consentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        reason: `${detectedState} requires parental consent for users under 18`,
        state: detectedState,
      };
    } else if (userAge >= minAge) {
      result = {
        allowed: true,
        requiresConsent: false,
        reason: `Age verification passed: ${userAge} >= ${minAge}`,
        state: detectedState,
      };
    }

    // Add warning if law not yet enforced
    if (!isEnforced) {
      result.warning = `${detectedState} law not yet enforced (effective ${stateLaw.effectiveDate}). Currently operating in advisory mode.`;
    }

    // 6. Log to verification_requests
    const userIdHash = await hashKey(userId + developerId);
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

    // 7. Increment API counters
    await supabase.from('api_keys').update({
      requests_today: keyData.requests_today + 1,
      requests_this_month: keyData.requests_this_month + 1,
      last_used_at: new Date().toISOString(),
    }).eq('id', keyData.id);

    // 8. Increment MAU if new user (simplified — in production, check if user_id_hash exists for this month)
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
