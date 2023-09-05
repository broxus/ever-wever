import { Account } from "everscale-standalone-client";
import { EMPTY_TVM_CELL, getMetricsChange, getVaultMetrics, logMetricsChange, setupVaultRoot } from "../utils";
import { Contract, WalletTypes, toNano } from "locklift";
import logger from 'mocha-logger';
import { VaultTokenWallet_V1Abi } from "../../build/factorySource";
import { expect } from "chai";


describe('Test token wallet accept native', () => {
    // @ts-ignore
    let context: ReturnType<typeof setupVaultRoot> extends Promise<infer F> ? F : never = {};

    it('Setup contracts', async () => {
        await locklift.deployments.fixture();

        context = await setupVaultRoot();
    });

    it('Accept native, token wallet deployment disabled', async () => {
        const aliceInitialMetrics = await getVaultMetrics(
            context.aliceTokenWallet,
            context.alice,
            context.vaultTokenWallet,
            context.vault
        );

        const trace = await locklift.tracing.trace(
            context.aliceTokenWallet.methods.acceptNative({
                amount: toNano('1'),
                deployWalletValue: toNano('0'),
                remainingGasTo: context.alice.address,
                payload: EMPTY_TVM_CELL
            }).send({
                from: context.alice.address,
                amount: toNano('2')
            })
        );

        // await trace.traceTree?.beautyPrint();

        const aliceFinalMetrics = await getVaultMetrics(
            context.aliceTokenWallet,
            context.alice,
            context.vaultTokenWallet,
            context.vault
        );

        const aliceMetricsChange = getMetricsChange(aliceInitialMetrics, aliceFinalMetrics);

        logger.success('Alice metrics change');
        logMetricsChange(aliceMetricsChange);

        expect(aliceMetricsChange.userEVERBalance)
            .to.be.below(-1)
            .to.be.above(-1.3, 'Wrong user EVER balance change');
        expect(aliceMetricsChange.userWEVERBalance)
            .to.be.equal(1, 'Wrong user WEVER balance change');
        expect(aliceMetricsChange.vaultEVERBalance)
            .to.be.equal(1, 'Wrong vault EVER balance change');
        expect(aliceMetricsChange.vaultWEVERBalance)
            .to.be.equal(0, 'Wrong vault WEVER balance change');
        expect(aliceMetricsChange.rootWEVERBalance)
            .to.be.equal(1, 'Wrong root WEVER balance change');
        expect(aliceMetricsChange.WEVERTotalSupply)
            .to.be.equal(1, 'WEVER total supply wrong');
    });

    it('Accept native on vault token wallet', async () => {
        const aliceInitialMetrics = await getVaultMetrics(
            context.aliceTokenWallet,
            context.alice,
            context.vaultTokenWallet,
            context.vault
        );

        const trace = await locklift.tracing.trace(
            context.vaultTokenWallet.methods.acceptNative({
                amount: toNano('1'),
                deployWalletValue: toNano('0'),
                remainingGasTo: context.alice.address,
                payload: EMPTY_TVM_CELL
            }).send({
                from: context.alice.address,
                amount: toNano('2')
            })
        );

        await trace.traceTree?.beautyPrint();

        // await trace.traceTree?.beautyPrint();
        const aliceFinalMetrics = await getVaultMetrics(
            context.aliceTokenWallet,
            context.alice,
            context.vaultTokenWallet,
            context.vault
        );

        const aliceMetricsChange = getMetricsChange(aliceInitialMetrics, aliceFinalMetrics);

        logger.success('Alice metrics change');
        logMetricsChange(aliceMetricsChange);

        expect(aliceMetricsChange.userEVERBalance)
            .to.be.below(-0.1)
            .to.be.above(-0.2, 'Wrong user EVER balance change');
        expect(aliceMetricsChange.userWEVERBalance)
            .to.be.equal(0, 'Wrong user WEVER balance change');
        expect(aliceMetricsChange.vaultEVERBalance)
            .to.be.equal(0, 'Wrong vault EVER balance change');
        expect(aliceMetricsChange.vaultWEVERBalance)
            .to.be.equal(0, 'Wrong vault WEVER balance change');
        expect(aliceMetricsChange.rootWEVERBalance)
            .to.be.equal(0, 'Wrong root WEVER balance change');
        expect(aliceMetricsChange.WEVERTotalSupply)
            .to.be.equal(0, 'WEVER total supply wrong');
    });
});
