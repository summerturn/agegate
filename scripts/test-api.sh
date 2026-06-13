#!/usr/bin/env bash
# ==========================================
# AgeGate — API Testing Script
# Usage: ./scripts/test-api.sh <API_KEY>
# ==========================================

set -euo pipefail

API_KEY="${1:-}"
BASE_URL="${BASE_URL:-https://api.agegate.dev}"

if [ -z "$API_KEY" ]; then
  echo "Usage: $0 <API_KEY>"
  echo "Example: $0 agegate_live_xxxxxxxxxxxxxxxx"
  exit 1
fi

echo "🧪 Testing AgeGate API at $BASE_URL"
echo "================================================"

# 1. Health check
echo ""
echo "1️⃣  Health Check"
curl -s "$BASE_URL/health" | jq .

# 2. Verify an adult (should pass)
echo ""
echo "2️⃣  Verify Adult (expect: verified)"
curl -s -X POST "$BASE_URL/v1/verify" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"country":"US","region":"TX","birthdate":"1990-01-01","method":"self_declare"}' | jq .

# 3. Verify a minor (should block)
echo ""
echo "3️⃣  Verify Minor (expect: blocked)"
curl -s -X POST "$BASE_URL/v1/verify" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"country":"US","region":"TX","birthdate":"2015-01-01","method":"self_declare"}' | jq .

# 4. Verify with document method
echo ""
echo "4️⃣  Verify with Document (expect: verified)"
curl -s -X POST "$BASE_URL/v1/verify" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"country":"US","region":"CA","birthdate":"1985-06-15","method":"document"}' | jq .

# 5. Analytics summary
echo ""
echo "5️⃣  Analytics Summary"
curl -s "$BASE_URL/v1/analytics/summary" \
  -H "Authorization: Bearer $API_KEY" | jq .

# 6. Recent events
echo ""
echo "6️⃣  Recent Events"
curl -s "$BASE_URL/v1/analytics/events?limit=5" \
  -H "Authorization: Bearer $API_KEY" | jq .

echo ""
echo "================================================"
echo "✅ API tests complete!"
