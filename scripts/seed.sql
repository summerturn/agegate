-- ==========================================
-- Copply — Seed Data for Supabase
-- Run in the Supabase SQL Editor (new query)
-- ==========================================

-- 1. Seed plans (mirror of Stripe products)
INSERT INTO plans (id, name, slug, description, price_monthly, mau_limit, features, stripe_price_id, created_at)
VALUES
  ('plan_free',      'Free',      'free',      'Up to 1,000 MAU. Perfect for indie devs.',        0,     1000,   '["basic_copply","email_support","standard_modal","community_access"]', 'price_free',      now()),
  ('plan_starter',   'Starter',   'starter',   'Up to 10,000 MAU. Priority email support.',      2900,  10000,  '["basic_copply","priority_email","custom_branding","webhook_logs","analytics"]', 'price_starter',   now()),
  ('plan_growth',    'Growth',    'growth',    'Up to 100,000 MAU. Webhook logs + custom branding.', 9900, 100000, '["advanced_copply","priority_email","custom_branding","webhook_logs","analytics","api_access"]', 'price_growth',    now()),
  ('plan_enterprise','Enterprise','enterprise','Unlimited MAU. Dedicated Slack + SLA.',            29900, 999999999,'["advanced_copply","dedicated_slack","sla_99_9","custom_branding","webhook_logs","analytics","api_access","audit_logs"]', 'price_enterprise',now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  mau_limit = EXCLUDED.mau_limit,
  features = EXCLUDED.features;

-- 2. Seed a demo user (for local testing only — remove in production)
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'demo@copply.dev', '{"full_name":"Demo User"}', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, company, website, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Demo User', 'Acme Inc', 'https://example.com', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subscriptions (id, user_id, plan_id, status, current_period_start, current_period_end, created_at, updated_at)
VALUES
  ('sub_demo_001', '00000000-0000-0000-0000-000000000001', 'plan_growth', 'trialing', now(), now() + interval '14 days', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 3. Seed a demo API key (DO NOT use in production)
INSERT INTO public.api_keys (id, user_id, name, key_hash, permissions, created_at, last_used_at)
VALUES
  ('key_demo_001', '00000000-0000-0000-0000-000000000001', 'Demo Key', 'copply_demo_xxxxxxxxxxxxxxxx', '["verify:write","analytics:read"]', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 4. Seed some verification events for the demo dashboard
INSERT INTO public.verification_events (id, user_id, api_key_id, session_id, country, region, method, result, age, created_at)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'key_demo_001', 'sess_001', 'US', 'TX', 'document', 'verified', 25, now() - interval '2 hours'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'key_demo_001', 'sess_002', 'US', 'CA', 'self_declare', 'verified', 30, now() - interval '1 hour'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'key_demo_001', 'sess_003', 'US', 'LA', 'document', 'blocked', 16,  now() - interval '30 minutes'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'key_demo_001', 'sess_004', 'US', 'UT', 'credit_card', 'verified', 42, now() - interval '10 minutes')
ON CONFLICT DO NOTHING;

-- ==========================================
-- After running, verify with:
--   SELECT * FROM plans;
--   SELECT * FROM profiles;
--   SELECT * FROM subscriptions;
-- ==========================================
