import assert from "node:assert/strict";
import { it } from "node:test";
import { network } from "hardhat";
import { getAddress } from "viem";
import VotingModule from "../ignition/modules/Voting.js";

it("deploys the Voting module and reads its metadata through viem", async () => {
  const connection = await network.create();
  try {
    const [deployer] = await connection.viem.getWalletClients();
    const { voting } = await connection.ignition.deploy(VotingModule, {
      parameters: { VotingModule: { title: "Bầu lớp trưởng CSE465" } },
    });

    assert.equal(await voting.read.admin(), getAddress(deployer.account.address));
    assert.equal(await voting.read.electionTitle(), "Bầu lớp trưởng CSE465");
  } finally {
    await connection.close();
  }
});
