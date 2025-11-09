# Postman Sync Scripts

These scripts automatically sync your FastAPI OpenAPI schema to a Postman collection with Clerk authentication.

## Setup

1. **Get your Postman API Key**:
   - Go to https://web.postman.co/settings/me/api-keys
   - Generate a new API key
   - Add it to your `.env` file as `POSTMAN_API_KEY`

2. **Collection ID** (already configured):
   - Collection ID: `28882133-22bee2b5-81ac-4ef3-b65c-2fc9bb45cd6d`

3. **Environment Variables Required**:
   ```bash
   POSTMAN_API_KEY=your_postman_api_key_here
   POSTMAN_COLLECTION_ID=28882133-22bee2b5-81ac-4ef3-b65c-2fc9bb45cd6d
   ```

## Usage

1. **Start your NL2SQL service**:
   ```bash
   pnpm dev
   ```

2. **Run sync command**:
   ```bash
   pnpm sync:postman
   ```

## What it does

1. Downloads OpenAPI schema from `http://localhost:8000/openapi.json`
2. Converts it to a Postman collection using `openapi-to-postmanv2`
3. Injects a pre-request script that:
   - Creates a Clerk session
   - Activates the user's organization
   - Generates a JWT token
   - Sets it as `bearerToken` in environment variables
4. Uploads the patched collection to Postman

## Files

- `patch-postman.mjs` - Script to inject pre-request authentication
- `pre-request.js` - Clerk authentication logic for Postman
- `postman-env-dev.json` - Development environment template (baseUrl: http://localhost:8000)

## Postman Environment Setup

Import `postman-env-dev.json` and set:
- `CLERK_SECRET_KEY` - Your Clerk secret key
- `TEST_CLERK_USER_ID` - A Clerk user ID with admin role for testing
