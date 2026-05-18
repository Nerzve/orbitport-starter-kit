/**
 * Cosmic Password Generator
 *
 * Generates a password from beacon entropy. No credentials needed.
 *
 * Usage: node examples/03-generate-password.mjs
 *        node examples/03-generate-password.mjs 24
 */

const BEACON_URL = "https://k2k4r8lvomw737sajfnpav0dpeernugnryng50uheyk1k39lursmn09f.ipns.dweb.link/";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?";

function hexToBytes(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }
  return bytes;
}

async function main() {
  const length = parseInt(process.argv[2]) || 20;

  console.log("\nFetching entropy from beacon...\n");

  const res = await fetch(BEACON_URL, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) { console.error("Beacon failed."); process.exit(1); }

  const json = await res.json();
  const beacon = json.data || json;
  const entropy = (beacon.ctrng || [])[0];

  if (!entropy) { console.error("No entropy in beacon response."); process.exit(1); }

  const bytes = hexToBytes(entropy);
  let password = "";
  for (let i = 0; i < length; i++) {
    const idx = (bytes[i % bytes.length] ^ (i * 37)) % CHARS.length;
    password += CHARS[idx];
  }

  console.log(`  Entropy: ${entropy.slice(0, 32)}...`);
  console.log(`  Password (${length} chars): ${password}`);
  console.log(`  Block: #${beacon.sequence || "unknown"}`);
  console.log("");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
