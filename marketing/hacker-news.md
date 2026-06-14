# Hacker News — Show HN Post

## Title

Show HN: Copply – age compliance API that auto-detects user's US state

## URL

https://copply.dev

## Body

Texas HB 18 is live. Louisiana HB 570 kicks in July 2026. Utah SB 152 is already enforced. Florida, Arkansas, and more are queued. Every US state's age verification law has different minimum ages, consent methods, and enforcement mechanics — and zero existing SDKs abstract that correctly.

We built Copply: one POST request handles it all.

```bash
curl -X POST https://<project>.supabase.co/functions/v1/verify-age \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "cp_live_xxx", "userId": "user-abc", "declaredAge": 15}'

# Response:
{
  "allowed": false,
  "requiresConsent": true,
  "consentMethod": "email",
  "state": "TX",           ← auto-detected from IP, you didn't pass it
  "lawNote": "Texas HB 18 - Effective Jan 1, 2026"
}
```

**What's different from everything else:**

1. **IP → state auto-detection.** We resolve the user's US state from CF-IPRegion/ipapi.co. You don't have to pass stateHint. Nobody else does this.

2. **Per-state law engine.** Each state has a different minimum age, required consent methods, data retention period, and enforcement date. TX: 13+, email/CC/ID. LA: 18+, high strictness. UT: credit card or govt ID required. We track them all and update without API changes.

3. **Parental consent as a first-class feature.** Send a consent request, get back a token, poll for parent approval. Built in, not bolted on.

4. **Test mode.** `cp_test_` key prefix gives you synthetic responses per state locally — no DB writes, no rate limits. Like Stripe's test mode.

5. **Free tier: 1,000 MAU.** More than Didit (500), and we include parental consent in the free tier.

**Tech stack:** Supabase Edge Functions (Deno), Next.js 14 dashboard, Stripe billing, PostgreSQL with RLS, Cloudflare-aware state detection.

**Pricing:** Free (1K MAU) → $29/mo (10K) → $99/mo (100K) → $299/mo (unlimited + SLA).

Honest limitations: Apple/Google native age APIs not yet integrated (mocked). ID verification uses declared age + consent method, not OCR. Email sending logs to console (Resend integration ready, not wired). We're transparent about what's real and what's roadmap.

Would love feedback from anyone who's actually had to deal with state AG letters or App Store rejections over this.

## Common Questions & Answers

**Q: Why not just use a checkbox?**
A: Texas HB 18 requires "commercially reasonable" methods. Louisiana has no safe harbor for developers. A checkbox doesn't hold up.

**Q: How do you handle privacy?**
A: We hash user IDs before storing — the raw ID never touches our DB. Deletion API is built in for COPPA compliance. Data retention is configurable per your state's requirement (90 days for UT, 365 for TX, etc.).

**Q: Is IP geolocation accurate enough?**
A: 95%+ accuracy at state level via Cloudflare + ipapi.co. We default to Federal (COPPA) for unknown locations — never false-permit.

**Q: Is this open source?**
A: SDK is MIT. Dashboard and edge functions are source-available.

**Q: What about EU AVMSD?**
A: Q3 2026 roadmap. US first because that's where enforcement is active right now.

## Tone: Humble, technical, admit limitations, never marketing-speak.
