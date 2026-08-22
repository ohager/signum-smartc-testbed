# signum-smartc-testbed

A Test Environment for automated testing of Signum SmartC - Smart Contract Compiler

Develop your SmartC Contracts faster and more secure using a full TDD approach!

![image](https://github.com/ohager/signum-smartc-testbed/assets/3920663/9a3ba02c-5bb3-420e-885c-e805b0ce10ca)

## Motivation

The [SmartC Simulator](https://smartc-debugger.signum-network.dev/) is an awesome environment to develop [SmartC Smart Contracts](https://smartc.signum-network.dev/)
for [Signum Blockchain](https://signum.network). It gives you a lot of power to develop and debug your Smart Contracts.
But it turns out to be a bit time-consuming. This project's goal is to speed up development by applying pure TDD and give you automation on tests.
This way the developer can focus more on the code and develop faster more complex scenarios without being victim of testing fatigue.
In the end, it makes the contracts even more secure.

---

## Quick Start

Use the [Public Project Template](https://github.com/ohager/signum-smartc-testbed-starter) or create your local starter project(\*):

1. `npx tiged git@github.com:ohager/signum-smartc-testbed-starter.git <your-project-folder>`
2. `yarn` (or `npm install`)
3. `yarn test` (or `npm test`)

If no error occurs you can start developing your own contract!

> (\*) requires Node.js 20+ installed

## How to use?

Use the testbed as a programmable testing environment. Use it together with a test runner like [Vitest](https://vitest.dev/) (recommended) or [Jest](https://jestjs.io/).

Install it using your favorite package manager:

`yarn add signum-smartc-testbed -D` or `npm i signum-smartc-testbed -D`

Follow the instructions for setting up your test runner of choice.

A recommended project structure is like this:

```
.
├── contract
│   ├── context.ts          ← constants: Account Ids, Map Keys, Method codes, etc.
│   ├── method-1
│   │   ├── method-1.scenarios.ts   ← TransactionObj sets for method-1
│   │   └── method-1.test.ts        ← unit tests
│   ├── method-2
│   │   ├── method-2.scenarios.ts
│   │   └── method-2.test.ts
│   └── contract.smart.c    ← the contract itself
├── package.json
├── README.md
├── tsconfig.json
├── vitest.config.js
└── yarn.lock
```

Tests must run sequentially (not in parallel) — reset the testbed in `beforeEach` to avoid state leaking between tests.

## Basic Usage

A typical test suite looks like this:

```ts
import { SimulatorTestbed } from "signum-smartc-testbed";
import { join } from "path";
import { Context } from "./context";
import { ChangeUsageFee, ChangeUsageFeeNotAllowed } from "./scenarios";
import { readFileSync } from "fs";

const Contract = readFileSync(join(__dirname, "./contract.smart.c"), "utf-8");

describe("Stock Contract - Change Usage Fee", () => {
  let testbed: SimulatorTestbed;

  beforeEach(() => {
    testbed = new SimulatorTestbed()
      .loadContract(Contract)
      .runScenario(ChangeUsageFee);
  });

  test("should change fee and take effect", () => {
    const bc = testbed.blockchain;
    expect(testbed.getContractMemoryValue("usageFee")).toEqual(2_5000_0000n);
    expect(testbed.getContractMemoryValue("stats_stockQuantity")).toEqual(400n);
    expect(bc.transactions).toHaveLength(7);
    const feepayment = bc.transactions[5];
    expect(feepayment.amount).toEqual(2_5000_0000n);
    expect(feepayment.recipient).toEqual(Context.VeridiBlocAccount);
  });

  test("try to change fee when not creator", () => {
    testbed = new SimulatorTestbed()
      .loadContract(Contract)
      .runScenario(ChangeUsageFeeNotAllowed);
    const bc = testbed.blockchain;
    expect(testbed.getContractMemoryValue("usageFee")).toEqual(5_0000_0000n);
    const errors = bc
      .getMapsPerSlot()
      .filter(
        (x) =>
          x.k1 === Context.Maps.KeyError &&
          x.value === Context.ErrorCodes.NoPermission,
      );
    expect(errors).toHaveLength(2);
  });
});
```

## Initializing Contract Variables

To test with configurable contract parameters, declare them in your SmartC source with a `TESTBED_` prefix:

```c
// Initializable variables — set by deployer
long var1, var2, var3;

#ifdef TESTBED
  const var1 = TESTBED_var1;
  const var2 = TESTBED_var2;
  const var3 = TESTBED_var3;
#endif
```

Then pass initial values when loading the contract:

```ts
const testbed = new SimulatorTestbed()
  .loadContract(Contract, {
    initializers: {
      var1: "Text", // string (max 8 chars)
      var2: 1, // number
      var3: 100n, // bigint
    },
  })
  .runScenario(Scenario1);
```

## Multi-Contract Support

Load and test multiple contracts in the same simulation. Contracts are assigned auto-incrementing IDs, or you can specify them explicitly:

```ts
const testbed = new SimulatorTestbed(initialScenario)
  .loadContract(Contract, { initializers: { percentage: 20 } }) // id=1
  .loadContract(Contract, { initializers: { percentage: 10 } }) // id=2
  .runScenario();

// Inspect a specific contract
const contract1 = testbed.getContract(1n);
const contract2 = testbed.getContract(2n);

// Or list all deployed contracts
const all = testbed.getAllContracts();
```

You can also set the creator or contract ID explicitly:

```ts
new SimulatorTestbed().loadContract(Contract, {
  contractId: 9999n,
  creator: 4242n,
});
```

### Active contract and load order

The **last loaded contract is the active contract** — the default target for `getContract()`,
`getContractMap()`, `sendTransactionAndGetResponse()`, and other address-less methods.

In multi-contract setups, load helper or dependency contracts first and the **contract under test last**:

```ts
// ✅ Registry is last → active by default
const testbed = new SimulatorTestbed(scenario)
  .loadContract(helperContract, { creator: 4242n, contractId: 7777n })
  .loadContract(registryContract); // active

const helper = testbed.getContract(7777n);
testbed.runScenario();

// sendTransactionAndGetResponse targets the registry automatically
```

If you need a different contract to be active mid-test, use `selectContract(address)` explicitly:

```ts
testbed.selectContract(7777n);
const map = testbed.getContractMap(); // uses helper contract
testbed.selectContract(registryId); // restore
```

## Testing Contract Responses

Use `sendTransactionAndGetResponse` to send transactions and immediately capture what the contract sends back:

```ts
import { asHexMessage, SimulatorTestbed } from "signum-smartc-testbed";

const responses = testbed.sendTransactionAndGetResponse([
  {
    amount: 10_2000_0000n,
    sender: Context.UserAccount,
    recipient: Context.ContractId,
    messageHex: asHexMessage([
      Context.Methods.ForwardPercentage,
      Context.TargetAccount,
    ]),
  },
]);

expect(responses).toHaveLength(1);
expect(responses[0].recipient).toBe(Context.TargetAccount);
```

## API

| Method                                                  | Description                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------- |
| `new SimulatorTestbed(scenario?)`                       | Creates testbed, optionally with an initial set of transactions     |
| `.loadContract(code, options?)`                         | Compiles and deploys a contract; chainable                          |
| `.runScenario(transactions?)`                           | Appends and executes a transaction set, forges all required blocks  |
| `.selectContract(address)`                              | Sets the current contract for address-less queries                  |
| `.sendTransactionAndGetResponse(txs, address?)`         | Sends transactions and returns the contract's response transactions |
| `.getContract(address?)`                                | Returns a contract by address (defaults to last deployed)           |
| `.getAllContracts()`                                    | Returns all deployed contracts                                      |
| `.getContractMemory(address?)`                          | Returns the full memory array of a contract                         |
| `.getContractMemoryValue(name, address?)`               | Returns a named memory variable value, or `null`                    |
| `.getContractMap(address?)`                             | Returns the full KKV map of a contract                              |
| `.getContractMapValue(k1, k2, address?)`                | Returns a single map value by keys, or `0n`                         |
| `.getContractMapValues(k1, address?)`                   | Returns all map entries for a given first key                       |
| `.getTransactions()`                                    | Returns all blockchain transactions                                 |
| `.getTransaction(index)`                                | Returns a transaction by index                                      |
| `.getTransactionById(id)`                               | Returns a transaction by ID, or `null`                              |
| `.getTransactionsSentByContract(blockheight, address?)` | Returns transactions sent by the contract at a given block          |
| `.getAccount(accountId)`                                | Returns an account object, or `null`                                |
| `.blockchain`                                           | Direct access to the underlying blockchain object                   |

See the full [API Documentation](https://ohager.github.io/signum-smartc-testbed/index.html) for details.

## ROADMAP

- [x] Github Starter Template
- [x] Unit Tests
- [x] Externalize Utility Functions, e.g. method args conversion
- [x] Stable MultiSlot Support
- [x] Multi-Contract Support
- [ ] Adding Testbed for real Blockchain Node
