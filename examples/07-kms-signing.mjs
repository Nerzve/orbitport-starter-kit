/**
 * KMS Signing from Orbit
 *
 * Creates a signing key that lives on a satellite and never touches your machine.
 * Signs a message, encrypts/decrypts data, all from orbit.
 *
 * Requires credentials and the SDK:
 *   npm i @spacecomputer-io/orbitport-sdk-ts
 *
 * Usage: node examples/07-kms-signing.mjs
 */

import { OrbitportSDK } from "@spacecomputer-io/orbitport-sdk-ts";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env");
try {
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...vals] = line.split("=");
    if (key && !key.startsWith("#")) {
      process.env[key.trim()] = vals.join("=").trim();
    }
  });
} catch {
  console.error("No .env file found. Copy .env.example to .env and add your credentials.");
  process.exit(1);
}

const clientId = process.env.ORBITPORT_CLIENT_ID;
const clientSecret = process.env.ORBITPORT_CLIENT_SECRET;

if (!clientId || !clientSecret || clientId === "your-client-id") {
  console.error("Missing credentials. Edit .env with your ORBITPORT_CLIENT_ID and SECRET.");
  process.exit(1);
}

const sdk = new OrbitportSDK({
  config: { clientId, clientSecret },
});

async function main() {
  // --- 1. Create an Ethereum signing key in orbit ---
  console.log("\n--- Creating Ethereum signing key in orbit ---\n");

  const key = await sdk.kms.createKey({
    alias: `starter-kit-${Date.now()}`,
    keySpec: "ECC_SECG_P256K1",
    keyUsage: "SIGN_VERIFY",
    scheme: "ETHEREUM",
  });

  const keyId = key.data.KeyMetadata.KeyId;
  const address = key.data.KeyMetadata.Address;

  console.log(`  Key ID:   ${keyId}`);
  console.log(`  Address:  ${address}`);
  console.log(`  Spec:     ${key.data.KeyMetadata.KeySpec}`);
  console.log(`  Scheme:   ETHEREUM`);
  console.log(`  Location: orbit (never leaves the satellite)\n`);

  // --- 2. Sign a message from orbit ---
  console.log("--- Signing a message from orbit ---\n");

  const message = "hello from orbit";
  const sig = await sdk.kms.sign({
    keyId,
    message,
    signingAlgorithm: "ETHEREUM_SECP256K1",
    messageType: "EIP191",
  });

  console.log(`  Message:   "${message}"`);
  console.log(`  Signature: ${sig.data.Signature.slice(0, 40)}...`);
  console.log(`  Algorithm: ETHEREUM_SECP256K1 (EIP-191 personal sign)\n`);

  // --- 3. Create an encryption key and encrypt/decrypt ---
  console.log("--- Encrypt/decrypt with a TRANSIT key ---\n");

  const encKey = await sdk.kms.createKey({
    alias: `encrypt-${Date.now()}`,
    keySpec: "AES_256_GCM96",
    keyUsage: "ENCRYPT_DECRYPT",
  });

  const encKeyId = encKey.data.KeyMetadata.KeyId;
  const plaintext = "sensitive data from earth";

  const encrypted = await sdk.kms.encrypt({
    keyId: encKeyId,
    plaintext,
  });

  console.log(`  Plaintext:  "${plaintext}"`);
  console.log(`  Ciphertext: ${encrypted.data.CiphertextBlob.slice(0, 40)}...`);

  const decrypted = await sdk.kms.decrypt({
    keyId: encKeyId,
    ciphertextBlob: encrypted.data.CiphertextBlob,
  });

  console.log(`  Decrypted:  "${decrypted.data.Plaintext}"`);
  console.log(`  Round-trip:  ${decrypted.data.Plaintext === plaintext ? "OK" : "MISMATCH"}\n`);

  // --- Summary ---
  console.log("--- Summary ---\n");
  console.log("  Your private key never left the satellite.");
  console.log("  The signature was computed in orbit and sent back.");
  console.log("  The encryption key is stored in a TEE on the satellite.");
  console.log("  Nobody can seize, copy, or extract these keys.\n");
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  if (err.code) console.error("Code:", err.code);
  process.exit(1);
});
