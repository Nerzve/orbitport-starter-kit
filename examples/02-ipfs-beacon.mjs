/**
 * IPFS Beacon, no credentials needed.
 *
 * SpaceComputer publishes cTRNG randomness to IPFS every ~60 seconds.
 * This just fetches the latest block and prints it.
 *
 * Usage: node examples/02-ipfs-beacon.mjs
 */

const BEACON_URL = "https://k2k4r8lvomw737sajfnpav0dpeernugnryng50uheyk1k39lursmn09f.ipns.dweb.link/";

async function main() {
  console.log("\nFetching latest beacon block...\n");

  const res = await fetch(BEACON_URL, {
    signal: AbortSignal.timeout(20000),
    headers: { "Cache-Control": "no-cache" },
  });

  if (!res.ok) {
    console.error(`Failed: HTTP ${res.status}`);
    process.exit(1);
  }

  const json = await res.json();
  const beacon = json.data || json;
  const ctrng = beacon.ctrng || [];
  const latest = ctrng[0] || "none";

  const blockTime = beacon.timestamp ? new Date(beacon.timestamp * 1000) : null;
  const age = blockTime ? Math.round((Date.now() - blockTime.getTime()) / 1000) : null;

  console.log(`  Block:     #${beacon.sequence || "unknown"}`);
  if (blockTime) {
    console.log(`  Timestamp: ${blockTime.toISOString().replace("T", " ").slice(0, 19)} UTC`);
    console.log(`  Age:       ${age}s`);
  }
  console.log(`  ctrng[0]:  ${latest}`);

  if (age !== null && age > 300) {
    console.log(`\n  Warning: beacon is ${Math.round(age / 60)} min old, might be stale.`);
  }

  console.log("");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
