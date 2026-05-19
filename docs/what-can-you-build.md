# What Can You Build With This

Real use cases, real code. Everything below either uses the free IPFS beacon or the authenticated API.

---

## Provably Fair Lottery

Anyone can verify the draw was fair by checking the beacon block.

```javascript
// Fetch entropy from the public beacon
const res = await fetch("https://k2k4r8lvomw737sajfnpav0dpeernugnryng50uheyk1k39lursmn09f.ipns.dweb.link/");
const beacon = await res.json();
const entropy = beacon.data.ctrng[0]; // 64-char hex

// Pick a winner from a list
const participants = ["alice", "bob", "charlie", "dave"];
const index = parseInt(entropy.slice(0, 8), 16) % participants.length;
const winner = participants[index];

console.log(`Block #${beacon.data.sequence}, winner: ${winner}`);
console.log(`Verify: anyone with block #${beacon.data.sequence} gets the same result.`);
```

No credentials needed. The beacon is public. Anyone can replay the same block and confirm the same winner.

---

## NFT Trait Generation (On-chain)

Use the Orbitport VRF adapter to generate traits on-chain. The randomness is verifiable.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IOrbitportVRF} from "@spacecomputer/oracle-contracts/interfaces/IOrbitportVRF.sol";

contract CosmicNFT {
    IOrbitportVRF public vrf;
    mapping(uint256 => uint256) public requestToToken;
    mapping(uint256 => uint8[5]) public traits; // 5 traits per NFT

    function mint() external {
        uint256 requestId = vrf.requestRandomWords(1);
        requestToToken[requestId] = totalSupply++;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal {
        uint256 tokenId = requestToToken[requestId];
        uint256 seed = randomWords[0];

        // Derive 5 traits from one random word
        for (uint8 i = 0; i < 5; i++) {
            traits[tokenId][i] = uint8((seed >> (i * 8)) % 100);
        }
    }
}
```

The VRF adapter is Chainlink-compatible. If you already use Chainlink VRF, switching is minimal.

---

## ZK Ceremony Entropy

Mix cosmic randomness with local randomness for trusted setup ceremonies. SpaceComputer already ships a [World ID ceremony CLI](https://www.npmjs.com/package/@spacecomputer-io/world-id-orbitport-ceremony-cli) that does exactly this.

The pattern:

```javascript
import { createHash, randomBytes } from "crypto";
import { OrbitportSDK } from "@spacecomputer-io/orbitport-sdk-ts";

const sdk = new OrbitportSDK({ config: {} }); // IPFS mode, no creds

// Get cosmic entropy
const cosmic = await sdk.ctrng.random({ src: "ipfs" });
const cosmicBytes = Buffer.from(cosmic.data.data, "hex");

// Get local entropy
const localBytes = randomBytes(32);

// Mix them: SHA-256(local || cosmic)
const mixed = createHash("sha256")
  .update(Buffer.concat([localBytes, cosmicBytes]))
  .digest("hex");

console.log(`Final entropy: ${mixed}`);
// Even if one source is compromised, the other protects you.
```

---

## Gaming: Deterministic Loot Drops

Use a beacon block as a seed for deterministic but unpredictable loot tables. Every player with the same block gets the same drops.

```javascript
const LOOT_TABLE = [
  { name: "Iron Sword", weight: 40 },
  { name: "Gold Shield", weight: 30 },
  { name: "Diamond Helm", weight: 20 },
  { name: "Cosmic Shard", weight: 10 },
];

// Seed from beacon
const res = await fetch("https://k2k4r8lvomw737sajfnpav0dpeernugnryng50uheyk1k39lursmn09f.ipns.dweb.link/");
const beacon = await res.json();
const seed = parseInt(beacon.data.ctrng[0].slice(0, 8), 16);

// Weighted random selection
const totalWeight = LOOT_TABLE.reduce((s, i) => s + i.weight, 0);
let roll = seed % totalWeight;
for (const item of LOOT_TABLE) {
  roll -= item.weight;
  if (roll < 0) {
    console.log(`Block #${beacon.data.sequence}: dropped ${item.name}`);
    break;
  }
}
```

---

## Unseizable Signing Key (KMS)

Create an Ethereum signing key that physically cannot be seized, copied, or extracted. It lives on a satellite.

```javascript
import { OrbitportSDK } from "@spacecomputer-io/orbitport-sdk-ts";

const sdk = new OrbitportSDK({
  config: {
    clientId: process.env.ORBITPORT_CLIENT_ID,
    clientSecret: process.env.ORBITPORT_CLIENT_SECRET,
  },
});

// Create a key in orbit
const key = await sdk.kms.createKey({
  alias: "treasury-signer",
  keySpec: "ECC_SECG_P256K1",
  keyUsage: "SIGN_VERIFY",
  scheme: "ETHEREUM",
});

const keyId = key.data.KeyMetadata.KeyId;
const address = key.data.KeyMetadata.Address;
// This address is a real Ethereum address. The private key is in orbit.

// Sign a transaction from orbit
const sig = await sdk.kms.sign({
  keyId,
  message: "approve transfer 100 USDC",
  signingAlgorithm: "ETHEREUM_SECP256K1",
  messageType: "EIP191",
});

console.log(`Signer: ${address}`);
console.log(`Signature: ${sig.data.Signature}`);
// The private key never left the satellite.
```

Use cases: DAO treasury signers, automated trading bots where key theft is catastrophic, compliance-sensitive operations.

---

## Envelope Encryption (Data Keys from Orbit)

Generate a data key in orbit, encrypt locally at high speed, and store only the wrapped key. The satellite manages the root key.

```javascript
import { OrbitportSDK, fromBase64ToUint8Array } from "@spacecomputer-io/orbitport-sdk-ts";

const sdk = new OrbitportSDK({
  config: { clientId: "...", clientSecret: "..." },
});

// Create a root key
const root = await sdk.kms.createKey({
  alias: "data-root",
  keySpec: "AES_256_GCM96",
  keyUsage: "ENCRYPT_DECRYPT",
});

// Generate a data key (returned as plaintext + wrapped)
const dk = await sdk.kms.generateDataKey({
  keyId: root.data.KeyMetadata.KeyId,
  dataKeySpec: "AES_256",
});

const plaintextKey = fromBase64ToUint8Array(dk.data.Plaintext);
const wrappedKey = dk.data.CiphertextBlob;

// Use plaintextKey for local AES encryption (fast)
// Store wrappedKey alongside the ciphertext
// Delete plaintextKey from memory
// To decrypt later: send wrappedKey back to KMS to unwrap
```

This is the same pattern AWS KMS uses. The difference: the root key is in orbit, not in Amazon's data center.
