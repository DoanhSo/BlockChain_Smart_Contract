import { localContract } from "./local-contract.js";
import type { Address } from "viem";

const { connection, client, voting, wallets } = await localContract();
try {
  if (await voting.read.phase() !== 0) throw new Error("Election has started; seed only works during Setup.");
  const names = ["An", "Bình", "Chi"];
  const count = Number(await voting.read.candidateCount());
  if (count > names.length) throw new Error("Existing election does not match the demo fixture.");
  for (let i = 0; i < count; ++i) {
    if ((await voting.read.getCandidate([BigInt(i)]))[0] !== names[i]) throw new Error("Candidate mismatch; refusing to modify this election.");
  }
  async function mined(hash: `0x${string}`) {
    if ((await client.waitForTransactionReceipt({ hash })).status !== "success") throw new Error("Seed transaction reverted.");
  }
  for (let i = count; i < names.length; ++i) await mined(await voting.write.addCandidate([names[i]]));
  const voters = wallets.slice(1, 6).map((wallet) => wallet.account.address);
  const pending: Address[] = [];
  for (const voter of voters) if (!await voting.read.isRegistered([voter])) pending.push(voter);
  if (pending.length) await mined(await voting.write.registerVoters([pending]));
  console.log(JSON.stringify({ chainId: 31337, address: voting.address, candidates: names, voters, phase: "Setup (not started)" }, null, 2));
} finally { await connection.close(); }
