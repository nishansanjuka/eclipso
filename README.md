# Eclipso

Eclipso is a lightweight, extensible Point-of-Sale (POS) system built for retail and hospitality environments. It provides core POS features (orders, payments, inventory, customers, and reporting) and a small, well-documented API to integrate with third-party services.

## API

The Eclipso API exposes RESTful endpoints for integrating with the POS core — including orders, payments, inventory, customers, and reports. All endpoints are versioned under `/api/v1` and use JSON for requests and responses. Authenticate requests with a Bearer token (JWT) provided in the `Authorization` header. Responses follow a simple envelope pattern: `success` (boolean), `data` (object or array), and `error` (object with `code` and `message`) when applicable. Use standard HTTP status codes for errors, and include pagination and filtering via query parameters where supported.

Base URL (placeholder): `https://api.eclipso.example.com`

For full endpoint details, examples, and SDKs see the API reference (to be added).
