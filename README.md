# AgeGate — Age Verification Compliance SDK

**Comply with Texas HB 18, California, Louisiana, and Utah age verification laws in 10 minutes.**

AgeGate is a drop-in SDK + dashboard for app developers who need legally compliant age verification without building it from scratch.

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## Quick Start

### 1. Install the SDK

```bash
npm install @agegate/sdk
# or
yarn add @agegate/sdk
```

### 2. Initialize in your app

```tsx
import { AgeGateProvider } from '@agegate/sdk';

function App() {
  return (
    <AgeGateProvider apiKey="agegate_live_xxx" region="TX">
      <YourApp />
    </AgeGateProvider>
  );
}
```

### 3. Wrap restricted content

```tsx
import { AgeGate } from '@agegate/sdk';

function MatureContent() {
  return (
    <AgeGate minimumAge={18} fallback={<BlockedScreen />}>
      <RestrictedContent />
    </AgeGate>
  );
}
```

That's it. AgeGate handles the modal, verification methods, state-specific rules, audit logging, and consent capture.

---

## Features

| Feature | Free | Starter | Growth | Enterprise |
|---------|------|---------|--------|------------|
| Self-declaration | ✅ | ✅ | ✅ | ✅ |
| Document upload | — | ✅ | ✅ | ✅ |
| Credit-card verify | — | — | ✅ | ✅ |
| Custom branding | — | ✅ | ✅ | ✅ |
| Webhook logs | — | ✅ | ✅ | ✅ |
| Analytics dashboard | ✅ | ✅ | ✅ | ✅ |
| API access | — | ✅ | ✅ | ✅ |
| Audit logs | — | — | — | ✅ |
| Dedicated support | — | — | — | ✅ |

---

## Supported Jurisdictions

- **Texas** — HB 18 (effective Sep 1, 2024)
- **California** — AB 2273 / SB 1529
- **Louisiana** — Act 440
- **Utah** — SB 152 / SB 287
- **Federal** — COPPA (13+)

Each state has its own minimum age, required verification methods, and parental consent rules. AgeGate automatically applies the correct rules based on the user's region.

---

## Project Structure

```
agegate/
├── landing/          # Marketing landing page (static HTML)
├── app/              # Next.js dashboard + API routes
│   ├── src/app/      # Dashboard pages
│   └── src/api/      # REST API handlers
├── sdk/              # Client SDK (React/Vanilla JS)
├── supabase/         # Edge functions & database schema
├── scripts/          # Setup & testing utilities
└── marketing/        # Launch materials
```

---

## Development

### Prerequisites

- Node.js 18+
- Supabase CLI
- Stripe account (for payments)

### Setup

```bash
# 1. Clone
git clone https://github.com/yourorg/agegate.git
cd agegate

# 2. Install dependencies
cd app && npm install

# 3. Environment variables
cp .env.example .env.local
# Fill in your Supabase & Stripe keys

# 4. Start dev server
npm run dev
```

### Database Setup

```bash
# Link your Supabase project
supabase link --project-ref your-project-ref

# Push schema
supabase db push

# Seed test data
supabase db seed
```

### Stripe Setup

```bash
# Create products & prices in Stripe
cd scripts && node setup-stripe.js
```

---

## API Reference

### `POST /v1/verify`

Verify a user's age.

```json
{
  "country": "US",
  "region": "TX",
  "birthdate": "1990-01-01",
  "method": "self_declare"
}
```

**Response:**

```json
{
  "verified": true,
  "age": 34,
  "method": "self_declare",
  "session_id": "sess_xxx",
  "consent_token": "consent_xxx"
}
```

### `GET /v1/analytics/summary`

Get verification stats for your account.

### `GET /v1/analytics/events`

Get recent verification events.

Full docs: https://docs.agegate.dev

---

## Compliance & Security

- **SOC 2 Type II** — In progress
- **GDPR/CCPA** — Consent tokens + data deletion APIs
- **Audit logs** — Every verification event is logged with tamper-proof hashes
- **Data retention** — Configurable per plan; automatic purging for free tier

---

## Support

- **Docs:** https://docs.agegate.dev
- **Email:** support@agegate.dev
- **Discord:** https://discord.gg/agegate
- **Status:** https://status.agegate.dev

---

## License

MIT © AgeGate Inc.
