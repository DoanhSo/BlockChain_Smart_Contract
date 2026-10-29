import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("VotingModule", (m) => {
  const title = m.getParameter("title", "Bầu lớp trưởng CSE465");
  const voting = m.contract("Voting", [title]);
  return { voting };
});
