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

  describe("Test wrapping", async function () {
    describe("Wrap TON to wEVERs by sending EVERs to vault", async function () {
      it("Send EVERs to vault", async function () {
        const { alice, aliceTokenWallet, vaultTokenWallet, vault } = context;

        const initialMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);

        const trace = await locklift.tracing.trace(
            locklift.provider.sendMessage({
              amount: toNano(5),
              recipient: vault.address,
              bounce: true,
              sender: alice.address,
            })
        );

        await trace.traceTree?.beautyPrint();

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
                    recipient: alice.address,
                    deployWalletValue: toNano('0.1'),
                    remainingGasTo: alice.address,
                    notify: false,
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
                  deployWalletValue: toNano('0.2'),
                  remainingGasTo: alice.address,
                  notify: true,
                  payload: EMPTY_TVM_CELL,
                })
                .send({
                  from: alice.address,
                  amount: toNano(4),
                })
        );

        await trace.traceTree?.beautyPrint();

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

        expect(metricsChange.WEVERTotalSupply).to.be.equal(
          metricsChange.userWEVERBalance,
          "wEVER total supply change differs from user wEVER balance change",
        );
      });
    });
  });
});
