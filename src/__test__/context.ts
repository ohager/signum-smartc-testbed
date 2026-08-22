import { join } from "path";
import { readFileSync } from "fs";

export const Context = {
  ContractCode: readFileSync(
    join(__dirname + "/test-contract.smart.c"),
    "utf-8",
  ),
  SenderAccount1: 10n,
  SenderAccount2: 20n,
  CreatorAccount: 555n,
  Contract1: 1n,
  Contract2: 2n,
  ActivationFee: 1000_0000n,
  Methods: {
    ForwardPercentage: 1n,
    UpdatePercentage: 2n,
    SetMapValue: 3n,
    PullFunds: 4n,
  },
};
