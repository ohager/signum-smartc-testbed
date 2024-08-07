import { expect, test, describe, beforeEach } from "vitest";
import { asHexMessage, SimulatorTestbed } from "../index";
import { Context } from "./context";
import { TestScenario } from "./test.scenarios";

describe("Simulator Testbed", () => {
  let testbed: SimulatorTestbed;
  beforeEach(() => {
    testbed = new SimulatorTestbed(TestScenario)
      .loadContract(Context.ContractPath, { percentage: 20, text: "TEXT" })
      .loadContract(Context.ContractPath, { percentage: 10, text: "TEXT2" })
      .runScenario();
  });

  test("should getTransactions as expected", () => {
    const outgoingTxs = testbed.getTransactions();
    expect(outgoingTxs).toHaveLength(6);
    expect(outgoingTxs[0].sender).toBe(Context.SenderAccount1);
  });

  test("should getTransaction as expected", () => {
    const tx = testbed.getTransaction(0);
    expect(tx.txid).toBe(100n);
  });

  test("should getTransactionById as expected", () => {
    expect(testbed.getTransactionById(102n)?.txid).toBe(102n);
  });

  test("should return null when getTransactionById not exists", () => {
    expect(testbed.getTransactionById(110n)).toBeNull();
  });

  test("should getContract as expected - Contract 1", () => {
    const contract = testbed.getContract(Context.Contract1);
    expect(contract.contract).toBe(Context.Contract1);
  });

  test("should getContract as expected - Contract 2", () => {
    const contract = testbed.getContract(Context.Contract2);
    expect(contract.contract).toBe(Context.Contract2);
  });

  test("should throw for getContract if contract is not valid", () => {
    expect(() => {
      testbed.getContract(100n);
    }).toThrow("Invalid contract address");
  });

  test("should getAccount as expected", () => {
    const account = testbed.getAccount(Context.SenderAccount1);
    expect(account?.id).toBe(Context.SenderAccount1);
  });

  test("should return null for getAccount if not found", () => {
    const account = testbed.getAccount(666n);
    expect(account).toBeNull();
  });

  test("should getContractMap as expected", () => {
    const map = testbed.getContractMap(Context.Contract1);
    expect(map).toHaveLength(1);
    expect(map[0].value).toBe(666n);
  });

  test("should getContractMap as expected - Contract2", () => {
    const map = testbed.getContractMap(Context.Contract2);
    expect(map).toHaveLength(1);
    expect(map[0].value).toBe(667n);
  });

  test("should getContractMapValue as expected", () => {
    testbed.selectContract(Context.Contract1);
    const value = testbed.getContractMapValue(1n, 1n);
    expect(value).toBe(666n);
  });

  test("should getContractMapValue as expected - Contract2", () => {
    const value = testbed.getContractMapValue(1n, 1n, Context.Contract2);
    expect(value).toBe(667n);
  });

  test("should getTransactionsSentByContract as expected", () => {
    testbed.selectContract(Context.Contract1);
    const transactions = testbed.getTransactionsSentByContract(2);
    expect(transactions).toHaveLength(1);
    expect(transactions[0].recipient).toBe(Context.SenderAccount2);
  });

  test("should getContractMemoryValue as expected", () => {
    const percentage = testbed.getContractMemoryValue(
      "percentage",
      Context.Contract1,
    );
    expect(percentage).toBe(20n);
  });

  test("should getContractMemoryValue as expected - Contract2", () => {
    const percentage = testbed.getContractMemoryValue(
      "percentage",
      Context.Contract2,
    );
    expect(percentage).toBe(10n);
  });

  test("should return null for getContractMemoryValue if not found", () => {
    expect(
      testbed.getContractMemoryValue("invalid", Context.Contract1),
    ).toBeNull();
  });

  test("should getContractMapValues as expected", () => {
    const map = testbed.getContractMapValues(1n, Context.Contract1);
    expect(map).toHaveLength(1);
    expect(map).toEqual([
      {
        k1: 1n,
        k2: 1n,
        value: 666n,
      },
    ]);
  });

  test("should getContractMapValues as empty array if not exists", () => {
    const map = testbed.getContractMapValues(10n);
    expect(map).toEqual([]);
  });

  test("should getContractMemory as expected", () => {
    const memory = testbed.getContractMemory(Context.Contract1);
    expect(memory.length).toBeGreaterThan(5);
    expect(memory[4].varName).toBe("percentage");
    expect(memory[4].value).toBe(20n);
  });

  test("should throw on getContractMemory when invalid address", () => {
    expect(() => {
      testbed.getContractMemory(666n);
    }).toThrow("Invalid contract address");
  });

  test("should run sendTransactionAndGetResponse as expected", () => {
    const result = testbed.sendTransactionAndGetResponse([
      {
        amount: 10_2000_0000n,
        sender: Context.SenderAccount1,
        recipient: Context.Contract1,
        messageHex: asHexMessage([
          Context.Methods.ForwardPercentage,
          Context.SenderAccount2,
        ]),
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].recipient).toBe(Context.SenderAccount2);
  });
});
