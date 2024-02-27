import {
  MemoryObj,
  TransactionObj,
  MapObj,
  AccountObj,
  BlockchainTransactionObj,
  SimNode,
  CONTRACT,
} from "smartc-signum-simulator";
import { readFileSync } from "fs";

type Contract = CONTRACT;

/**
 * Simulator Testbed Class
 *
 * Use this class to run scenarios against the simulator.
 *
 * @example
 * ```ts
 * const Scenario1: TransactionObj[] = [
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
 * const Testbed = new SimulatorTestbed()
 * Testbed.loadContract(ContractPath)
 *        .runScenario(Scenario1);
 *
 *  const bc = Testbed.Node.Blockchain;
 *  const tx = bc.transactions;
 *  const map = testbed.getContractMap().filter(({k1, k2, value}) => ...)
 * ```
 *
 * __INITIALIZE CONTRACT__
 *
 * To initialize variables in the contract you can use the `initializer` parameter when loading the contract.
 *
 * To apply initialization a code injection is needed and requires the developer to use defines pre-pended with TESTBED_
 * source code, i.e.
 *
 * ```c
 * // initializable variables
 * // a good practice to have them declared as first variables in your contract
 * long var1, var2, var3;
 *
 * // Define values if running on testbed
 * #ifdef TESTBED
 *  const var1 = TESTBED_var1;
 *  const var2 = TESTBED_var2;
 *  const var3 = TESTBED_var3;
 * #endif
 *
 * // This way your variable can be tested with different values easily in testbed
 * ```
 *
 *
 * You may load the contract into the testbed as follows:
 * ```ts
 * const ContractPath = join(__dirname + './contract.smart.c')
 *
 * const testbed = SimulatorTestbed
 *     .loadContract(ContractPath, {
 *           var1: "Text",
 *           var2: 1,
 *           var3: 100n
 *           } // initial values
 *     ).runScenario(Scenario1);
 * ```
 *
 * This testbed loads a SmartC Contract and a scenario (set of transactions) and forges all necessary blocks.
 * It's possible to inspect all the results, i.e. transactions, kkv-maps, accounts, in-memory variables, and test them against
 * expected result sets. This class is meant to be used with Test Runners like [Vitest](https://vitest.dev/) or [Jest](https://jestjs.io/).
 */
export class SimulatorTestbed {
  private node: SimNode;

  /**
   * Constructs a simulator testbed instance with or without given scenario
   * @param scenario The initial scenario to be used.
   */
  constructor(scenario?: TransactionObj[]) {
    this.node = new SimNode();
    if (scenario) {
      const status = this.node.setScenario(
        SimulatorTestbed.toSimulatorTransactions(scenario),
      );
      if (status.errorCode) {
        throw new Error(
          "Appending transactions returned error: " + status.errorDescription,
        );
      }
    }
  }

  private static toSimulatorTransactions(scenario: TransactionObj[]): string {
    return JSON.stringify(
      scenario,
      (key, value) => (typeof value === "bigint" ? value.toString() : value), // return everything else unchanged
    );
  }

  /**
   * Loads a contract from the specified code path and eventually initializes the contract with the provided initializers
   *
   * @param {string} codePath - The path to the SmartC code file.
   * @param initializers - The initializer object for the contract - Initialization is prepended.
   * @return {SimulatorTestbed} The simulator testbed with the loaded contract.
   */
  public loadContract(
    codePath: string,
    initializers?: Record<string, number | string | bigint>,
  ) {
    let code = readFileSync(codePath, "utf8");
    if (initializers) {
      code = this.injectInitializerCode(code, initializers);
    }
    this.node.loadSmartContract(code, 555n);
    return this;
  }

  private injectInitializerCode(
    code: string,
    initializers: Record<string, number | string | bigint>,
  ) {
    let init = "";
    for (const key in initializers) {
      const value = initializers[key];
      if (typeof value === "string") {
        if (value.length > 8) {
          throw new Error("String cannot be longer than 8 chars");
        }
        init += `#define TESTBED_${key} "${initializers[key]}"\n`;
      } else {
        init += `#define TESTBED_${key} ${String(initializers[key])}\n`;
      }
    }

    return `
// smartc-testbed: automatic injection
#ifndef TESTBED
#define TESTBED 1
${init}
#endif
${code}`;
  }

  /**
   * Updates the current contract to the contract at the specified address.
   *
   * @param {bigint} address - The contract address to select. Throws error if contract is not found.
   */
  selectContract(address: bigint) {
    if (!this.node.Simulator.setCurrentSlotContract(address)) {
      throw new Error("Invalid contract address.");
    }
    return this;
  }

  /**
   * Retrieves the maps per contract.
   *
   * @param {bigint} address - The contract address (default: the last deployed).
   * @return {any} The maps per contract.
   */
  getContractMap(address?: bigint): MapObj[] {
    if (!address) {
      address = this.node.Simulator.CurrentContract?.contract;
    }
    if (!address) {
      throw new Error("Contract not specified");
    }
    const BlockchainMap = this.node.Blockchain.maps.find(
      (map) => map.id === address,
    );
    return BlockchainMap?.map ?? [];
  }

  /**
   * Retrieves a value from a map per slot.
   *
   * @param key1 1st Key
   * @param key2 2nd Key
   * @param {bigint} address - The contract address (default: the last deployed).
   * @return {bigint} The value or `0` if not exists.
   */
  getContractMapValue(key1: bigint, key2: bigint, address?: bigint): bigint {
    const contractMap = this.getContractMap(address);
    const foundValue = contractMap.find(
      ({ k1, k2 }) => k1 === key1 && k2 === key2,
    );
    return foundValue ? foundValue.value : 0n;
  }

