import {
  EMPTY_TVM_CELL,
  getMetricsChange,
  getTokenWalletAddress,
  getVaultMetrics,
  logMetricsChange,
  setupWever,
  stringToBytesArray,
} from "./utils";
import { toNano, WalletTypes } from "locklift";

const logger = require("mocha-logger");
const { expect } = require("chai");


describe("Test wEVER wrap / unwrap", async function () {
  this.timeout(200000);
  // @ts-ignore
  let context: ReturnType<typeof setupWever> extends Promise<infer F> ? F : never = {};

  it("Setup contracts", async function () {
    await locklift.deployments.fixture();

    context = await setupWever();
  });

  describe("Test granting", async function () {
    it("Grant EVERs to the vault", async function () {
      const { aliceTokenWallet, alice, vaultTokenWallet, vault } = context;
      const initialMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);

      const trace = await locklift.tracing.trace(
          vault.methods
              .grant({
                amount: toNano(4),
              })
              .send({
                from: alice.address,
                amount: toNano(6),
              })
      );

      // await trace.traceTree?.beautyPrint();

      const finalMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);

      const metricsChange = getMetricsChange(initialMetrics, finalMetrics);

      logMetricsChange(metricsChange);

      expect(metricsChange.userWEVERBalance).to.be.equal(0, "Wrong user wEVER balance change");

      expect(metricsChange.userEVERBalance)
        .to.be.below(-4, "Too low user EVER balance change")
        .to.be.above(-4.5, "Too high user EVER balance change");

      expect(metricsChange.vaultWEVERBalance).to.be.equal(0, "Wrong vault wEVER balance change");

      expect(metricsChange.vaultEVERBalance).to.be.equal(4, "Vault EVER balance change differs from granted");

      expect(metricsChange.vaultTotalWrapped).to.be.equal(4, "Wrong vault total wrapped");

      expect(metricsChange.WEVERTotalSupply).to.be.equal(0, "wEVER total supply should not change");
    });
  });

  describe("Test wrapping", async function () {
    describe("Wrap TON to wEVERs by sending EVERs to vault", async function () {
      it("Send EVERs to vault", async function () {
        const { alice, aliceTokenWallet, vaultTokenWallet, vault } = context;

        const initialMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);

        await locklift.provider.sendMessage({
          amount: toNano(5),
          recipient: vault.address,
          bounce: true,
          sender: alice.address,
        });

        const finalMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);

        const metricsChange = getMetricsChange(initialMetrics, finalMetrics);

        logMetricsChange(metricsChange);
        expect(metricsChange.userWEVERBalance)
          .to.be.above(3.5, "Too low user wEVER balance change")
          .and.to.be.equal(4, "Too high user wEVER balance change");

        expect(metricsChange.userEVERBalance)
          .to.be.below(-4, "Too low user EVER balance change")
          .to.be.above(-4.5, "Too high user EVER balance change");

        expect(metricsChange.vaultWEVERBalance).to.be.equal(0, "Wrong vault wEVER balance change");

        expect(metricsChange.vaultEVERBalance).to.be.equal(
          metricsChange.userWEVERBalance,
          "Vault EVER balance change differs from user wEVER balance change",
        );

        expect(metricsChange.vaultTotalWrapped).to.be.equal(
          metricsChange.userWEVERBalance,
          "Vault total wrapped change differs from user wEVER balance change",
        );

        expect(metricsChange.WEVERTotalSupply).to.be.equal(
          metricsChange.userWEVERBalance,
          "wEVER total supply change differs from user wEVER balance change",
        );
      });
    });

    describe("Wrap TON to wEVERs by calling wrap", function () {
      it("Call wrap", async function () {
        const { aliceTokenWallet, alice, vaultTokenWallet, vault } = context;

        const initialMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);

        const trace = await locklift.tracing.trace(
            vault.methods
                .wrap({
                  tokens: toNano(1),
                  owner_address: alice.address,
                  gas_back_address: alice.address,
                  payload: EMPTY_TVM_CELL,
                })
                .send({
                  from: alice.address,
                  amount: toNano(2.5),
                }),
        );

        // await trace.traceTree?.beautyPrint();

        const finalMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);

        const metricsChange = getMetricsChange(initialMetrics, finalMetrics);

        logMetricsChange(metricsChange);

        expect(metricsChange.userWEVERBalance).to.be.equal(1, "Wrong user wEVER balance change");

        expect(metricsChange.userEVERBalance)
          .to.be.below(-1, "Too low user EVER balance change")
          .to.be.above(-1.5, "Too high user EVER balance change");

        expect(metricsChange.vaultWEVERBalance).to.be.equal(0, "Wrong vault wEVER balance change");

        expect(metricsChange.vaultEVERBalance).to.be.equal(
          metricsChange.userWEVERBalance,
          "Vault EVER balance change differs from user wEVER balance change",
        );

        expect(metricsChange.vaultTotalWrapped).to.be.equal(
          metricsChange.userWEVERBalance,
          "Vault total wrapped change differs from user wEVER balance change",
        );

        expect(metricsChange.WEVERTotalSupply).to.be.equal(
          metricsChange.userWEVERBalance,
          "wEVER total supply change differs from user wEVER balance change",
        );
      });
    });

    describe("Unwrap wEVER to TON by sending wEVERs to vault token wallet", async function () {
      it("Send wEVERs to vault token wallet", async function () {
        const { aliceTokenWallet, alice, vaultTokenWallet, vault } = context;

        const initialMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);

        const trace = await locklift.tracing.trace(
            aliceTokenWallet.methods
                .transfer({
                  amount: toNano(2.5),
                  recipient: vault.address,
                  deployWalletValue: 200000000,
                  remainingGasTo: alice.address,
                  notify: true,
                  payload: stringToBytesArray(""),
                })
                .send({
                  from: alice.address,
                  amount: toNano(4),
                })
        );

        // await trace.traceTree?.beautyPrint();

        const finalMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);

        const metricsChange = getMetricsChange(initialMetrics, finalMetrics);

        logMetricsChange(metricsChange);

        expect(metricsChange.userWEVERBalance).to.be.equal(-2.5, "Wrong user wEVER balance change");

        expect(metricsChange.userEVERBalance)
          .to.be.above(2, "Too low user EVER balance change")
          .to.be.below(2.5, "Too high user EVER balance change");

        expect(metricsChange.vaultWEVERBalance).to.be.equal(0, "Wrong vault wEVER balance change");

        expect(metricsChange.vaultEVERBalance).to.be.equal(
          metricsChange.userWEVERBalance,
          "Vault EVER balance change differs from user wEVER balance change",
        );

        expect(metricsChange.vaultTotalWrapped).to.be.equal(
          metricsChange.userWEVERBalance,
          "Vault total wrapped change differs from user wEVER balance change",
        );

        expect(metricsChange.WEVERTotalSupply).to.be.equal(
          metricsChange.userWEVERBalance,
          "wEVER total supply change differs from user wEVER balance change",
        );
      });
    });
  });

  describe("Test EVERs withdraw", async function () {
    it("Withdraw with owner account", async function () {
      const { ownerTokenWallet, owner, vaultTokenWallet, vault } = context;

      const initialMetrics = await getVaultMetrics(ownerTokenWallet, owner, vaultTokenWallet, vault);

      const trace = await locklift.tracing.trace(
          vault.methods
              .withdraw({
                amount: toNano(3),
              })
              .send({
                from: owner.address,
                amount: toNano(2),
              })
      );

      // await trace.traceTree?.beautyPrint();

      const finalMetrics = await getVaultMetrics(ownerTokenWallet, owner, vaultTokenWallet, vault);

      const metricsChange = getMetricsChange(initialMetrics, finalMetrics);

      logMetricsChange(metricsChange);

      expect(metricsChange.userWEVERBalance).to.be.equal(0, "Wrong user wEVER balance change");

      expect(metricsChange.userEVERBalance)
        .to.be.below(3.5, "Too low user EVER balance change")
        .to.be.above(2.9, "Too high user EVER balance change");

      expect(metricsChange.vaultWEVERBalance).to.be.equal(0, "Wrong vault wEVER balance change");

      expect(metricsChange.vaultEVERBalance).to.be.equal(-3, "Vault EVER balance change too high");

      expect(metricsChange.vaultTotalWrapped).to.be.equal(-3, "Wrong vault total wrapped change");

      expect(metricsChange.WEVERTotalSupply).to.be.equal(0, "wEVER total supply should not change");
    });

    it("Try to withdraw with non owner", async function () {
      const { aliceTokenWallet, alice, vaultTokenWallet, vault } = context;

      logger.log(`Not-owner token wallet: ${aliceTokenWallet.address.toString()}`);

      const initialMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);

      await vault.methods
        .withdraw({
          amount: toNano(3),
        })
        .send({
          from: alice.address,
          amount: toNano(2),
        });

      const finalMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);

      const metricsChange = getMetricsChange(initialMetrics, finalMetrics);

      logMetricsChange(metricsChange);

      expect(metricsChange.userWEVERBalance).to.be.equal(0, "Wrong user wEVER balance change");

      expect(metricsChange.userEVERBalance).to.be.below(0.01, "Too low user EVER balance change");

      expect(metricsChange.vaultWEVERBalance).to.be.equal(0, "Wrong vault wEVER balance change");

      expect(metricsChange.vaultTotalWrapped).to.be.equal(0, "Vault total wrapped change should not change");

      expect(metricsChange.WEVERTotalSupply).to.be.equal(0, "wEVER total supply should not change");
    });
  });
});
