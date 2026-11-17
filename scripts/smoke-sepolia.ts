import { readFile } from "node:fs/promises";
import { createPublicClient, getAddress, http } from "viem";
import { sepolia } from "viem/chains";
import { votingAbi } from "../frontend/src/generated/voting.ts";

// Read-only: no Hardhat network accounts and no private key required.
if (!process.env.SEPOLIA_RPC_URL) throw new Error("Configure SEPOLIA_RPC_URL locally first.");
const manifest = JSON.parse(await readFile(new URL("../deployments/sepolia.json", import.meta.url), "utf8"));
if (manifest.chainId !== sepolia.id) throw new Error("Manifest is not Ethereum Sepolia.");
const address = getAddress(manifest.address);
const client = createPublicClient({ chain: sepolia, transport: http(process.env.SEPOLIA_RPC_URL) });
if (await client.getChainId() !== sepolia.id) throw new Error("RPC points to another network.");
const code = await client.getCode({ address });
if (!code || code === "0x") throw new Error("No bytecode at the recorded address.");
const contract = { address, abi: votingAbi } as const;
const admin = await client.readContract({ ...contract, functionName: "admin" });
const title = await client.readContract({ ...contract, functionName: "electionTitle" });
if (admin.toLowerCase() !== String(manifest.admin).toLowerCase() || title !== manifest.title) throw new Error("Metadata does not match deployment.");
const phase = await client.readContract({ ...contract, functionName: "phase" });
const results = await client.readContract({ ...contract, functionName: "getResults" });
const outcome = phase === 2 ? await client.readContract({ ...contract, functionName: "getOutcome" }) : null;
console.log(JSON.stringify({ chainId: sepolia.id, address, admin, title, phase, results, outcome }, (_, value) => typeof value === "bigint" ? value.toString() : value, 2));
