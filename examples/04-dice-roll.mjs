/**
 * Cosmic Dice Roll
 *
 * Provably fair dice roll from beacon entropy. No credentials needed.
 *
 * Usage: node examples/04-dice-roll.mjs
 *        node examples/04-dice-roll.mjs 3      # 3 dice
 *        node examples/04-dice-roll.mjs 5 20   # 5 d20s
 */

const BEACON_URL = "https://k2k4r8lvomw737sajfnpav0dpeernugnryng50uheyk1k39lursmn09f.ipns.dweb.link/";

const DICE_FACES = { 1: "⚀", 2: "⚁", 3: "⚂", 4: "⚃", 5: "⚄", 6: "⚅" };

function hexToBytes(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }
  return bytes;
}

async function main() {
  const numDice = parseInt(process.argv[2]) || 2;
  const sides = parseInt(process.argv[3]) || 6;

  console.log(`\nRolling ${numDice}d${sides} from beacon entropy...\n`);

  const res = await fetch(BEACON_URL, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) { console.error("Beacon failed."); process.exit(1); }

  const json = await res.json();
  const beacon = json.data || json;
  const entropy = (beacon.ctrng || [])[0];

  if (!entropy) { console.error("No entropy in beacon response."); process.exit(1); }

  const bytes = hexToBytes(entropy);
  const rolls = [];
  let total = 0;

  for (let i = 0; i < numDice; i++) {
    const val = ((bytes[i * 2 % bytes.length] << 8) | bytes[(i * 2 + 1) % bytes.length]) % sides + 1;
    rolls.push(val);
    total += val;
  }

  if (sides === 6) {
    console.log(`  ${rolls.map((r) => DICE_FACES[r]).join("  ")}`);
  }
  console.log(`  Rolls: [${rolls.join(", ")}]`);
  console.log(`  Total: ${total}`);

  const expected = ((sides + 1) / 2) * numDice;
  const diff = total - expected;
  console.log(`  Expected avg: ${expected} (${diff >= 0 ? "+" : ""}${diff.toFixed(1)})`);

  console.log(`\n  Entropy: ${entropy.slice(0, 20)}...`);
  console.log(`  Block:   #${beacon.sequence || "unknown"}`);
  console.log(`  Anyone with this block can reproduce the exact same roll.\n`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
