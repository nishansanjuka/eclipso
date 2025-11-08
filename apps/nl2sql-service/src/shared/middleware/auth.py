"""
Clerk authentication middleware for FastAPI.
Uses the official Clerk Python SDK for token verification.
"""

from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions
import os
from typing import Optional
import httpx

security = HTTPBearer()


class ClerkAuth:
    def __init__(self):
        # CLERK_SECRET_KEY is used for backend token verification (required)
        self.secret_key = os.getenv("CLERK_SECRET_KEY")
        # CLERK_PUBLISHABLE_KEY is used for frontend and some metadata operations (optional for backend-only)
        self.publishable_key = os.getenv("CLERK_PUBLISHABLE_KEY")

        if not self.secret_key:
            raise ValueError(
                "CLERK_SECRET_KEY environment variable is not set. "
                "Please add it to your .env file."
            )

        # Initialize Clerk client with secret key for API operations
        # The secret key (sk_...) is used for secure backend operations
        self.clerk = Clerk(bearer_auth=self.secret_key)

    async def verify_token(self, request: Request) -> dict:
        """
        Verify the Clerk session token using the official SDK.

        The authentication flow:
        1. Client sends JWT token in Authorization header (obtained from Clerk frontend)
        2. sdk.authenticate_request() verifies the token using CLERK_SECRET_KEY
        3. It fetches JWKS from Clerk automatically and validates the signature
        4. Returns user information from the verified token payload

        Args:
            request: FastAPI Request object with Authorization header

        Returns:
            Decoded token payload containing user information

        Raises:
            HTTPException: If token is invalid or expired
        """
        try:
            # Convert FastAPI request to httpx.Request for Clerk SDK
            httpx_request = httpx.Request(
                method=request.method,
                url=str(request.url),
                headers=request.headers.raw,
            )

            # Configure authentication options with secret key
            # The secret key is used to verify the JWT signature via Clerk's JWKS
            options = AuthenticateRequestOptions(secret_key=self.secret_key)

            # Verify the session token using Clerk SDK
            request_state = self.clerk.authenticate_request(httpx_request, options)

            if not request_state.is_signed_in:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired token",
                )

            # The payload contains the JWT claims
            payload = request_state.payload or {}

            # Return the authenticated user information
            # Standard Clerk JWT claims: sub (user_id), sid (session_id), org_id, org_role, org_slug, org_permissions
            return {
                "user_id": payload.get("sub"),  # 'sub' claim contains user ID
                "session_id": payload.get("sid"),  # 'sid' claim contains session ID
                "org_id": payload.get("org_id"),
                "org_role": payload.get("org_role"),
                "org_slug": payload.get("org_slug"),
                "org_permissions": payload.get("org_permissions", []),
                "payload": payload,  # Include full payload for additional claims
            }

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Authentication failed: {str(e)}",
            )

    async def get_user(self, user_id: str):
        """
        Get full user information from Clerk.

        Args:
            user_id: The Clerk user ID

        Returns:
            User object from Clerk
        """
        try:
            user = self.clerk.users.get(user_id=user_id)
            return user
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User not found: {str(e)}",
            )


# Global instance
clerk_auth = ClerkAuth()


async def get_current_user(
    request: Request,
) -> dict:
    """
    FastAPI dependency to get the current authenticated user from Clerk token.

    Usage:
        @app.get("/protected")
        async def protected_route(user: dict = Depends(get_current_user)):
            return {"user_id": user["user_id"]}

    Returns:
        User information from verified token including:
        - user_id: Clerk user ID
        - session_id: Clerk session ID
        - org_id: Organization ID (if applicable)
        - org_role: User's role in organization
        - org_slug: Organization slug
        - org_permissions: List of organization permissions
    """
    user = await clerk_auth.verify_token(request)

    # Ensure user has a valid ID
    if not user.get("user_id"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user data in token",
        )

    return user


async def get_current_user_full(user_data: dict = Depends(get_current_user)):
    """
    Get full user information including email, name, etc.

    Usage:
        @app.get("/profile")
        async def get_profile(user = Depends(get_current_user_full)):
            return {"email": user.email_addresses[0].email_address}
    """
    user = await clerk_auth.get_user(user_data["user_id"])
    return user


async def require_org_permission(permission: str):
    """
    Dependency factory to check if user has specific organization permission.

    Usage:
        @app.post("/admin")
        async def admin_route(
            user: dict = Depends(get_current_user),
            _: None = Depends(require_org_permission("org:admin"))
        ):
            return {"message": "Admin access granted"}
    """

    async def check_permission(user: dict = Depends(get_current_user)):
        org_permissions = user.get("org_permissions", [])

        if permission not in org_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission: {permission}",
            )

        return None

    return check_permission
