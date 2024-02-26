import { expect, test, describe, beforeEach } from "vitest";
import { SimulatorTestbed } from "../index";
import { Context } from "./context";
import { TestScenario } from "./test.scenarios";

describe("Simulator Testbed", () => {
  let testbed: SimulatorTestbed;
  beforeEach(() => {
    testbed = new SimulatorTestbed(TestScenario)
      .loadContract(Context.ContractPath, { percentage: 20 })
      .runScenario();
  });

  test("should getTransaction as expected", () => {
    const outgoingTxs = testbed.getTransactions();
    expect(outgoingTxs).toHaveLength(2);
    expect(outgoingTxs[0].sender).toBe(Context.SenderAccount1);
  });

  test("should getContract as expected", () => {
    const contract = testbed.getContract(Context.ThisContract);
    expect(contract.contract).toBe(Context.ThisContract);
  });
});
