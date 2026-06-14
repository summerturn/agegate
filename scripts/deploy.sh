#!/bin/bash
set -e

echo "=== Copply Deployment Script ==="
echo "This script deploys the Copply project to production"
echo ""

# Check prerequisites
echo "Checking prerequisites..."
command -v supabase > /dev/null 2>&1 || { echo "supabase CLI required. Install: brew install supabase"; exit 1; }
command -v vercel > /dev/null 2>&1 || { echo "vercel CLI required. Install: npm i -g vercel"; exit 1; }

# Load env vars
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

if [ -z "$SUPABASE_PROJECT_ID" ]; then
  echo "SUPABASE_PROJECT_ID not set. Set it in .env or export it."
  echo "Get it from your Supabase dashboard URL: https://supabase.com/dashboard/project/<PROJECT_ID>"
  exit 1
fi

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "SUPABASE_ACCESS_TOKEN not set. Get it from https://supabase.com/dashboard/account/tokens"
  exit 1
fi

echo ""
echo "Step 1: Linking Supabase project..."
supabase link --project-ref "$SUPABASE_PROJECT_ID"

echo ""
echo "Step 2: Running database migrations..."
supabase db push

echo ""
echo "Step 3: Deploying edge functions..."
supabase functions deploy verify-age
supabase functions deploy parental-consent
supabase functions deploy delete-verification-data
supabase functions deploy stripe-webhook

echo ""
echo "Step 4: Setting edge function secrets..."
supabase secrets set SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
supabase secrets set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"

echo ""
echo "Step 5: Building Next.js dashboard..."
cd app
npm install
npm run build

echo ""
echo "Step 6: Deploying to Vercel..."
vercel --prod

echo ""
echo "=== Deployment Complete ==="
echo "Dashboard should be live at your Vercel URL"
echo "Edge functions at: https://$SUPABASE_PROJECT_ID.supabase.co/functions/v1/"
