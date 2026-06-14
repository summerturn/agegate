# Twitter/X Launch Thread — Copply

## Tweet 1 (Hook)

New laws in Texas, California, Louisiana, and Utah now require age verification for apps with mature content.

Most indie devs don't have 6 weeks to build document upload, credit-card verification, audit logs, and consent management from scratch.

So we built Copply. 🧵

---

## Tweet 2 (The Problem)

Texas HB 18 went live Sep 1, 2024.

It requires "commercially reasonable" age verification. A checkbox won't cut it.

California, Louisiana, and Utah have similar laws.

If you're building an app with mature content, this is now your problem whether you like it or not.

---

## Tweet 3 (The Solution)

Copply is a drop-in SDK + dashboard.

3 lines of code:

```tsx
<CopplyProvider apiKey="xxx" region="TX">
  <Copply minimumAge={18}>
    <YourApp />
  </Copply>
</CopplyProvider>
```

We handle the modal, verification, state rules, audit logs, and consent capture.

---

## Tweet 4 (Features)

What you get:

✅ Self-declaration, document upload, credit-card verification
✅ Automatic state-specific rule application (TX, CA, LA, UT)
✅ Tamper-proof audit logs for legal defense
✅ Parental consent flows for under-18 users
✅ Real-time compliance dashboard
✅ ~12KB gzipped SDK (React, Vue, vanilla JS, RN)

---

## Tweet 5 (Pricing)

Free for up to 1,000 MAU.

Paid plans start at $29/mo.

Every plan includes:
- Unlimited verifications within MAU limit
- Audit logs
- Analytics dashboard
- Email support

Enterprise gets dedicated Slack + SLA.

---

## Tweet 6 (Social Proof / Urgency)

We soft-launched 2 weeks ago.

Already processing 10K+ verifications/day for 50+ apps.

One customer went from "we need to comply by Friday" to live in production in 3 hours.

---

## Tweet 7 (CTA + Launch Deal)

We're live on Product Hunt today!

First 100 people get 50% off Starter or Growth for 6 months with code PHLAUNCH50.

🔗 https://copply.dev

Drop a 👋 if you've had to deal with these laws. I'd love to hear your story.

---

## Follow-Up Tweets (Schedule over next 3 days)

### Day 2 — Technical Deep Dive

How Copply handles state-specific rules:

Each state has different minimum ages, required methods, and parental consent rules.

We map the user's IP → region → rule set at the edge.

No client-side spoofing possible. Verification happens on Supabase Edge Functions with signed tokens.

Full write-up: https://docs.copply.dev/architecture

---

### Day 2 — Customer Story

"We had 72 hours to comply with Texas HB 18 before our app store review."

Copply integration took 2 hours.

Document verification flow took 1 hour to customize.

We passed review with zero issues.

— @indiedevhandle, Founder of [App Name]

---

### Day 3 — Roadmap

Top 3 feature requests from launch week:

1. EU AVMSD compliance (Q3)
2. Biometric age estimation (Q3)
3. Shopify / WordPress plugins (Q2)

Public roadmap: https://github.com/yourorg/copply/issues/roadmap

Vote for what you need!

---

### Day 3 — Behind the Scenes

Tech stack:
- SDK: TypeScript, ~12KB gzipped
- Backend: Supabase Edge Functions (Deno)
- Dashboard: Next.js 14, Tailwind, shadcn/ui
- Payments: Stripe Billing
- Hosting: Vercel + Supabase

Total time from idea to launch: 6 weeks.
Team: 2 people.

---

## Engagement Tactics

- Pin the thread to your profile for 7 days
- Quote-tweet with updates every 6 hours on launch day
- Reply to every comment within 15 minutes
- Tag relevant accounts (e.g., @stripe, @supabase, @vercel) in follow-up tweets
- Use 1-2 relevant hashtags max (#buildinpublic #indiedev)
- Cross-post key tweets to LinkedIn

## Media

- Tweet 1: GIF of age-gate modal appearing
- Tweet 3: Screenshot of code snippet
- Tweet 4: Dashboard screenshot
- Tweet 6: Chart of verification volume
- Tweet 7: Product Hunt badge
