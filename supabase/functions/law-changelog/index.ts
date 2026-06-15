import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// State law changelog - tracks changes to state laws
const LAW_CHANGELOG = [
  { date: '2024-06-15', state: 'TX', change: 'HB 18 signed into law', effectiveDate: '2026-01-01', action: 'none' },
  { date: '2024-06-15', state: 'UT', change: 'SB 152 enforcement date confirmed', effectiveDate: '2026-05-01', action: 'none' },
  { date: '2024-06-15', state: 'LA', change: 'Social app age requirement set to 18', effectiveDate: '2026-07-01', action: 'none' },
  { date: '2024-06-15', state: 'CA', change: 'Age verification law passed', effectiveDate: '2027-01-01', action: 'warning' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { state, since } = await req.json();
    
    let changes = LAW_CHANGELOG;
    
    if (state) {
      changes = changes.filter(c => c.state === state.toUpperCase());
    }
    
    if (since) {
      const sinceDate = new Date(since);
      changes = changes.filter(c => new Date(c.date) >= sinceDate);
    }

    return new Response(
      JSON.stringify({
        changes,
        lastUpdated: '2024-06-15',
        rssUrl: 'https://copply.dev/api/law-changelog.rss',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});