import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.207.0/crypto/mod.ts';

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
    note: 'California AB 1043 - Effective Jan 1, 2027',
  },
  LA: {
    minAge: 18,
    parentalConsentRequired: true,
    effectiveDate: '2026-07-01',
    dataRetentionDays: 180,
    consentMethods: ['email', 'creditcard', 'idupload'],
    strictness: 'high',
    note: 'Louisiana HB 570 - Effective Jul 1, 2026. Min age 18.',
  },
  UT: {
    minAge: 13,
    parentalConsentRequired: true,
    effectiveDate: '2026-05-01',
    dataRetentionDays: 90,
    consentMethods: ['creditcard', 'idupload'],
    strictness: 'high',
    note: 'Utah SB 152 - Effective May 1, 2026. Credit card or ID required.',
  },
  FL: {
    minAge: 14,
    parentalConsentRequired: true,
    effectiveDate: '2026-07-01',
    dataRetentionDays: 365,
    consentMethods: ['email', 'creditcard'],
    strictness: 'medium',
    note: 'Florida HB 3 - Effective Jul 1, 2026.',
  },
  AR: {
    minAge: 13,
    parentalConsentRequired: true,
    effectiveDate: '2026-09-01',
    dataRetentionDays: 365,
    consentMethods: ['creditcard', 'idupload'],
    strictness: 'high',
    note: 'Arkansas SB 396 - Effective Sep 1, 2026.',
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
  testMode?: boolean;
}

interface VerifyResult {
  allowed: boolean;
  requiresConsent: boolean;
  consentMethod?: string;
  consentDeadline?: string;
  reason: string;
  state: string;
  warning?: string;
  lawNote?: string;
  testMode?: boolean;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function detectStateFromIP(req: Request): Promise<string | null> {
  // 1. Cloudflare provides CF-IPRegion for US states
  const cfRegion = req.headers.get('cf-ipcountry');
  if (cfRegion && cfRegion !== 'US') return null; // Non-US — use Federal

  const cfState = req.headers.get('cf-region-code'); // e.g. "TX"
  if (cfState && STATE_LAWS[cfState]) return cfState;

  // 2. Fallback: IP geolocation via ipapi.co
  const ip = req.headers.get('cf-connecting-ip') ||
              req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168')) return null;

  try {
    const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(1500),
    });
    if (geoRes.ok) {
      const geo = await geoRes.json();
      if (geo.country_code === 'US' && geo.region_code && STATE_LAWS[geo.region_code]) {
        return geo.region_code;
      }
    }
  } catch {
    // Geolocation failed — fall through to Federal default
  }
  return null;
}

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

    const body: VerifyRequest = await req.json();
    const { apiKey, userId, declaredAge, devicePlatform, stateHint } = body;

    if (!apiKey || !userId) {
      return new Response(
        JSON.stringify({ error: 'INVALID_API_KEY', message: 'apiKey and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Support test mode: keys starting with cp_test_ bypass DB and return synthetic results
    const isTestMode = apiKey.startsWith('cp_test_');
    if (isTestMode) {
      const state = stateHint?.toUpperCase() || 'TX';
      const stateLaw = STATE_LAWS[state] || STATE_LAWS['Federal'];
      const age = declaredAge || 0;
      const allowed = age >= stateLaw.minAge && !(age < 18 && stateLaw.strictness === 'high');
      return new Response(JSON.stringify({
        allowed,
        requiresConsent: !allowed && stateLaw.parentalConsentRequired,
        reason: allowed ? `[TEST] Age ${age} passes ${state} minimum ${stateLaw.minAge}` : `[TEST] Age ${age} blocked by ${state} law`,
        state,
        testMode: true,
        lawNote: stateLaw.note,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const keyHash = await hashKey(apiKey);
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

    const { data: devData } = await supabase
      .from('developers')
      .select('plan_tier, mau_limit, mau_current')
      .eq('id', developerId)
      .single();

    if (!devData) {
      return new Response(
        JSON.stringify({ error: 'INVALID_API_KEY', message: 'Developer account not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rateLimit = devData.plan_tier === 'free' ? 200 : 2000;
    if (keyData.requests_today >= rateLimit) {
      return new Response(
        JSON.stringify({ error: 'RATE_LIMITED', message: `Daily rate limit (${rateLimit}/day). Upgrade at copply.dev` }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (devData.mau_current >= devData.mau_limit) {
      return new Response(
        JSON.stringify({ error: 'RATE_LIMITED', message: `MAU limit (${devData.mau_limit}). Upgrade at copply.dev` }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: config } = await supabase
      .from('compliance_configs')
      .select('*')
      .eq('developer_id', developerId)
      .single();

    if (!config) {
      return new Response(
        JSON.stringify({ error: 'CONFIG_NOT_FOUND', message: 'Compliance config missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Auto-detect state from IP if not provided
    let detectedState = stateHint?.toUpperCase();
    let geoDetected = false;
    if (!detectedState) {
      const geoState = await detectStateFromIP(req);
      if (geoState) {
        detectedState = geoState;
        geoDetected = true;
      } else {
        detectedState = 'Federal';
      }
    }

    const statesEnabled = config.states_enabled || [];
    if (!statesEnabled.includes(detectedState) && !statesEnabled.includes('Federal')) {
      return new Response(
        JSON.stringify({ error: 'STATE_NOT_SUPPORTED', message: `State ${detectedState} not enabled in your config` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stateLaw = STATE_LAWS[detectedState] || STATE_LAWS['Federal'];
    const isEnforced = new Date() >= new Date(stateLaw.effectiveDate);
    const minAge = config.minimum_age || stateLaw.minAge;
    const userAge = declaredAge || 0;

    let result: VerifyResult;

    if (!declaredAge) {
      result = {
        allowed: false,
        requiresConsent: true,
        consentMethod: stateLaw.consentMethods[0],
        consentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Age not declared — parental consent required',
        state: detectedState,
        lawNote: stateLaw.note,
      };
    } else if (userAge < minAge) {
      result = {
        allowed: false,
        requiresConsent: stateLaw.parentalConsentRequired,
        consentMethod: stateLaw.consentMethods[0],
        consentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        reason: `Underage: ${userAge} < ${minAge} minimum for ${detectedState}`,
        state: detectedState,
        lawNote: stateLaw.note,
      };
    } else if (userAge < 18 && stateLaw.parentalConsentRequired && stateLaw.strictness === 'high') {
      result = {
        allowed: false,
        requiresConsent: true,
        consentMethod: stateLaw.consentMethods[0],
        consentDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        reason: `${detectedState} requires parental consent for users under 18`,
        state: detectedState,
        lawNote: stateLaw.note,
      };
    } else {
      result = {
        allowed: true,
        requiresConsent: false,
        reason: `Verified: age ${userAge} satisfies ${detectedState} minimum ${minAge}${geoDetected ? ' (state auto-detected)' : ''}`,
        state: detectedState,
        lawNote: stateLaw.note,
      };
    }

    if (!isEnforced) {
      result.warning = `${detectedState} law not yet enforced (effective ${stateLaw.effectiveDate}). Advisory mode.`;
    }

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
    console.error('copply verify-age error:', err);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
