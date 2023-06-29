import {EMPTY_TVM_CELL, getMetricsChange, getVaultMetrics, logMetricsChange, setupWever, ZERO_ADDRESS} from "./utils";
import {Address, toNano} from "locklift";
import {expect} from "chai";

// @ts-ignore
import logger from 'mocha-logger';


describe('Transfer tokens with additional wrap', async function() {
    this.timeout(200000);

    // @ts-ignore
    let context: ReturnType<typeof setupWever> extends Promise<infer F> ? F : never = {};

    it("Setup contracts", async function () {
        await locklift.deployments.fixture();

        context = await setupWever();
    });

    it("Alice sends EVERs to vault", async function () {
        const { aliceTokenWallet, alice, vaultTokenWallet, vault } = context;

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

    it('Transfer tokens with additional wrap', async () => {
        const {
            aliceTokenWallet, alice,
            bobTokenWallet, bob,
            vaultTokenWallet, vault
        } = context;

        const payload = await locklift.provider.packIntoCell({
            data: {
                operation: 0,
                recipient: bob.address,
                payload: EMPTY_TVM_CELL
            },
            structure: [
                { name: 'operation', type: 'uint8' },
                { name: 'recipient', type: 'address' },
                { name: 'payload', type: 'cell' },
            ] as const
        });

        const aliceInitialMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);
        const bobInitialMetrics = await getVaultMetrics(bobTokenWallet, bob, vaultTokenWallet, vault);

        const trace = await locklift.tracing.trace(
            aliceTokenWallet.methods.transfer({
                recipient: new Address(ZERO_ADDRESS),
                amount: locklift.utils.toNano('1'),
                deployWalletValue: locklift.utils.toNano('0'),
                remainingGasTo: alice.address,
                notify: false,
                payload: payload.boc
            }).send({
                from: alice.address,
                amount: toNano('2')
            })
        );

        await trace.traceTree?.beautyPrint();

        const aliceFinalMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);
        const bobFinalMetrics = await getVaultMetrics(bobTokenWallet, bob, vaultTokenWallet, vault);

        const aliceMetricsChange = getMetricsChange(aliceInitialMetrics, aliceFinalMetrics);
        const bobMetricsChange = getMetricsChange(bobInitialMetrics, bobFinalMetrics);

        logger.success('Alice metrics change');
        logMetricsChange(aliceMetricsChange);

        logger.success('Bob metrics change')
        logMetricsChange(bobMetricsChange);
    });

    it('Transfer tokens with additional unwrap', async () => {
        const {
            aliceTokenWallet, alice,
            bobTokenWallet, bob,
            vaultTokenWallet, vault
        } = context;

        const payload = await locklift.provider.packIntoCell({
            data: {
                operation: 1,
                recipient: alice.address,
                payload: EMPTY_TVM_CELL
            },
            structure: [
                { name: 'operation', type: 'uint8' },
                { name: 'recipient', type: 'address' },
                { name: 'payload', type: 'cell' },
            ] as const
        });

        const aliceInitialMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);
        const bobInitialMetrics = await getVaultMetrics(bobTokenWallet, bob, vaultTokenWallet, vault);

        const trace = await locklift.tracing.trace(
            bobTokenWallet.methods.transfer({
                recipient: new Address(ZERO_ADDRESS),
                amount: locklift.utils.toNano('1'),
                deployWalletValue: locklift.utils.toNano('0'),
                remainingGasTo: bob.address,
                notify: false,
                payload: payload.boc
            }).send({
                from: bob.address,
                amount: toNano('2')
            })
        );

        await trace.traceTree?.beautyPrint();

        const aliceFinalMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);
        const bobFinalMetrics = await getVaultMetrics(bobTokenWallet, bob, vaultTokenWallet, vault);

        const aliceMetricsChange = getMetricsChange(aliceInitialMetrics, aliceFinalMetrics);
        const bobMetricsChange = getMetricsChange(bobInitialMetrics, bobFinalMetrics);

        logger.success('Alice metrics change');
        logMetricsChange(aliceMetricsChange);

        logger.success('Bob metrics change')
        logMetricsChange(bobMetricsChange);
    });
})
