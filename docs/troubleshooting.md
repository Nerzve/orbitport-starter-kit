# Troubleshooting

Real issues I hit while building with the Orbitport API, and how to fix them.

---

## `AuthenticationFailed` (HTTP 500)

The API rejected your token because it came from the wrong Auth0 tenant.

**Fix:** Your `.env` should have:
```env
ORBITPORT_AUTH_URL=https://auth.spacecomputer.io
```

Not `https://dev-1usujmbby8627ni8.us.auth0.com`. That's the old dev tenant and the API no longer accepts tokens from it.

---

## `access_denied` during authentication

Auth0 returned `{"error":"access_denied"}`.

Your credentials don't match the Auth0 tenant you're hitting. If you got credentials recently, use `auth.spacecomputer.io`. If you have older credentials, they might only work with the dev tenant, but the API won't accept those tokens anyway.

**Best fix:** Get fresh credentials from [accounts.spacecomputer.io](https://accounts.spacecomputer.io).

---

### `JSON-RPC HTTP error 400` (API_ERROR) when running KMS

If you run the KMS signing example (`07-kms-signing.mjs`) and get this:

```
Error: JSON-RPC HTTP error 400
Code: API_ERROR
```

**Fix:** Your API credentials don't have KMS permissions enabled yet.

---

## Swapped `API_URL` and `AUTH_URL`

Various confusing failures. Auth endpoint returns HTML, wrong audience, etc.

This is the most common issue. The official demo repos shipped with these reversed for months. Make sure:

```env
ORBITPORT_AUTH_URL=https://auth.spacecomputer.io     # OAuth server
ORBITPORT_API_URL=https://op.spacecomputer.io         # API gateway
```

`AUTH` → `auth.*`, `API` → `op.*`. That's it.

---

## `hexString.match is not a function`

Shows up in the orbitport-demo frontend. The API returned an error instead of data, so `response.data` is undefined instead of a hex string.

This isn't the real error. It's a symptom. Fix the API auth (see above), and this goes away.

---

## Stale IPFS beacon

The beacon returns data but the timestamp is hours old.

```javascript
const json = await fetch("https://k2k4r8lvomw737sajfnpav0dpeernugnryng50uheyk1k39lursmn09f.ipns.dweb.link/").then(r => r.json());
const age = Math.round((Date.now() / 1000) - json.data.timestamp);
console.log(`Age: ${age}s`); // should be < 120s
```

If it's consistently stale, the publisher might be down. Use the authenticated API instead, or report it on [Telegram](https://t.me/spacecomputerofficial).

---

## `fetch failed` / `ETIMEDOUT` in WSL

Node.js `fetch()` times out but `curl` works to the same URL from the same terminal.

This is a WSL2 + VPN issue. VPN software (Windscribe in my case) creates routing rules that break Node.js TCP connections from WSL while leaving curl unaffected.

**Options:**
1. Disconnect the VPN
2. Run from PowerShell instead of WSL
3. Use `curl` via `child_process.execSync()` as a workaround (ugly but works)

---

## 502 Bad Gateway

The Orbitport API is down or restarting. Wait and retry. Use the IPFS beacon as fallback.

---

## Quick connectivity check

```bash
# Beacon
curl -sL "https://k2k4r8lvomw737sajfnpav0dpeernugnryng50uheyk1k39lursmn09f.ipns.dweb.link/" | head -c 200

# API auth
curl -s --request POST "https://auth.spacecomputer.io/oauth/token" \
  --header "Content-Type: application/json" \
  --data '{"client_id":"YOUR_ID","client_secret":"YOUR_SECRET","audience":"https://op.spacecomputer.io/api","grant_type":"client_credentials"}' | head -c 200
```
