# signum-smartc-testbed

A Test Environment for automated testing of Signum SmartC - Smart Contract Compiler

Develop and your SmartC Contracts faster and more secure using a full TDD approach!

![image](https://github.com/ohager/signum-smartc-testbed/assets/3920663/9a3ba02c-5bb3-420e-885c-e805b0ce10ca)

## Motivation

The [SmartC Simulator](https://deleterium.info/sc-simulator) is an awesome environment to develop Smart Contracts for [Signum Blockchain](https://signum.network).
It gives you a lot of power to develop and debug your Smart Contracts. But it turns out to be a bit time-consuming. This project's
goal is to speed up development by applying pure TDD and give you automation on tests. This way the developer can focus more on the code
and develop faster more complex scenarios without being victim of testing fatigue. In the end, it makes the contracts even more secure.

---

##🧪 This is still experimental

**☢️ Use at your own risk ☢️**

## Quick Start

Use the [Public Project Template](https://github.com/ohager/signum-smartc-testbed-starter) or create your local starter project(*):

1. `npx tiged git@github.com:ohager/signum-smartc-testbed-starter.git <your-project-folder>`
2. `npm install`
3. `npm test`

If no error occurs you can start developing your own contract!

> (*) requires NodeJS18+ installed

## How to use?

Use the testbed as a programmable testing environment. Use it together with test runner like [Jest](https://jestjs.io/) or [Vitest](https://vitest.dev/) (recommended)

Install it using your favorite package manager

`npm i signum-smartc-testbed --dev` or `yarn add signum-smartc-testbed -D` (or similar)

Follow instructions how to set up the Testrunner, i.e. Jest or Vitest (recommended).

A recommended project structure is like this:

```
.
├── contract
│   ├── context.ts << constants like Account Ids, Map Keys, Token Ids etc
│   ├── method-1
│   │   ├── method-1.scenarios.ts << Transaction Set for method-1
│   │   └── method-1.test.ts << The unit tests
│   ├── method-2
│   │   ├── method-2.scenarios.ts
│   │   └── method-12.test.ts
│   └── contract.smart.c << The contract itself
├── package.json
├── README.md
├── tsconfig.json
├── vitest.config.ts
└── yarn.lock
```

Within the unit tests it's recommended to reset the testbed on each test to avoid having previous states. As a consequence
the test runner must not run the tests in parallel, but in-line.

A typical test suite may look like this (taken from a real application)

```ts
describe("Stock Contract - Change Usage Fee", () => {
  test("should change fee and take effect", () => {
    const testbed =
      SimulatorTestbed.loadContract(ContractPath).runScenario(ChangeUsageFee);

    const bc = testbed.blockchain;
    expect(testbed.getContractMemoryValue("usageFee")).toEqual(2_5000_0000n);
    expect(testbed.getContractMemoryValue("stats_stockQuantity")).toEqual(400n);
    expect(bc.transactions).toHaveLength(7);
    const feepayment = bc.transactions[5];
    expect(feepayment.amount).toEqual(2_5000_0000n);
    expect(feepayment.recipient).toEqual(Context.VeridiBlocAccount);
    const veridiBloc = bc.accounts.find(
      (a) => a.id === Context.VeridiBlocAccount,
    );
    expect(veridiBloc?.balance).toEqual(7_0000_0000n); // 5 + 2,5 - 0,5
  });
  test("try to change fee when not creator", () => {
    const testbed = SimulatorTestbed.loadContract(ContractPath).runScenario(
      ChangeUsageFeeNotAllowed,
    );
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

Look at [API Documentation](https://ohager.github.io/signum-smartc-testbed/index.html) for details.



## ROADMAP

- [x] Github Starter Template
- [x] Unit Tests
- [x] Externalize Utility Functions, e.g. method args conversion
- [x] Stable MultiSlot Support
- [ ] Adding Testbed for real Blockchain Node
