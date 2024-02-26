import { TransactionObj, utils } from "smartc-signum-simulator";

/**
 * Converts an array of big integers into a hex string representation
 * used to pass as `messageHex` sent to the contract (in TransactionObj)
 * or as binary hex message attachment on real transactions.
 * ```ts
 *{
 *    blockheight: 2,
 *    amount: 5000_0000n,
 *    messageHex: asHexMessage([1n, 100n]),
 *    sender: 1000n,
 *    recipient: 2000n,
 *}
 * ```
 * @param {bigint[]} args - The array of big integers to convert.
 * @return {string} The hex string representation of the array of big integers.
 * @group Utilities
 */
export function asHexMessage(args: bigint[]): string {
  return utils.messagearray2hexstring([...args]);
}

/**
 * Converts a scenario into a Simulator UI compatible string
 * @param scenario Scenario Object
 * @return string
 * @group Utilities
 */
export function toSimulatorTransactions(scenario: TransactionObj[]): string {
  return JSON.stringify(
    scenario,
    (key, value) => (typeof value === "bigint" ? value.toString() : value), // return everything else unchanged
  );
}
