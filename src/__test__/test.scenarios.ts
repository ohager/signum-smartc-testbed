import { Context } from "./context";
import { asHexMessage, TransactionObj } from "../index";

export const TestScenario: TransactionObj[] = [
  {
    blockheight: 1,
    amount: 10_2000_0000n,
    sender: Context.SenderAccount1,
    recipient: Context.ThisContract,
    messageHex: asHexMessage([
      Context.Methods.ForwardPercentage,
      Context.SenderAccount2,
    ]),
  },
  {
    blockheight: 2,
    amount: 20_2000_0000n,
    sender: Context.SenderAccount2,
    recipient: Context.ThisContract,
    messageHex: asHexMessage([
      Context.Methods.ForwardPercentage,
      Context.SenderAccount1,
    ]),
  },
  {
    blockheight: 3,
    amount: 2000_0000n,
    sender: Context.SenderAccount1,
    recipient: Context.ThisContract,
    messageHex: asHexMessage([Context.Methods.SetMapValue, 1n, 666n]),
  },
];
