import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { network } from "hardhat";

const connection = await network.create();
try {
  const { viem, networkHelpers } = connection;
  const client = await viem.getPublicClient();
  if (await client.getChainId() !== 31337) throw new Error("Demo only runs on local chain 31337.");
  const wallets = await viem.getWalletClients();
  const voters = wallets.slice(1, 6);
  const records: unknown[] = [];
  const gas: { operation: string; gasUsed: string }[] = [];
  async function receipt(operation: string, hash: `0x${string}`) {
    const result = await client.waitForTransactionReceipt({ hash });
    assert.equal(result.status, "success"); gas.push({ operation, gasUsed: String(result.gasUsed) });
  }
  for (const [label, choices, expected] of [
    ["winner", [0, 0, 0, 1, 2], [1, [0n], 3n]],
    ["tie", [0, 1, 0, 1, 2], [2, [0n, 1n], 2n]],
    ["no-votes", [], [0, [], 0n]],
  ] as const) {
    const voting = await viem.deployContract("Voting", [`CSE465 ${label}`]);
    const deploymentBlock = await client.getBlock();
    const creation = await client.getTransactionReceipt({ hash: deploymentBlock.transactions[0] });
    assert.equal(creation.contractAddress?.toLowerCase(), voting.address.toLowerCase());
    gas.push({ operation: `deploy:${label}`, gasUsed: String(creation.gasUsed) });
    for (const name of ["An", "Bình", "Chi"]) await receipt(`candidate:${label}`, await voting.write.addCandidate([name]));
    await receipt(`register-5:${label}`, await voting.write.registerVoters([voters.map((w) => w.account.address)]));
    await receipt(`start:${label}`, await voting.write.startVoting([60n]));
    await viem.assertions.revertWithCustomError(voting.write.vote([0n], { account: wallets[6].account }), voting, "NotRegistered");
    for (const [i, choice] of choices.entries()) await receipt(`vote-${i}:${label}`, await voting.write.vote([BigInt(choice)], { account: voters[i].account }));
    if (choices.length) await viem.assertions.revertWithCustomError(voting.write.vote([0n], { account: voters[0].account }), voting, "AlreadyVoted");
    await networkHelpers.time.increaseTo(await voting.read.endTime());
    await viem.assertions.revertWithCustomError(voting.write.vote([0n], { account: voters[0].account }), voting, "InvalidPhase");
    const outcome = await voting.read.getOutcome();
    assert.deepEqual(outcome, expected);
    records.push({ label, address: voting.address, outcome, results: await voting.read.getResults(), deploymentTx: creation.transactionHash });
  }
  for (const size of [1, 10, 50]) {
    const voting = await viem.deployContract("Voting", [`Gas batch ${size}`]);
    const batch = Array.from({ length: size }, (_, i) => `0x${(i + 100).toString(16).padStart(40, "0")}` as const);
    await receipt(`register-${size}`, await voting.write.registerVoters([batch]));
  }
  const report = { source: "Hardhat isolated local simulation, not Sepolia", measuredAt: new Date().toISOString(), compiler: "0.8.34", profile: "production (run via npm run demo:local)", records, gas };
  await mkdir(new URL("../docs/evidence/", import.meta.url), { recursive: true });
  await writeFile(new URL("../docs/evidence/local-demo.json", import.meta.url), JSON.stringify(report, (_, value) => typeof value === "bigint" ? value.toString() : value, 2) + "\n");
  console.log("Verified winner, tie, no-votes, rejected votes and gas measurements. See docs/evidence/local-demo.json");
} finally { await connection.close(); }
