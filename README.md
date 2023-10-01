# signum-smartc-testbed

A Test Environment for automated testing of Signum SmartC - Smart Contract Compiler

## Motivation

The [SmartC Simulator](https://deleterium.info/sc-simulator) is an awesome environment to develop Smart Contracts for [Signum Blockchain](https://signum.network).
It gives you a lot of power to develop and debug your Smart Contracts. But it turns out to be a bit time-consuming. This project's
goal is to speed up development by applying pure TDD and give you automation on tests. This way the developer can focus more on the code
and develop faster more complex scenarios without being victim of testing fatigue. In the end, it makes the contracts even more secure.

---

##🧪 This is still experimental\*\*

**☢️ Use at your own risk ☢️**

Look at [API Documentation](https://ohager.github.io/signum-smartc-testbed/index.html)

## How it is meant to being used

Use the testbed as a programmable testing environment. Use it together with test runner like [Jest](https://jestjs.io/) or [Vitest](https://vitest.dev/)

A use case may look like this (taken from a real application)

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

![image](https://github.com/ohager/signum-smartc-testbed/assets/3920663/9a3ba02c-5bb3-420e-885c-e805b0ce10ca)

## ROADMAP

- [ ] Github Starter Template
- [ ] Unit Tests
- [ ] Stable MultiSlot Support
- [ ] Adding Testbed for real Blockchain Node
