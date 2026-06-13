# AgeGate — Go-Live Checklist

## Pre-Launch (T-7 Days)

### Infrastructure
- [ ] Supabase project created & linked
- [ ] Database schema pushed (`supabase db push`)
- [ ] Edge functions deployed (`supabase functions deploy`)
- [ ] RLS policies enabled on all tables
- [ ] Database backups configured
- [ ] Vercel project connected to GitHub repo
- [ ] Vercel environment variables set (see `.env.example`)
- [ ] Custom domain (`agegate.dev`) configured in Vercel
- [ ] SSL certificate auto-provisioned
- [ ] DNS A/AAAA records pointed to Vercel

### Payments
- [ ] Stripe account activated
- [ ] Products & prices created (`node scripts/setup-stripe.js`)
- [ ] Price IDs added to Vercel env vars
- [ ] Stripe webhook endpoint configured (`/api/webhooks/stripe`)
- [ ] Webhook signing secret added to env vars
- [ ] Test mode checkout flow verified end-to-end
- [ ] Subscription lifecycle tested (upgrade, downgrade, cancel)

### Security
- [ ] `APP_SECRET` generated (32+ random chars)
- [ ] Supabase service role key rotated
- [ ] Stripe secret key restricted to required permissions
- [ ] CORS origins configured (production domain only)
- [ ] Rate limiting enabled on API routes
- [ ] Content Security Policy headers set
- [ ] `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` headers active
- [ ] Dependabot / Snyk scanning enabled

### Monitoring
- [ ] PostHog project created & key added
- [ ] Sentry project created & DSN added
- [ ] Uptime monitoring (e.g., Pingdom) configured
- [ ] Status page (`status.agegate.dev`) set up
- [ ] Log drains configured (Datadog / Logflare)

### Content
- [ ] Landing page copy finalized & proofread
- [ ] Pricing page matches Stripe products exactly
- [ ] FAQ covers top 10 anticipated questions
- [ ] Privacy policy drafted & reviewed
- [ ] Terms of service drafted & reviewed
- [ ] Cookie consent banner implemented
- [ ] DPA (Data Processing Agreement) available for Enterprise

## Soft Launch (T-3 Days)

### Testing
- [ ] Run `scripts/test-api.sh` against production API
- [ ] Verify all 4 state rules (TX, CA, LA, UT) return correct results
- [ ] Test document upload flow on mobile & desktop
- [ ] Test credit-card verification flow (Growth+)
- [ ] Test subscription upgrade/downgrade paths
- [ ] Test webhook handling (invoice.paid, customer.subscription.deleted)
- [ ] Load test with 1,000 concurrent verifications
- [ ] Verify email delivery (signup, password reset, invoice)

### Analytics
- [ ] PostHog events firing correctly (signup, verify, subscribe)
- [ ] Funnel dashboard created (landing → signup → subscribe)
- [ ] Stripe revenue recognition report configured
- [ ] Google Analytics 4 property connected (optional)

### Support
- [ ] Support email inbox created (`support@agegate.dev`)
- [ ] Help desk (Crisp / Intercom) widget installed
- [ ] Internal runbook drafted for common issues
- [ ] On-call rotation defined (if team > 1)

## Launch Day (T-0)

### Morning (08:00)
- [ ] Final production deploy from `main` branch
- [ ] Verify deploy succeeded in Vercel dashboard
- [ ] Run smoke tests (`scripts/test-api.sh`)
- [ ] Check error rates in Sentry (should be 0)
- [ ] Check PostHog events (should be flowing)

### Launch (10:00)
- [ ] Post Product Hunt launch
- [ ] Post Hacker News Show HN
- [ ] Publish Twitter/X thread
- [ ] Send launch email to waitlist
- [ ] Announce in relevant Discord/Slack communities

### Afternoon (14:00)
- [ ] Monitor Sentry for new errors
- [ ] Monitor Stripe for failed payments
- [ ] Monitor PostHog for drop-off points
- [ ] Respond to all Product Hunt comments within 1 hour
- [ ] Respond to all HN comments within 1 hour

### Evening (18:00)
- [ ] Daily metrics snapshot (signups, verifications, MRR)
- [ ] Write retrospective notes
- [ ] Schedule follow-up tweets for next 3 days

## Post-Launch (T+1 to T+7)

- [ ] Fix any critical bugs within 24 hours
- [ ] Reach out to first 10 paying customers personally
- [ ] Collect testimonials for landing page
- [ ] Publish "How we built AgeGate" blog post
- [ ] Submit to relevant directories (e.g., SaaSworthy, Capterra)
- [ ] Schedule weekly metrics review
- [ ] Plan v1.1 feature roadmap based on feedback

---

## Emergency Contacts

| Service | Contact | Escalation |
|---------|---------|------------|
| Vercel | support@vercel.com | Twitter DM @vercel |
| Supabase | support@supabase.io | Discord #support |
| Stripe | support@stripe.com | Dashboard chat |
| PostHog | support@posthog.com | Slack community |
| Domain | registrar support | — |

---

## Rollback Plan

If a critical issue is discovered:

1. **Immediate:** Toggle feature flag or disable affected edge function
2. **Short-term:** Revert Vercel deployment to last known good commit
3. **Database:** Restore from last automated backup (RPO: 1 hour)
4. **Communicate:** Post on status page + Twitter + email affected users

---

*Last updated: 2024-06-12*
