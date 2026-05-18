# What is cTRNG?

## The short version

SpaceComputer has satellites in low earth orbit with hardware random number generators on board. These generate randomness from physical noise: cosmic radiation, quantum effects, thermal fluctuations. Not math. Physics.

The output is called cTRNG (Cosmic True Random Number Generation). You can access it two ways: a free IPFS beacon that updates every minute, or an authenticated API for production use.

## Why this matters

`Math.random()` and most language-level RNGs are pseudo-random. Deterministic formulas that look random but aren't. If you know the seed, you know every output. For most apps that's fine. For security, gambling, or anything where someone has incentive to predict the output, it's not.

Hardware RNG solves this. Putting that hardware in orbit adds a layer. The entropy source is physically out of reach. Nobody can tamper with a satellite in LEO.

## How it works

```
Satellite (LEO)
  └── Hardware RNG → raw entropy
        └── SpaceTEE (trusted execution) → processed + signed
              └── Orbitport Gateway
                    ├── API (authenticated, on-demand)
                    └── IPFS Beacon (public, every ~60s)
```

## Two ways to get randomness

### IPFS Beacon (no auth, free)

Updated every ~60 seconds. Returns an array of hex strings.

```javascript
const res = await fetch("https://k2k4r8lvomw737sajfnpav0dpeernugnryng50uheyk1k39lursmn09f.ipns.dweb.link/");
const json = await res.json();
const hex = json.data.ctrng[0]; // 64-char hex string
```

Good for: learning, prototypes, anything that doesn't need sub-minute freshness.

### Orbitport API (authenticated)

On-demand randomness with cryptographic signatures.

```javascript
const res = await fetch("https://op.spacecomputer.io/api/v1/services/trng", {
  headers: { Authorization: `Bearer ${token}` },
});
const data = await res.json();
// data.data = hex string, data.signature = { value, pk, algo }
```

Good for: production apps, signature verification, high-frequency use.

## What else SpaceComputer offers

- **Orbitport KMS** - signing keys stored in orbit. Ethereum-compatible. Your private key physically cannot be seized.
- **Oracle Contracts** - on-chain randomness via `OrbitportVRFAdapter`. Chainlink VRF-compatible interface, so switching is straightforward.
- **SpaceTEE** - trusted execution in space for confidential compute.

## Further reading

- [Space Fabric paper](https://arxiv.org/pdf/2603.23745) - full technical architecture
- [SpaceComputer docs](https://docs.spacecomputer.io)
- [Frontier Forum](https://frontierforum.xyz/)