  /**
   * Retrieves a list of (key-value)-tuples from a map per slot.
   *
   * @param key1 1st Key
   * @param {bigint} address - The contract address (default: the last deployed).
   * @return {bigint} The value or `0` if not exists.
   */
  getContractMapValues(key1: bigint, address?: bigint): MapObj[] {
    let result: MapObj[] = [];
    for (let mapObjs of this.getContractMap(address)) {
      if (mapObjs.k1 === key1) {
        result.push(mapObjs);
      }
    }
    return result;
  }

  /**
   * Retrieves the account with the specified account ID.
   *
   * @param {bigint} accountId - The ID of the account to retrieve.
   * @return {AccountObj | undefined} The account with the specified ID, or undefined if no account is found.
   */
  getAccount(accountId: bigint): AccountObj | null {
    return (
      this.node.Blockchain.accounts.find((a) => a.id === accountId) || null
    );
  }

  /**
   * Return an array of BlockchainTransactionObj representing the transactions in the blockchain.
   *
   * @return {BlockchainTransactionObj[]} - An array of BlockchainTransactionObj objects.
   */
  getTransactions(): BlockchainTransactionObj[] {
    return this.node.Blockchain.transactions;
  }

  /**
   * Leaky abstraction that provides access to the underlying blockchain object
   */
  get blockchain() {
    return this.node.Blockchain
  }

  /**
   * Returns a single transaction by Index
   * @param index  Index of transaction (not Id!), must not be negative nor greater than the transaction list
   */
  getTransaction(index: number): BlockchainTransactionObj {
    return this.node.Blockchain.transactions[index];
  }

  /**
   * Returns a single transaction by Id
   * @param id Transaction Id
   */
  getTransactionById(id: bigint)   {
    return this.getTransactions().find( ({txid}) => txid === id ) ?? null;
  }


  /**
   * Runs a scenario by simulating a series of user transactions.
   *
   * @param {TransactionObj[]} scenario - The array of user transactions representing the scenario.
   * @return {this} - Returns the current instance of the class.
   */
  runScenario(scenario: TransactionObj[] = []) {
    const scenarioStr = SimulatorTestbed.toSimulatorTransactions(scenario);
    const status = this.node.appendScenario(scenarioStr);
    if (status.errorCode) {
      throw new Error(
        "Appending transactions returned error: " + status.errorDescription,
      );
    }
    const lastScenarioBlock = this.node.scenarioTransactions.reduce(
      (p, c) => Math.max(c.blockheight ?? 0, p),
      0,
    );
    this.node.forgeUntilBlock(lastScenarioBlock + 2);
    console.debug(`Blocks forged until height ${this.node.forgeBlock()}.`);
    return this;
  }

  /**
   * Retrieves a given contract by address.
   *
   * @param {bigint} address - The contract address (default: the last deployed).
   * @return {Contract} The contract.
   * @throws Error if invalid contract
   */
  getContract(address?: bigint): Contract {
    const contract = !address
      ? this.node.Simulator.getCurrentSlotContract()
      : this.node.Blockchain.Contracts.find((sc) => sc.contract === address);
    if (!contract) {
      throw new Error("Invalid contract address");
    }
    return contract;
  }

  /**
   * Retrieves the contract memory for a given slot.
   *
   * @param {bigint} address - The contract address (default: the last deployed).
   * @return {MemoryObj[]} An array of MemoryObj representing the contract memory.
   */
  getContractMemory(address?: bigint): MemoryObj[] {
    return this.getContract(address).Memory;
  }

  /**
   * Retrieves the value of a contract memory variable by name, e.g. `myvalue` or inside a function `func_myvalue`
   *
   * @param {string} name - The name of the variable to retrieve.
   * @param {bigint} address - The contract address (default: the last deployed).
   * @return {bigint} - The value of the variable if found, otherwise null.
   */
  getContractMemoryValue(name: string, address?: bigint) {
    const found = this.getContract(address).Memory.find(
      ({ varName }) => varName === name,
    );
    return found?.value ?? null;
  }

  /**
   * Retrieves all the transactions sent by the contract at a given height.
   * Nice to get contract responses.
   *
   * @param {number} blockheight - The blockheight of transactions to fetch.
   * @param {bigint} address - The contract address (default: the last deployed).
   * @return {MemoryObj[]} An array of MemoryObj representing the contract memory.
   */
  getTransactionsSentByContract(
    blockheight: number,
    address?: bigint,
  ): BlockchainTransactionObj[] {
    const contract = this.getContract(address);
    return this.node.Blockchain.transactions.filter(
      (tx) => tx.blockheight === blockheight && tx.sender === contract.contract,
    );
  }

  /**
   * Sends the argument transactions at the next blockheight and returns all
   * transactions from the selected contract in the subsequent height.
   * Input transactions are modified to match blockheight and contract address.
   * This method forges two blocks in order to get the response.
   *
   * @param {TransactionObj[]} transactions - Transactions to send.
   * @param {bigint} address - The target contract address (default: the last deployed).
   * @return {any} An array of transactions, or empty array if no one was found.
   */
  sendTransactionAndGetResponse(
    transactions: TransactionObj[],
    address?: bigint,
  ): BlockchainTransactionObj[] {
    const contract = this.getContract(address);
    transactions.forEach((tx) => {
      tx.blockheight = this.node.Blockchain.getCurrentBlock();
      tx.recipient = contract.contract;
    });
    const status = this.node.appendScenario(
      SimulatorTestbed.toSimulatorTransactions(transactions),
    );
    if (status.errorCode) {
      throw new Error(
        "Appending transactions returned error: " + status.errorDescription,
      );
    }
    const height = this.node.forgeBlocks(2);
    return this.getTransactionsSentByContract(height - 1);
  }
}
