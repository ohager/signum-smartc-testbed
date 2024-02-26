import { join } from "path";

export const Context = {
  ContractPath: join(__dirname + "/test-contract.smart.c"),
  SenderAccount1: 10n,
  SenderAccount2: 20n,
  CreatorAccount: 555n,
  ThisContract: 999n,
  ActivationFee: 1000_0000n,
  Methods: {
    ForwardPercentage: 1n,
    UpdatePercentage: 2n,
    SetMapValue: 3n,
    PullFunds: 4n,
  },
};
