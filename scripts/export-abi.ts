import { mkdir, writeFile } from "node:fs/promises";
import { artifacts } from "hardhat";

const artifact = await artifacts.readArtifact("Voting");
const outputDirectory = new URL("../frontend/src/generated/", import.meta.url);
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  new URL("voting.ts", outputDirectory),
  `// Generated from Voting.sol. Run npm run export:abi; do not edit manually.\nexport const votingAbi = ${JSON.stringify(artifact.abi, null, 2)} as const;\n`,
);
console.log("Exported Voting ABI to frontend/src/generated/voting.ts");
