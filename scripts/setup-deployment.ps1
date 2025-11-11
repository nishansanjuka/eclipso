# Eclipso Deployment Setup Script (PowerShell)
# This script helps configure the deployment pipeline for both services

$ErrorActionPreference = "Stop"

Write-Host "🚀 Eclipso Deployment Setup" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

function Print-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Print-Error {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Print-Info {
    param($Message)
    Write-Host "ℹ $Message" -ForegroundColor Yellow
}

# Check if required tools are installed
Write-Host "Checking prerequisites..." -ForegroundColor White

if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Print-Error "Google Cloud SDK not found. Install from https://cloud.google.com/sdk/docs/install"
    exit 1
}
Print-Success "Google Cloud SDK installed"

if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Print-Error "Vercel CLI not found. Run: npm i -g vercel"
    exit 1
}
Print-Success "Vercel CLI installed"

if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Print-Error "Docker not found. Install from https://docs.docker.com/get-docker/"
    exit 1
}
Print-Success "Docker installed"

Write-Host ""
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "Google Cloud Run Setup" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

$GCP_PROJECT_ID = Read-Host "Enter your GCP Project ID"

if ([string]::IsNullOrWhiteSpace($GCP_PROJECT_ID)) {
    Print-Error "Project ID cannot be empty"
    exit 1
}

Print-Info "Setting GCP project to: $GCP_PROJECT_ID"
gcloud config set project $GCP_PROJECT_ID

Write-Host ""
Print-Info "Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
Print-Success "APIs enabled"

Write-Host ""
Print-Info "Creating service account for GitHub Actions..."
$SERVICE_ACCOUNT_NAME = "github-actions"
$SERVICE_ACCOUNT_EMAIL = "$SERVICE_ACCOUNT_NAME@$GCP_PROJECT_ID.iam.gserviceaccount.com"

# Check if service account exists
$saExists = gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL 2>&1
if ($LASTEXITCODE -eq 0) {
    Print-Info "Service account already exists"
} else {
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME --display-name="GitHub Actions Service Account"
    Print-Success "Service account created"
}

Write-Host ""
Print-Info "Granting necessary permissions..."
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role="roles/run.admin" --quiet
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role="roles/storage.admin" --quiet
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role="roles/iam.serviceAccountUser" --quiet
Print-Success "Permissions granted"

Write-Host ""
Print-Info "Creating service account key..."
$KEY_FILE = "gcp-key-$GCP_PROJECT_ID.json"
gcloud iam service-accounts keys create $KEY_FILE --iam-account=$SERVICE_ACCOUNT_EMAIL
Print-Success "Service account key created: $KEY_FILE"

Write-Host ""
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "GitHub Secrets Setup" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""
Print-Info "Add the following secrets to your GitHub repository:"
Write-Host ""
Write-Host "GCP_PROJECT_ID = $GCP_PROJECT_ID" -ForegroundColor White
Write-Host ""
Write-Host "GCP_SA_KEY = (paste the entire content of $KEY_FILE)" -ForegroundColor White
Write-Host ""
Get-Content $KEY_FILE | Write-Host -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Have you added these secrets to GitHub? (y/n)"
if ($response -ne 'y') {
    Print-Error "Please add the secrets to GitHub before continuing"
    exit 1
}

Write-Host ""
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "Google Secret Manager Setup" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""
Print-Info "Creating secrets in Google Secret Manager..."

$PINECONE_API_KEY = Read-Host "Enter your Pinecone API Key"
$PINECONE_INDEX_NAME = Read-Host "Enter your Pinecone Index Name"
$NL2SQL_DATABASE_URL = Read-Host "Enter your Database URL for NL2SQL"
$GEMINI_API_KEY = Read-Host "Enter your Gemini API Key"
$CLERK_SECRET_KEY = Read-Host "Enter your Clerk Secret Key"
$CLERK_PUBLISHABLE_KEY = Read-Host "Enter your Clerk Publishable Key"

# Create or update secrets
@{
    "PINECONE_API_KEY" = $PINECONE_API_KEY
    "PINECONE_INDEX_NAME" = $PINECONE_INDEX_NAME
    "NL2SQL_DATABASE_URL" = $NL2SQL_DATABASE_URL
    "GEMINI_API_KEY" = $GEMINI_API_KEY
    "CLERK_SECRET_KEY" = $CLERK_SECRET_KEY
    "CLERK_PUBLISHABLE_KEY" = $CLERK_PUBLISHABLE_KEY
}.GetEnumerator() | ForEach-Object {
    $secretName = $_.Key
    $secretValue = $_.Value
    
    $secretExists = gcloud secrets describe $secretName 2>&1
    if ($LASTEXITCODE -eq 0) {
        echo $secretValue | gcloud secrets versions add $secretName --data-file=-
    } else {
        echo $secretValue | gcloud secrets create $secretName --data-file=-
    }
}

Print-Success "Secrets created in Google Secret Manager"

Write-Host ""
Print-Info "Granting Cloud Run access to secrets..."

# Get the project number
$PROJECT_NUMBER = (gcloud projects describe $GCP_PROJECT_ID --format="value(projectNumber)")
$COMPUTE_SA = "$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

@("PINECONE_API_KEY", "PINECONE_INDEX_NAME", "NL2SQL_DATABASE_URL", "GEMINI_API_KEY", "CLERK_SECRET_KEY", "CLERK_PUBLISHABLE_KEY") | ForEach-Object {
    gcloud secrets add-iam-policy-binding $_ --member="serviceAccount:$COMPUTE_SA" --role="roles/secretmanager.secretAccessor" --quiet
}

Print-Success "Cloud Run granted access to secrets"

Write-Host ""
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "Vercel Setup" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

Print-Info "Linking Vercel project..."
Set-Location apps\api
vercel link
Set-Location ..\..

Print-Info "Getting Vercel project information..."
vercel project ls

Write-Host ""
Print-Info "Add the following secrets to your GitHub repository:"
Write-Host ""
Write-Host "VERCEL_TOKEN = (create at https://vercel.com/account/tokens)" -ForegroundColor White
Write-Host "VERCEL_ORG_ID = (from vercel project ls output)" -ForegroundColor White
Write-Host "VERCEL_PROJECT_ID = (from vercel project ls output)" -ForegroundColor White
Write-Host "DATABASE_URL = (your PostgreSQL connection string)" -ForegroundColor White
Write-Host ""

Write-Host ""
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""
Print-Success "Google Cloud Run configured"
Print-Success "Service account created and key saved to: $KEY_FILE"
Print-Success "Secrets created in Google Secret Manager"
Print-Success "Vercel project linked"
Write-Host ""
Print-Info "Next steps:"
Write-Host "1. Add all GitHub secrets as instructed above" -ForegroundColor White
Write-Host "2. Push to main branch to trigger deployments" -ForegroundColor White
Write-Host "3. Monitor deployments in GitHub Actions tab" -ForegroundColor White
Write-Host ""
Print-Info "Important files:"
Write-Host "- Service account key: $KEY_FILE (Keep this secure!)" -ForegroundColor White
Write-Host "- Deployment guide: DEPLOYMENT.md" -ForegroundColor White
Write-Host ""
