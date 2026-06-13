# Hacker News — Show HN Post

## Title

Show HN: AgeGate — Drop-in age verification SDK for app compliance

## URL

https://agegate.dev

## Body

New laws in Texas (HB 18), California, Louisiana, and Utah now require age verification for apps with mature content. We kept seeing indie devs spend 6+ weeks building this from scratch — document upload, credit-card verification, audit logs, consent management, state-specific rules.

So we built AgeGate: a drop-in SDK + dashboard that handles it all in ~10 minutes.

**What it does:**
- Embeds a customizable age-verification modal in your app
- Automatically applies state-specific rules (TX, CA, LA, UT, and more coming)
- Supports self-declaration, document upload, and credit-card age verification
- Captures and stores tamper-proof audit logs
- Provides a real-time dashboard for compliance teams

**Tech stack:**
- SDK: React / Vue / Vanilla JS / React Native (~12KB gzipped)
- Backend: Supabase Edge Functions (Deno)
- Dashboard: Next.js 14, Tailwind, shadcn/ui
- Payments: Stripe Billing
- Hosting: Vercel + Supabase

**Pricing:**
- Free: 1,000 MAU
- Starter: $29/mo (10K MAU)
- Growth: $99/mo (100K MAU)
- Enterprise: $299/mo (unlimited + SLA)

We'd love feedback, especially from anyone who's had to deal with these laws. What's missing? What would make your life easier?

## Discussion Strategy

### First Hour
- Stay online and reply to every comment within 5 minutes
- Be honest about limitations (e.g., "We don't cover EU AVMSD yet, but it's on the roadmap")
- Upvote substantive comments, ignore drive-by negativity

### Common Questions & Answers

**Q: Why not just use a checkbox?**
A: Texas HB 18 explicitly requires "commercially reasonable" age verification — a checkbox won't hold up in court. California and Louisiana have similar standards. We provide the legal defensibility.

**Q: How do you handle privacy?**
A: Documents are verified via a third-party provider (Onfido/Trulioo) and immediately discarded — we never store raw images. Only a hashed verification token is retained. GDPR/CCPA deletion APIs are built in.

**Q: What about false positives / negatives?**
A: We support multiple methods so users can retry with a different approach. Document verification has ~99% accuracy. Credit-card checks use billing address + name matching. Self-declaration is the fallback with clear liability disclaimers.

**Q: Is this open source?**
A: The SDK is open source (MIT). The dashboard and edge functions are source-available (paid license). We want developers to trust the client-side code while funding ongoing compliance updates via the hosted service.

**Q: Why Supabase over AWS/GCP?**
A: Edge functions give us <150ms cold starts globally, and the Postgres + Auth combo covers 90% of our needs without managed service sprawl. Also: no egress cost surprises.

### Tone Guidelines
- Humble, not hype-y
- Technical depth when asked
- Admit what we don't know
- No marketing speak
- No "DM us for a demo" — answer publicly

## Follow-Up Comments

If the post gains traction, add these as replies to your own post:

1. **After 2 hours:** "Update: 200+ signups in the first 2 hours. Top request so far is React Native support — we shipped a beta 30 minutes ago."

2. **After 6 hours:** "Update: 500+ signups. Most common question is about EU coverage. We're targeting Q3 for AVMSD compliance."

3. **Next day:** "Thank you HN! 1,200 signups, 47 paid conversions. We read every comment and filed 23 feature requests. Here's the public roadmap: https://github.com/yourorg/agegate/issues/roadmap"

## Metrics to Track

- Points at 1h, 3h, 6h, 12h, 24h
- Position on front page / Ask/Show HN section
- Comments (quality > quantity)
- Referral traffic to agegate.dev
- Signups with `ref=hn` source
- Conversions to paid

## Anti-Patterns to Avoid

- Don't ask friends to upvote (HN detects this)
- Don't post during US sleeping hours (aim for 7-9am PST)
- Don't use clickbait titles
- Don't argue with trolls — reply once, then move on
- Don't edit the title after posting (resets ranking)
