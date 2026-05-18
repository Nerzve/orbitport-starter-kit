/**
 * Hello cTRNG - Orbitport API
 *
 * Authenticates with Orbitport and fetches randomness from orbit.
 * Requires credentials. Copy .env.example to .env and fill in your CLIENT_ID and SECRET.
 *
 * Usage: node examples/01-hello-ctrng.mjs
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
  console.error("Sign up at https://accounts.spacecomputer.io to get them.");
  process.exit(1);
}

async function main() {
  // Step 1: get token
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

  if (!authRes.ok) {
    const err = await authRes.text();
    console.error(`Auth failed (HTTP ${authRes.status}): ${err}`);
    process.exit(1);
  }

  const { access_token } = await authRes.json();
  console.log("Token obtained.\n");

  // Step 2: fetch randomness
  console.log("Requesting randomness from orbit...\n");
  const res = await fetch(`${API_URL}/api/v1/services/trng`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`API error (HTTP ${res.status}): ${err}`);
    process.exit(1);
  }

  const data = await res.json();

  console.log(`  Source: ${data.src}`);
  console.log(`  Data:   ${data.data}`);
  console.log(`  Bits:   ${data.data.length * 4}`);

  if (data.signature) {
    console.log(`  Signed: ${data.signature.algo}`);
  }
  console.log("");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
