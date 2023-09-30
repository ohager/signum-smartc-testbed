import {
  Blockchain,
  loadSmartContract,
  Simulator,
  reset,
  Contracts,
  MemoryObj,
  UserTransactionObj,
} from "smartc-signum-simulator";
import { readFileSync } from "fs";

interface TestbedContext {
  simulator: typeof Simulator;
  blockchain: typeof Blockchain;
  contracts: typeof Contracts;
}

export class SimulatorTestbed {
  private constructor(private context: TestbedContext) {}

  static toSimulatorTransactions(scenario: object): string {
    return JSON.stringify(
      scenario,
      (key, value) => (typeof value === "bigint" ? value.toString() : value), // return everything else unchanged
    );
  }

  static loadContract(codePath: string) {
    reset();
    const code = readFileSync(codePath, "utf8");
    return new SimulatorTestbed({
      simulator: loadSmartContract(code),
      blockchain: Blockchain,
      contracts: Contracts,
    });
  }

  get simulator() {
    return this.context.simulator;
  }

  get blockchain() {
    return this.context.blockchain;
  }

  get contracts() {
    return this.context.contracts;
  }

  getContractPerSlot(slot: number = 0) {
    return this.context.contracts[slot];
  }

  getMapsPerSlot(slot: number = 0) {
    return this.blockchain.maps[slot].map;
  }

  getAccount(accountId: bigint) {
    return this.blockchain.accounts.find((a) => a.id === accountId);
  }

  runScenario(scenario: UserTransactionObj[]) {
    const scenarioStr = SimulatorTestbed.toSimulatorTransactions(scenario);
    const lastScenarioBlock = scenario.reduce(
      (p, c) => Math.max(c.blockheight, p),
      0,
    );
    for (let i = 0; i < lastScenarioBlock + 1; i++) {
      console.debug(this.simulator.forgeBlock(scenarioStr));
      this.simulator.runSlotContract();
    }

    return this;
  }

  getContractMemory(slot = -1): MemoryObj[] {
    const s = slot === -1 ? this.simulator.currSlotContract! : slot;
    return this.getContractPerSlot(s).Memory;
  }

  getContractMemoryValue(name: string, slot = -1) {
    const mem = this.getContractMemory(slot);
    for (let v of mem) {
      if (v.varName === name) {
        return v.value;
      }
    }
    return null;
  }
}
