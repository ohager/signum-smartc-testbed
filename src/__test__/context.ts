import { join } from "path";

export const Context = {
  ContractPath: join(__dirname + "/test-contract.smart.c"),
  SenderAccount1: 10n,
  SenderAccount2: 20n,
  CreatorAccount: 555n,
  Contract1: 999n,
  Contract2: 1000n,
  ActivationFee: 1000_0000n,
  Methods: {
    ForwardPercentage: 1n,
    UpdatePercentage: 2n,
    SetMapValue: 3n,
    PullFunds: 4n,
  },
};
