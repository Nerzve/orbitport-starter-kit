# Orbitport API Reference

## Authentication

All API calls need a Bearer token. Get one via OAuth2 client credentials:

```
POST https://auth.spacecomputer.io/oauth/token
Content-Type: application/json

{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "audience": "https://op.spacecomputer.io/api",
  "grant_type": "client_credentials"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

Tokens last 24 hours. Cache them.

---

## GET `/api/v1/services/trng`

Returns a random hex string with optional cryptographic signature.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "service": "trng",
  "src": "derived",
  "data": "4931ac7890ce642aae5a9c4a2d27fbce10d9da9a17e396757056f2f254a2ac8d",
  "signature": {
    "value": "3045022100...",
    "pk": "04a1b2c3...",
    "algo": "ECDSA"
  }
}
```

| Field | Type | What it is |
|-------|------|-----------|
| `service` | string | Always `"trng"` |
| `src` | string | `"cosmic/aptos_orbital"` or `"derived"` |
| `data` | string | 64-char hex string, 32 bytes / 256 bits of entropy |
| `signature.value` | string | Hex-encoded signature |
| `signature.pk` | string | Hex-encoded public key of the signer |
| `signature.algo` | string | Signature algorithm |

---

## IPFS Beacon

No authentication. Updated every ~60 seconds.

```
GET https://k2k4r8lvomw737sajfnpav0dpeernugnryng50uheyk1k39lursmn09f.ipns.dweb.link/
```

Response:
```json
{
  "previous": "/ipfs/bafkrei...",
  "data": {
    "sequence": 184128,
    "timestamp": 1779139056,
    "ctrng": [
      "c52158fa4811e7cec7c70be3934a674985828cb3bc3ba494188b87b415fb818c",
      "f1cc4772ec222a6e4dab6eb53a62739407298eeab89b9949c95ab9770c81cdfa"
    ]
  }
}
```

The `previous` field links to the prior block on IPFS, forming a verifiable chain.

Alternative gateways if `dweb.link` is slow: `w3s.link`, `ipfs.io`.

---

## Environment variables

| Variable | Value | What it's for |
|----------|-------|--------------|
| `ORBITPORT_CLIENT_ID` | From dashboard | OAuth client ID |
| `ORBITPORT_CLIENT_SECRET` | From dashboard | OAuth client secret |
| `ORBITPORT_AUTH_URL` | `https://auth.spacecomputer.io` | Token endpoint |
| `ORBITPORT_API_URL` | `https://op.spacecomputer.io` | API gateway |

---

## Error codes

| HTTP | What happened | Fix |
|------|--------------|-----|
| 401 | Token expired or invalid | Re-authenticate |
| 403 | Wrong audience in token | Check `ORBITPORT_API_URL` |
| 500 + `AuthenticationFailed` | Token from wrong Auth0 tenant | Use `auth.spacecomputer.io` |
| 502 | API infrastructure down | Retry, or use IPFS beacon |
