import { utils } from "smartc-signum-simulator";

/**
 * Converts an array of big integers into a hex string representation
 * used to pass as `messageHex` sent to the contract (in UserTransactionObj)
 * or as binary hex message attachment on real transactions.
 * ```ts
 *{
 *    blockheight: 2,
 *    amount: 5000_0000n,
 *    messageHex: createHexMessage([1n, 100n]),
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
