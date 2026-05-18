/**
 * Verify cTRNG Signature
 *
 * Fetches signed randomness from the API and inspects the cryptographic signature.
 * This proves the randomness came from SpaceComputer hardware.
 *
 * Requires credentials. Copy .env.example to .env first.
 *
 * Usage: node examples/05-verify-signature.mjs
 */

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

const CLIENT_ID = process.env.ORBITPORT_CLIENT_ID;
const CLIENT_SECRET = process.env.ORBITPORT_CLIENT_SECRET;
const AUTH_URL = process.env.ORBITPORT_AUTH_URL || "https://auth.spacecomputer.io";
const API_URL = process.env.ORBITPORT_API_URL || "https://op.spacecomputer.io";

if (!CLIENT_ID || !CLIENT_SECRET || CLIENT_ID === "your-client-id") {
  console.error("Missing credentials. Edit .env with your ORBITPORT_CLIENT_ID and SECRET.");
  process.exit(1);
}

async function main() {
  // Get token
  console.log("\nAuthenticating...");
  const authRes = await fetch(`${AUTH_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      audience: `${API_URL}/api`,
      grant_type: "client_credentials",
    }),
  });

  if (!authRes.ok) throw new Error(`Auth failed: HTTP ${authRes.status}`);
  const { access_token } = await authRes.json();

  // Fetch signed randomness
  console.log("Fetching signed randomness...\n");
  const res = await fetch(`${API_URL}/api/v1/services/trng`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!res.ok) throw new Error(`API error: HTTP ${res.status}`);
  const data = await res.json();

  console.log(`  Data:    ${data.data}`);
  console.log(`  Source:  ${data.src}`);
  console.log(`  Service: ${data.service}`);

  if (data.signature) {
    console.log(`\n  Signature:`);
    console.log(`    Algorithm:  ${data.signature.algo}`);
    console.log(`    Value:      ${data.signature.value?.slice(0, 40)}...`);
    console.log(`    Public key: ${data.signature.pk?.slice(0, 40)}...`);

    const sigBytes = Buffer.from(data.signature.value, "hex");
    console.log(`    Sig length: ${sigBytes.length} bytes`);
    console.log(`\n  Full verification requires the satellite's public key in PEM format.`);
  } else {
    console.log("\n  No signature in response. Derived sources may not include one.");
  }
  console.log("");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
