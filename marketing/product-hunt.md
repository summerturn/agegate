# Product Hunt Launch Post — AgeGate

## Title (60 chars max)

AgeGate — Comply with age verification laws in 10 min

## Tagline (60 chars max)

Drop-in SDK + dashboard for TX, CA, LA, UT compliance

## Thumbnail / Gallery

- **Thumbnail:** Logo on dark background with green shield icon
- **Gallery Image 1:** Hero screenshot (code snippet + modal preview)
- **Gallery Image 2:** Dashboard analytics view (verification events chart)
- **Gallery Image 3:** State compliance map (TX, CA, LA, UT badges)
- **Gallery Image 4:** Pricing table (4 tiers)
- **Gallery Image 5:** Mobile modal screenshot

## Description (260 chars max)

New laws in Texas, California, Louisiana, and Utah require age verification for apps with mature content. AgeGate is a drop-in SDK and dashboard that handles verification, consent capture, audit logging, and state-specific rules — so you can ship compliance in 10 minutes, not 10 weeks.

## Maker Comment (first comment)

Hey Product Hunt! 👋

We built AgeGate because we kept seeing indie devs get blindsided by new age-verification laws (Texas HB 18 just went live, and more states are coming). Most teams don't have 6 weeks to build document upload, credit-card verification, audit logs, and a consent management system from scratch.

So we made it a 3-line integration:

```tsx
<AgeGateProvider apiKey="xxx" region="TX">
  <AgeGate minimumAge={18}>
    <YourApp />
  </AgeGate>
</AgeGateProvider>
```

Behind the scenes we handle:
- State-specific rules (TX requires "commercially reasonable" methods, CA has different thresholds, etc.)
- Document verification, credit-card age checks, and self-declaration
- Tamper-proof audit logs for legal defense
- Parental consent flows for under-18 users
- A real-time dashboard so your compliance team can sleep at night

**Launch deal:** First 100 PH hunters get 50% off Starter or Growth for 6 months with code `PHLAUNCH50`.

Would love your feedback — especially if you've had to deal with these laws already. What was the hardest part?

## Topics

- Developer Tools
- SaaS
- Legal & Compliance

## Makers

- @yourhandle (Founder & Engineer)
- @cofounderhandle (Design & Growth)

## URL

https://agegate.dev

## First 3 Comments to Post After Launch

1. **Reply to first question about pricing:** "Great question! Free tier is 1,000 MAU — plenty to test the full flow. When you're ready to go live, Starter is $29/mo for 10K MAU. We also have a 14-day free trial on all paid plans, no credit card required."

2. **Reply to first technical question:** "We support React, Vue, vanilla JS, and React Native out of the box. The SDK is ~12KB gzipped. Edge functions run on Supabase so latency is typically <150ms worldwide."

3. **Reply to first compliance question:** "Audit logs are stored with tamper-proof hashes and retained based on your plan (30 days Free, 1 year Starter+, forever Enterprise). You can export them as CSV or PDF for legal discovery."

## Launch Day Schedule

- 00:01 PST — Post goes live, send to mailing list
- 00:30 PST — Reply to first 5 comments personally
- 01:00 PST — Share PH link on Twitter, LinkedIn, HN
- 03:00 PST — Post update with "first 50 signups" milestone
- 06:00 PST — Second wave: relevant Slack/Discord communities
- 12:00 PST — Mid-day check-in, reply to all new comments
- 18:00 PST — Evening push, thank supporters, share stats
- 23:59 PST — Final day push, remind about launch deal

## Metrics to Track

- Upvotes at 1h, 6h, 12h, 24h
- Comments & replies
- Referral traffic to agegate.dev
- Signups from PH source
- Conversions to paid plan
- Code redemptions (`PHLAUNCH50`)
