# Orbitport Starter Kit

Get cosmic randomness and orbital key management from SpaceComputer satellites into your app.

## What this is

SpaceComputer runs satellites in low earth orbit that generate true random numbers from hardware noise: cosmic radiation, quantum effects, thermal fluctuations. Not pseudo-random. Physically unpredictable.

They expose this through two channels:
- **IPFS Beacon** - publishes fresh randomness every ~60 seconds, open to anyone, no signup
- **Orbitport API** - authenticated, on-demand, returns signed responses you can verify

This repo has working examples for both.

## Quick start

The fastest way to see it work. No credentials, no setup:

```bash
node examples/02-ipfs-beacon.mjs
```

That pulls the latest beacon block and prints the random hex string. Takes about 2 seconds.

For authenticated examples (API, KMS), install dependencies and add credentials:

```bash
npm install
cp .env.example .env
# fill in your CLIENT_ID and CLIENT_SECRET
node examples/01-hello-ctrng.mjs
```

## Examples

| File | What it does | Needs credentials? |
|------|-------------|-------------------|
| `01-hello-ctrng.mjs` | Authenticates and fetches randomness from the API | Yes |
| `02-ipfs-beacon.mjs` | Fetches the latest beacon block from IPFS | No |
| `03-generate-password.mjs` | Generates a password from beacon entropy | No |
| `04-dice-roll.mjs` | Dice roll from beacon entropy, provably fair | No |
| `05-verify-signature.mjs` | Fetches signed randomness, inspects the signature | Yes |
| `07-kms-signing.mjs` | Creates a signing key in orbit, signs a message, encrypts data | Yes + SDK |

## How it connects

```
Your app
  │
  ├── (no auth) ──▶ IPFS Beacon (dweb.link)  ◀── Satellite publishes every ~60s
  │
  └── (auth) ────▶ Orbitport API (op.spacecomputer.io)
                      │
                      └── auth via auth.spacecomputer.io
```

## Environment variables

Only needed for examples 01, 05, and 07:

```env
ORBITPORT_CLIENT_ID=your-client-id
ORBITPORT_CLIENT_SECRET=your-client-secret
ORBITPORT_AUTH_URL=https://auth.spacecomputer.io
ORBITPORT_API_URL=https://op.spacecomputer.io
```

Make sure `AUTH_URL` points to `auth.*` and `API_URL` points to `op.*`. Swapping them is the most common setup mistake. The demo repos shipped with these reversed for months.

## Docs

- [What is cTRNG?](docs/what-is-ctrng.md) - plain English explainer
- [API reference](docs/api-reference.md) - endpoints, response formats, error codes
- [What can you build?](docs/what-can-you-build.md) - use cases with working code snippets
- [Troubleshooting](docs/troubleshooting.md) - real issues I hit while building this, with fixes

## SpaceComputer repos

| What | Repo |
|------|------|
| Docs | [docs.spacecomputer.io](https://docs.spacecomputer.io) |
| Space Fabric paper | [arxiv.org/pdf/2603.23745](https://arxiv.org/pdf/2603.23745) |
| Planet lottery demo | [spacecomputer-orbitport-demo](https://github.com/spacecomputer-io/spacecomputer-orbitport-demo) |
| Password generator demo | [cosmic-cipher](https://github.com/spacecomputer-io/cosmic-cipher) |
| Wallet auth demo (SIWE) | [cosmic-siwe](https://github.com/spacecomputer-io/cosmic-siwe) |
| Dice game (on-chain) | [ctrng-dapp-demo](https://github.com/spacecomputer-io/ctrng-dapp-demo) |
| KMS signing from orbit | [kms_starter](https://github.com/spacecomputer-io/kms_starter) |
| Oracle contracts (VRF) | [oracle-contracts](https://github.com/spacecomputer-io/oracle-contracts) |
| Rust crate | [crypto-ctrng](https://github.com/spacecomputer-io/crypto-ctrng) |
| Community | [Telegram](https://t.me/spacecomputerofficial) |

## Troubleshooting

See [docs/troubleshooting.md](docs/troubleshooting.md). Covers `AuthenticationFailed`, stale beacons, swapped env vars, and WSL networking issues.

## License

MIT
