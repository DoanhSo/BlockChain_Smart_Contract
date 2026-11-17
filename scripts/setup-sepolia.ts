import { readFile } from "node:fs/promises";
import { network } from "hardhat";
import { getAddress, type Address } from "viem";

// Adds missing candidates and registers missing voters. Never starts voting:
// startVoting begins the countdown, so the admin starts it from the UI when voters are ready.
const config = JSON.parse(await readFile(new URL("../deployments/sepolia-election.json", import.meta.url), "utf8"));
const manifest = JSON.parse(await readFile(new URL("../deployments/sepolia.json", import.meta.url), "utf8"));
const connection = await network.create();
try {
  const { viem } = connection;
  const client = await viem.getPublicClient();
  if (await client.getChainId() !== 11155111) throw new Error("This script only runs on Ethereum Sepolia.");
  const voting = await viem.getContractAt("Voting", getAddress(manifest.address));
  const [wallet] = await viem.getWalletClients();
  if (getAddress(wallet.account.address) !== await voting.read.admin()) throw new Error("Configured key is not the contract admin.");
  if (await voting.read.phase() !== 0) throw new Error("Election has started; setup only works during Setup.");

  const transactions: { action: string; hash: string; gasUsed: string }[] = [];
  async function mined(action: string, hash: `0x${string}`) {
    const receipt = await client.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error(`${action} reverted: ${hash}`);
    transactions.push({ action, hash, gasUsed: String(receipt.gasUsed) });
    console.log(`${action}: ${hash}`);
  }

  const names: string[] = config.candidates.map((name: string) => name.normalize("NFC"));
  const count = Number(await voting.read.candidateCount());
  for (let i = 0; i < count; ++i) {
    if ((await voting.read.getCandidate([BigInt(i)]))[0] !== names[i]) throw new Error("On-chain candidates do not match the config; refusing to continue.");
  }
  for (let i = count; i < names.length; ++i) await mined(`addCandidate ${names[i]}`, await voting.write.addCandidate([names[i]]));

  const pending: Address[] = [];
  for (const voter of config.voters.map((voter: string) => getAddress(voter))) if (!await voting.read.isRegistered([voter])) pending.push(voter);
  if (pending.length) await mined(`registerVoters ${pending.length}`, await voting.write.registerVoters([pending]));

  console.log(JSON.stringify({ address: voting.address, candidateCount: String(await voting.read.candidateCount()),
    registeredVoterCount: String(await voting.read.registeredVoterCount()), phase: "Setup (not started)", transactions }, null, 2));
} finally { await connection.close(); }
