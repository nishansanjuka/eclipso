#!/bin/bash

# Eclipso Deployment Setup Script
# This script helps configure the deployment pipeline for both services

set -e

echo "🚀 Eclipso Deployment Setup"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check if required tools are installed
echo "Checking prerequisites..."

command -v gcloud >/dev/null 2>&1 || { print_error "Google Cloud SDK not found. Install from https://cloud.google.com/sdk/docs/install"; exit 1; }
print_success "Google Cloud SDK installed"

command -v vercel >/dev/null 2>&1 || { print_error "Vercel CLI not found. Run: npm i -g vercel"; exit 1; }
print_success "Vercel CLI installed"

command -v docker >/dev/null 2>&1 || { print_error "Docker not found. Install from https://docs.docker.com/get-docker/"; exit 1; }
print_success "Docker installed"

echo ""
echo "=============================="
echo "Google Cloud Run Setup"
echo "=============================="
echo ""

read -p "Enter your GCP Project ID: " GCP_PROJECT_ID

if [ -z "$GCP_PROJECT_ID" ]; then
    print_error "Project ID cannot be empty"
    exit 1
fi

print_info "Setting GCP project to: $GCP_PROJECT_ID"
gcloud config set project $GCP_PROJECT_ID

echo ""
print_info "Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
print_success "APIs enabled"

echo ""
print_info "Creating service account for GitHub Actions..."
SERVICE_ACCOUNT_NAME="github-actions"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

# Check if service account exists
if gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL >/dev/null 2>&1; then
    print_info "Service account already exists"
else
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="GitHub Actions Service Account"
    print_success "Service account created"
fi

echo ""
print_info "Granting necessary permissions..."
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/run.admin" \
    --quiet

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/storage.admin" \
    --quiet

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/iam.serviceAccountUser" \
    --quiet

print_success "Permissions granted"

echo ""
print_info "Creating service account key..."
KEY_FILE="gcp-key-${GCP_PROJECT_ID}.json"
gcloud iam service-accounts keys create $KEY_FILE \
    --iam-account=$SERVICE_ACCOUNT_EMAIL

print_success "Service account key created: $KEY_FILE"

echo ""
echo "=============================="
echo "GitHub Secrets Setup"
echo "=============================="
echo ""
print_info "Add the following secrets to your GitHub repository:"
echo ""
echo "GCP_PROJECT_ID = $GCP_PROJECT_ID"
echo ""
echo "GCP_SA_KEY = (paste the entire content of $KEY_FILE)"
echo ""
cat $KEY_FILE
echo ""

read -p "Have you added these secrets to GitHub? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Please add the secrets to GitHub before continuing"
    exit 1
fi

echo ""
echo "=============================="
echo "Google Secret Manager Setup"
echo "=============================="
echo ""
print_info "Creating secrets in Google Secret Manager..."

read -p "Enter your Pinecone API Key: " PINECONE_API_KEY
read -p "Enter your Pinecone Index Name: " PINECONE_INDEX_NAME
read -p "Enter your Database URL for NL2SQL: " NL2SQL_DATABASE_URL
read -p "Enter your Gemini API Key: " GEMINI_API_KEY
read -p "Enter your Clerk Secret Key: " CLERK_SECRET_KEY
read -p "Enter your Clerk Publishable Key: " CLERK_PUBLISHABLE_KEY

echo -n "$PINECONE_API_KEY" | gcloud secrets create PINECONE_API_KEY --data-file=- || gcloud secrets versions add PINECONE_API_KEY --data-file=- <<< "$PINECONE_API_KEY"
echo -n "$PINECONE_INDEX_NAME" | gcloud secrets create PINECONE_INDEX_NAME --data-file=- || gcloud secrets versions add PINECONE_INDEX_NAME --data-file=- <<< "$PINECONE_INDEX_NAME"
echo -n "$NL2SQL_DATABASE_URL" | gcloud secrets create NL2SQL_DATABASE_URL --data-file=- || gcloud secrets versions add NL2SQL_DATABASE_URL --data-file=- <<< "$NL2SQL_DATABASE_URL"
echo -n "$GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=- || gcloud secrets versions add GEMINI_API_KEY --data-file=- <<< "$GEMINI_API_KEY"
echo -n "$CLERK_SECRET_KEY" | gcloud secrets create CLERK_SECRET_KEY --data-file=- || gcloud secrets versions add CLERK_SECRET_KEY --data-file=- <<< "$CLERK_SECRET_KEY"
echo -n "$CLERK_PUBLISHABLE_KEY" | gcloud secrets create CLERK_PUBLISHABLE_KEY --data-file=- || gcloud secrets versions add CLERK_PUBLISHABLE_KEY --data-file=- <<< "$CLERK_PUBLISHABLE_KEY"

print_success "Secrets created in Google Secret Manager"

echo ""
print_info "Granting Cloud Run access to secrets..."

# Get the project number
PROJECT_NUMBER=$(gcloud projects describe $GCP_PROJECT_ID --format="value(projectNumber)")
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for SECRET in PINECONE_API_KEY PINECONE_INDEX_NAME NL2SQL_DATABASE_URL GEMINI_API_KEY CLERK_SECRET_KEY CLERK_PUBLISHABLE_KEY; do
    gcloud secrets add-iam-policy-binding $SECRET \
        --member="serviceAccount:$COMPUTE_SA" \
        --role="roles/secretmanager.secretAccessor" \
        --quiet
done

print_success "Cloud Run granted access to secrets"

echo ""
echo "=============================="
echo "Vercel Setup"
echo "=============================="
echo ""

print_info "Linking Vercel project..."
cd apps/api
vercel link
cd ../..

print_info "Getting Vercel project information..."
vercel project ls

echo ""
print_info "Add the following secrets to your GitHub repository:"
echo ""
echo "VERCEL_TOKEN = (create at https://vercel.com/account/tokens)"
echo "VERCEL_ORG_ID = (from vercel project ls output)"
echo "VERCEL_PROJECT_ID = (from vercel project ls output)"
echo "DATABASE_URL = (your PostgreSQL connection string)"
echo ""

echo ""
echo "=============================="
echo "✅ Setup Complete!"
echo "=============================="
echo ""
print_success "Google Cloud Run configured"
print_success "Service account created and key saved to: $KEY_FILE"
print_success "Secrets created in Google Secret Manager"
print_success "Vercel project linked"
echo ""
print_info "Next steps:"
echo "1. Add all GitHub secrets as instructed above"
echo "2. Push to main branch to trigger deployments"
echo "3. Monitor deployments in GitHub Actions tab"
echo ""
print_info "Important files:"
echo "- Service account key: $KEY_FILE (Keep this secure!)"
echo "- Deployment guide: DEPLOYMENT.md"
echo ""
