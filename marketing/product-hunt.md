# Product Hunt Launch Post — Copply

## Title (60 chars max)

Copply — Age compliance API for US state laws in 10 min

## Tagline (60 chars max)

One API call. TX, CA, LA, UT, FL compliance. Auto-detects state.

## Description (260 chars max)

Texas HB 18, Louisiana HB 570, Utah SB 152 are live now. Copply is the Stripe-for-age-compliance: one API call handles state detection, parental consent workflows, audit logs, and all 50-state law updates — so you ship in 10 minutes, not 10 weeks.

## Maker Comment (first comment)

Hey Product Hunt! 👋

We built Copply because we watched indie developers get blindsided by a wave of US state age verification laws — Texas HB 18 (live now), Louisiana HB 570 (July 2026), Utah SB 152 (active), Florida HB 3 (July 2026) — with more coming every month.

Every other tool either costs enterprise money, requires doc review for each state manually, or just doesn't handle parental consent at all.

We made it 3 lines:

```js
const result = await fetch('https://<your-project>.supabase.co/functions/v1/verify-age', {
  method: 'POST',
  body: JSON.stringify({ apiKey: 'cp_live_xxx', userId: 'user-123', declaredAge: 16 })
});
// → { allowed: false, requiresConsent: true, consentMethod: 'email', state: 'TX' }
// State was auto-detected from IP — no stateHint needed.
```

What makes Copply different:

- **Auto state detection**: We resolve the user's US state from their IP — you don't have to pass it
- **Per-state law logic**: TX, CA, LA, UT, FL, AR each have different minimum ages, consent methods, and enforcement dates — we handle all of it
- **Parental consent as a native feature**: Not bolted on. Built in. Email + credit card + ID upload flows included
- **Test mode**: Use `cp_test_` keys locally — synthetic responses, zero DB writes, just like Stripe
- **Law change alerts**: We track every new state bill and push updates — your code doesn't change when laws do
- **1,000 free verifications/month**: More than any competitor on the free tier
- **Audit logs + data deletion**: FTC-defensible audit trail with COPPA-compliant deletion APIs

**Launch deal:** First 200 PH hunters get 50% off for 6 months — code `PHLAUNCH50`.

Would love your feedback, especially if you've been hit by a cease-and-desist or state AG letter.

## Topics

- Developer Tools
- SaaS
- Legal & Compliance
- APIs

## URL

https://copply.dev

## Launch Day Schedule

- 00:01 PST — Post goes live, email list blast
- 00:30 PST — Reply to first comments
- 01:00 PST — Twitter/X thread, LinkedIn, HN post
- 06:00 PST — Relevant Slack/Discord communities (indie hackers, developer compliance channels)
- 12:00 PST — Mid-day engagement check
- 18:00 PST — Evening push, stats update

## Metrics to Track

- Upvotes at 1h, 6h, 12h, 24h
- Signups with `ref=ph` source
- `cp_test_` key activations (proxy for dev interest)
- Paid conversions in first 72h
- Code redemptions (`PHLAUNCH50`)
