# Email Templates — Copply

## 1. Welcome / Onboarding (Sent immediately after signup)

**Subject:** Welcome to Copply — Let's get you compliant in 10 minutes

---

Hi {{first_name}},

Welcome to Copply! You're now set up to comply with Texas HB 18, California AB 2273, Louisiana Act 440, and Utah SB 152 — without building age verification from scratch.

**Your next steps:**

1. **Get your API key** → Dashboard → API Keys → Create Key
2. **Install the SDK** → `npm install @copply/sdk`
3. **Add 3 lines of code** → Wrap your app with `<CopplyProvider>`
4. **Test it** → Use our sandbox mode to verify without real data

**Quick links:**
- [Dashboard](https://copply.dev/dashboard)
- [Documentation](https://docs.copply.dev)
- [SDK Reference](https://docs.copply.dev/sdk)
- [Support](mailto:support@copply.dev)

**Need help?** Reply to this email — it goes straight to our team.

Let's build something compliant.

— The Copply Team

---

## 2. Consent Capture (Sent after first verification)

**Subject:** Your Copply verification record

---

Hi {{first_name}},

This email confirms that age verification was completed for your account on {{date}} at {{time}} UTC.

**Verification Details:**
- Method: {{method}}
- Result: {{result}}
- Session ID: {{session_id}}
- Jurisdiction: {{region}}

**What this means:**
You have provided legally sufficient proof of age to access age-restricted content or services on {{app_name}}. This verification was performed by Copply on behalf of {{app_name}}.

**Your rights:**
- You can request deletion of your verification data at any time: [Privacy Settings](https://copply.dev/privacy)
- For questions about how {{app_name}} uses this data, contact them directly at {{app_support_email}}
- For questions about Copply, reply to this email

**Data retention:**
Your verification record is retained for {{retention_period}} in accordance with {{region}} law and our [Privacy Policy](https://copply.dev/privacy).

— Copply Compliance Team

---

## 3. Parental Consent Request (Sent when minor detected)

**Subject:** Parental consent required for {{app_name}}

---

Hello,

Our system has detected that the user attempting to access {{app_name}} may be under the age of {{minimum_age}}.

Under {{region}} law, parental consent is required before a minor can access this service.

**To provide consent:**
1. Click the link below
2. Verify your identity as the parent/guardian
3. Review the app's content rating and data practices
4. Sign the digital consent form

[Provide Parental Consent →](https://copply.dev/consent/{{token}})

**What happens next:**
- If consent is granted, the minor's account will be activated
- If consent is denied or not provided within 7 days, the account will be deleted
- You can revoke consent at any time from the link above

**Questions?** Contact {{app_name}} at {{app_support_email}} or Copply at support@copply.dev.

— Copply Compliance Team

---

## 4. Invoice / Payment Receipt (Sent by Stripe, styled by us)

**Subject:** Your Copply invoice for {{period}}

---

Hi {{first_name}},

Thanks for being an Copply customer. Here's your invoice for {{period}}.

**Plan:** {{plan_name}}
**Amount:** {{amount}}
**Status:** Paid

[View Invoice →]({{invoice_url}})
[Update Billing →](https://copply.dev/dashboard/settings/billing)

**Usage this period:**
- Verifications: {{verification_count}}
- MAU: {{mau_count}} / {{mau_limit}}

Need to change your plan? You can upgrade or downgrade anytime from your dashboard.

— The Copply Team

---

## 5. Usage Alert (Sent at 80% and 100% of MAU limit)

**Subject:** You're approaching your Copply MAU limit

---

Hi {{first_name}},

Your app {{app_name}} has used {{usage_percent}}% of its monthly active user (MAU) limit on the {{plan_name}} plan.

**Current usage:**
- MAU: {{current_mau}} / {{mau_limit}}
- Billing period ends: {{period_end}}

**What happens if you exceed your limit:**
- Verifications will continue to work
- You'll be charged ${{overage_rate}} per additional 1,000 MAU
- Or upgrade to {{next_plan}} for ${{next_plan_price}}/mo and get {{next_plan_mau}} MAU

[Upgrade Plan →](https://copply.dev/dashboard/settings/billing)
[View Usage →](https://copply.dev/dashboard/analytics)

— The Copply Team

---

## 6. Data Deletion Confirmation (GDPR/CCPA)

**Subject:** Your data deletion request has been completed

---

Hi {{first_name}},

We have received and processed your request to delete your personal data from Copply.

**Deletion Summary:**
- Account data: Deleted
- Verification records: Deleted
- API keys: Revoked and deleted
- Analytics data: Anonymized
- Billing data: Retained for 7 years per tax law, then deleted

**Exceptions:**
- Data we are legally required to retain (e.g., fraud prevention)
- Anonymized aggregate statistics that cannot identify you

This process is complete. You will receive no further emails from us.

If you believe we have missed something, reply to this email within 30 days.

— Copply Privacy Team

---

## 7. Launch Announcement (To waitlist)

**Subject:** Copply is live — comply with age verification laws in 10 minutes

---

Hi {{first_name}},

You signed up for the Copply waitlist — thank you for your patience.

**We're live.**

Copply is a drop-in SDK + dashboard that handles age verification, consent capture, audit logging, and state-specific compliance rules for Texas, California, Louisiana, and Utah.

**What you can do right now:**
- [Create a free account](https://copply.dev/signup) — 1,000 MAU, no credit card
- [Read the docs](https://docs.copply.dev) — integration takes ~10 minutes
- [Check out the demo](https://copply.dev/demo) — see the modal in action

**Launch week deal:**
Use code `LAUNCH50` for 50% off any paid plan for 6 months.

We built this because we needed it ourselves. We hope it saves you the 6+ weeks we almost spent building it from scratch.

Questions? Just reply.

— The Copply Team

---

## Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{first_name}}` | User's first name | "Alex" |
| `{{app_name}}` | Customer's app name | "IndieStream" |
| `{{region}}` | US state or country | "TX" |
| `{{method}}` | Verification method | "document" |
| `{{result}}` | Verification result | "verified" |
| `{{session_id}}` | Unique session ID | "sess_abc123" |
| `{{plan_name}}` | Subscription plan | "Starter" |
| `{{mau_limit}}` | Monthly active user limit | "10000" |
| `{{current_mau}}` | Current MAU usage | "8200" |
| `{{usage_percent}}` | Percentage of limit used | "82" |
| `{{period}}` | Billing period | "June 2024" |
| `{{amount}}` | Invoice amount | "$29.00" |
| `{{retention_period}}` | Data retention duration | "1 year" |

## Sending Infrastructure

- **Transactional:** Postmark (high deliverability, great for compliance emails)
- **Marketing:** ConvertKit or Mailchimp
- **Webhooks:** Stripe → Zapier → Email for invoice events
- **Unsubscribe:** All marketing emails include one-click unsubscribe
- **Compliance:** CAN-SPAM, GDPR, CASL compliant footers on all emails
