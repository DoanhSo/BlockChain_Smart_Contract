import { readFile } from "node:fs/promises";
import { network } from "hardhat";
import { getAddress, isAddress } from "viem";

export async function localContract() {
  const connection = await network.create();
  const client = await connection.viem.getPublicClient();
  if (await client.getChainId() !== 31337) {
    await connection.close();
    throw new Error("This helper only supports the local chain 31337.");
  }
  const addresses = JSON.parse(await readFile(new URL("../ignition/deployments/chain-31337/deployed_addresses.json", import.meta.url), "utf8"));
  const raw: unknown = addresses["VotingModule#Voting"];
  if (typeof raw !== "string" || !isAddress(raw)) throw new Error("Deploy locally first: npm run deploy:local");
  const address = getAddress(raw);
  const code = await client.getCode({ address });
  if (!code || code === "0x") throw new Error("No contract on this local node. Redeploy after resetting the node.");
  const voting = await connection.viem.getContractAt("Voting", address);
  const wallets = await connection.viem.getWalletClients();
  if (getAddress(wallets[0].account.address) !== await voting.read.admin()) throw new Error("Local account is not the contract admin.");
  return { connection, client, voting, wallets };
}
