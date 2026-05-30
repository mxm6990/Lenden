#!/usr/bin/env bash
set -euo pipefail

# Configure Supabase Edge Function secrets for experimental DSE proxy.
# Usage:
#   ./scripts/configure-dse-proxy.sh https://your-dse-api.onrender.com [project-ref]

BASE_URL="${1:-}"
PROJECT_REF="${2:-fnxpdpxbiinnddftysqq}"

if [[ -z "$BASE_URL" ]]; then
  echo "Usage: ./scripts/configure-dse-proxy.sh https://your-dse-api.onrender.com [project-ref]"
  exit 1
fi

BASE_URL="${BASE_URL%/}"

echo "Setting Supabase secrets for project: $PROJECT_REF"
supabase secrets set DSE_MARKET_DATA_MODE=experimental_dse --project-ref "$PROJECT_REF"
supabase secrets set "DSE_EXPERIMENTAL_BASE_URL=$BASE_URL" --project-ref "$PROJECT_REF"

echo "Deploying dse-market-data edge function..."
supabase functions deploy dse-market-data --project-ref "$PROJECT_REF"

echo "Done. Verify with:"
echo "  node scripts/verify-experimental-dse.mjs $BASE_URL"
