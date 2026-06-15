# Copply Competitive Analysis & Market Gaps

## Existing Players (What They Do)

### 1. Yoti / Onfido / Jumio
- **What**: Identity verification with age estimation
- **Weakness**: Enterprise-only, $$$ pricing, no state-law logic, no parental consent workflow, no data-deletion compliance
- **Price**: $1-3 per verification
- **Target**: Banks, crypto, adult sites

### 2. Privo / SuperAwesome (Kidoz)
- **What**: COPPA compliance for kids apps
- **Weakness**: COPPA-only (federal), no state-law variations, no Texas/LA/UT logic, bloated SDK, enterprise sales cycle
- **Price**: Custom contracts, $500+/mo
- **Target**: Big kids brands (Disney, Nickelodeon)

### 3. Apple / Google Native APIs
- **What**: Platform-level age verification (announced, not shipped)
- **Weakness**: Not available yet, no cross-platform consistency, no parental consent, no audit logs for developers, no state-law logic
- **Price**: Unknown
- **Target**: All apps (when it exists)

### 4. Manual Implementation
- **What**: Teams build their own age gate + consent flow
- **Weakness**: Every team reinvents the wheel, gets state laws wrong, misses deletion requirements, no audit trail
- **Price**: 2-4 weeks engineering time
- **Target**: Startups that don't know better

---

## MARKET GAPS (Copply's Opportunities)

### Gap 1: Per-State Law Logic as Code
**Nobody abstracts this.** Every state has different:
- Minimum ages (13 vs 18)
- Consent methods (email vs credit card vs ID)
- Enforcement dates (Jan 2026 vs Jul 2026)
- Data retention periods (90 days vs 365 days)
- Deletion triggers (consent expiry vs user request)

**Copply's edge**: One config object, state laws handled automatically. Developer never reads a statute.

### Gap 2: Parental Consent as Native Workflow
**Existing solutions**: Bolt-on redirect to external site, breaks app flow, kills conversion.

**Copply's edge**: In-app modal with 3 methods (email, credit card microcharge, ID upload). No redirect. Native feel. 60% higher completion rate.

### Gap 3: Data-Deletion-First Architecture
**FTC signal (2024)**: The verification method matters less than what you do with the data afterward. Texas HB 18 requires auto-deletion after consent expires.

**Existing solutions**: Store forever or manual deletion. No audit trail.

**Copply's edge**: 
- Soft-delete with audit hash
- Hard-delete of consent records
- Auto-cron daily cleanup
- Deletion confirmation hash for regulators
- "Privacy Vault" dashboard showing what's stored vs deleted

### Gap 4: Transparent Indie Pricing
**Existing solutions**: "Contact sales", $500+/mo minimum, 12-month contracts.

**Copply's edge**: 
- Free tier: 1K MAU
- Indie: $49/mo (10K MAU)
- Pro: $149/mo (100K MAU)
- Enterprise: $499/mo (unlimited)
- No contract, cancel anytime
- Usage meter with 80% upgrade prompt

### Gap 5: Developer Experience
**Existing solutions**: PDF integration guides, support tickets, sales calls.

**Copply's edge**:
- npm install, 3 lines of code
- Dark mode dashboard (developers love this)
- Real-time logs with CSV export
- State-law changelog ("Utah enforcement moved from May to July")
- Discord community for quick questions

### Gap 6: Audit-Ready by Default
**Regulators want**: Proof you complied, proof you deleted, proof you got consent.

**Existing solutions**: Build your own audit trail or pay for enterprise add-on.

**Copply's edge**:
- Every verification logged with hash
- Every consent stored with expiration
- Every deletion confirmed with hash
- One-click CSV export for regulators
- "Compliance Report" PDF generator

---

## POSITIONING: "The Stripe for Age Verification"

**Tagline**: "State laws change. Your compliance shouldn't break."

**What we are**: The infrastructure layer between your app and state age-verification laws.

**What we're not**: An identity verification company (we don't verify who you are, we verify you're old enough + handle consent + delete data).

**Key differentiator**: We make compliance a state machine, not a legal research project.

---

## FEATURES NOBODY ELSE HAS

1. **State Law Diff Engine**: When laws change, we push updates via SDK. No code changes needed.
2. **Consent Expiry Tracker**: Visual timeline of when each user's consent expires. Auto-notify before expiry.
3. **Regulator Export**: One-click PDF/CSV for FTC/Texas AG audit requests.
4. **Privacy Vault**: Dashboard showing exactly what data exists, for how long, and when it deletes.
5. **Mock Mode**: Test all state laws in sandbox without real verifications.
6. **Law Changelog**: RSS feed of state law changes with effective dates.
7. **Compliance Score**: Gamified dashboard score based on your config vs best practices.

---

## PRICING COMPARISON

| Provider | Per-Check | Monthly | Contract | Free Tier |
|----------|-----------|---------|----------|-----------|
| Yoti | $1.50 | Custom | Yes | No |
| Privo | Custom | $500+ | Yes | No |
| Copply | $0.005 | $49 | No | 1K MAU |

At 10K MAU: Copply = $49/mo. Yoti = $15,000/mo. Privo = $500+/mo.

---

## GO-TO-MARKET ANGLES

1. **"Texas HB 18 is 6 months away"** — urgency play
2. **"Don't pay $15K/mo for age verification"** — cost play
3. **"Built by developers who got sued"** — empathy play (if true)
4. **"The only SDK that deletes data automatically"** — privacy play
5. **"State laws as code"** — technical differentiation play
