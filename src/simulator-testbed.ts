import {
  Blockchain,
  loadSmartContract,
  Simulator,
  reset,
  Contracts,
  MemoryObj,
  UserTransactionObj, MapObj, AccountObj, BlockchainTransactionObj,
} from "smartc-signum-simulator";
import { readFileSync } from "fs";

interface TestbedContext {
  simulator: typeof Simulator;
  blockchain: typeof Blockchain;
  contracts: typeof Contracts;
}

export type SimulatorType = typeof Simulator;
export type BlockchainType = typeof Blockchain;
export type ContractsType = typeof Contracts;

/**
 * Simulator Testbed Class
 *
 * Use this class to run scenarios against the simulator.
 *
 * @example
 * ```ts
 * const Scenario1: UserTransactionObj[] = [
 *   {
 *     blockheight: 1,
 *     amount: 6_0000_0000n,
 *     sender: 1n,
 *     recipient: 2n,
 *   },
 *   {
 *     blockheight: 3,
 *     amount: 5000_0000n,
 *     sender: 1n,
 *     recipient: 2n,
 *   },
 *   // ...
 * ]
 *
 * const ContractPath = join(__dirname + './contract.smart.c')
 *
 * const testbed = SimulatorTestbed
 *     .loadContract(ContractPath)
 *     .runScenario(Scenario1);
 *
 *  const bc = testbed.blockchain;
 *  const tx = bc.transactions;
 *  const maps = testbed.getMapsPerSlot().filter(({k1, k2, value}) => ...)
 * ```
 * This
 */
export class SimulatorTestbed {
  private constructor(private context: TestbedContext) {}

  /**
   * Converts an array of `UserTransactionObj` objects into a JSON string that can be used in side the [Simulator UI](https://deleterium.info/sc-simulator/)
   *
   * @param {UserTransactionObj[]} scenario - The array of `UserTransactionObj` objects to be converted.
   * @return {string} - The JSON string representation of the `scenario` array.
   */
  static toSimulatorTransactions(scenario: UserTransactionObj[]): string {
    return JSON.stringify(
      scenario,
      (key, value) => (typeof value === "bigint" ? value.toString() : value), // return everything else unchanged
    );
  }
  /**
   * Loads a contract from the specified code path.
   *
   * @param {string} codePath - The path to the SmartC code file.
   * @return {SimulatorTestbed} The simulator testbed with the loaded contract.
   */
  static loadContract(codePath: string) {
    reset();
    const code = readFileSync(codePath, "utf8");
    return new SimulatorTestbed({
      simulator: loadSmartContract(code),
      blockchain: Blockchain,
      contracts: Contracts,
    });
  }
  /**
   * Get the simulator.
   *
   * @return {any} The simulator instance.
   */
  get simulator(): typeof Simulator {
    return this.context.simulator;
  }

  /**
   * Get the simulated blockchain instance.
   *
   * @return {BlockchainType} the blockchain
   */
  get blockchain(): BlockchainType {
    return this.context.blockchain;
  }

  /**
   * Get all contracts.
   *
   * @return {ContractsType} the contracts
   */
  get contracts() : ContractsType {
    return this.context.contracts;
  }

  /**
   * Retrieves the contract at the specified slot.
   *
   * @param {number} slot - The slot number of the contract (default: -1, i.e. current contract).
   * @return {any} The contract at the specified slot, or current if slot = -1.
   */
  getContract(slot = -1) {
    const s = slot === -1 ? this.simulator.currSlotContract! : slot;
    return this.context.contracts[s];
  }

  /**
   * Updates the current contract to the contract at the specified slot.
   *
   * @param {number} slot - The slot number of the contract to select. Will be at maximum the number of contracts. (no overflow possible)
   */
  selectCurrentContract(slot: number) {
    this.simulator.currSlotContract = Math.min(slot, this.contracts.length - 1);
    this.getContract();
  }

  /**
   * Retrieves the maps per slot.
   *
   * @param {number} slot - The slot number (default: 0).
   * @return {any} The maps per slot.
   */
  getMapsPerSlot(slot: number = 0) : MapObj[] {
    return this.blockchain.maps[slot].map;
  }

  /**
   * Retrieves the account with the specified account ID.
   *
   * @param {bigint} accountId - The ID of the account to retrieve.
   * @return {AccountObj | undefined} The account with the specified ID, or undefined if no account is found.
   */
  getAccount(accountId: bigint) : AccountObj | undefined {
    return this.blockchain.accounts.find((a) => a.id === accountId);
  }

  /**
   * Return an array of BlockchainTransactionObj representing the transactions in the blockchain.
   *
   * @return {BlockchainTransactionObj[]} - An array of BlockchainTransactionObj objects.
   */
  getTransactions() : BlockchainTransactionObj[] {
      return this.blockchain.transactions
  }

  /**
   * Runs a scenario by simulating a series of user transactions.
   *
   * @param {UserTransactionObj[]} scenario - The array of user transactions representing the scenario.
   * @return {this} - Returns the current instance of the class.
   */
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

  /**
   * Retrieves the contract memory for a given slot.
   *
   * @param {number} slot - The slot number to retrieve the memory from. If not specified, the current slot's contract memory will be returned.
   * @return {MemoryObj[]} An array of MemoryObj representing the contract memory.
   */
  getContractMemory(slot = -1): MemoryObj[] {
    const s = slot === -1 ? this.simulator.currSlotContract! : slot;
    return this.getContract(s).Memory;
  }

  /**
   * Retrieves the value of a contract memory variable by name, e.g. `myvalue` or inside a function `func_myvalue`
   *
   * @param {string} name - The name of the variable to retrieve.
   * @param {number} [slot=-1] - The slot number of the contract memory. Defaults to -1, i.e. current selected contract
   * @return {bigint} - The value of the variable if found, otherwise null.
   */
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
