import {EMPTY_TVM_CELL, getMetricsChange, getVaultMetrics, logMetricsChange, setupVaultRoot, ZERO_ADDRESS} from "../utils";
import {Address, toNano} from "locklift";
import {expect} from "chai";

// @ts-ignore
import logger from 'mocha-logger';


describe('Transfer tokens with additional wrap', async function() {
    this.timeout(200000);

    // @ts-ignore
    let context: ReturnType<typeof setupVaultRoot> extends Promise<infer F> ? F : never = {};

    it("Setup contracts", async function () {
        await locklift.deployments.fixture();

        context = await setupVaultRoot();
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

        expect(metricsChange.WEVERTotalSupply).to.be.equal(
            metricsChange.userWEVERBalance,
            "wEVER total supply change differs from user wEVER balance change",
        );
    });

    it('Transfer more WEVERs than available (with additional wrap)', async () => {
        const {
            aliceTokenWallet, alice,
            bobTokenWallet, bob,
            vaultTokenWallet, vault
        } = context;

        const aliceInitialMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);
        const bobInitialMetrics = await getVaultMetrics(bobTokenWallet, bob, vaultTokenWallet, vault);

        const trace = await locklift.tracing.trace(
            aliceTokenWallet.methods.transfer({
                recipient: bob.address,
                amount: locklift.utils.toNano('6'),
                deployWalletValue: locklift.utils.toNano('0.5'),
                remainingGasTo: alice.address,
                notify: false,
                payload: EMPTY_TVM_CELL
            }).send({
                from: alice.address,
                amount: toNano('3')
            })
        );

        await trace.traceTree?.beautyPrint();

        const aliceFinalMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);
        const bobFinalMetrics = await getVaultMetrics(bobTokenWallet, bob, vaultTokenWallet, vault);

        const aliceMetricsChange = getMetricsChange(aliceInitialMetrics, aliceFinalMetrics);
        const bobMetricsChange = getMetricsChange(bobInitialMetrics, bobFinalMetrics);

        logger.pending('Alice metrics change');
        logMetricsChange(aliceMetricsChange);

        logger.pending('Bob metrics change')
        logMetricsChange(bobMetricsChange);

        expect(aliceMetricsChange.userWEVERBalance)
            .to.be.equal(-4, 'Wrong Alice WEVER balance change');
        expect(aliceMetricsChange.userEVERBalance)
            .to.be.lessThan(-2, 'Alice EVER balance change too big')
            .to.be.greaterThan(-2.2, 'Alice EVER balance change too small');

        expect(bobMetricsChange.userWEVERBalance)
            .to.be.equal(6, 'Wrong Bob WEVER balance change');
        expect(bobMetricsChange.userEVERBalance)
            .to.be.equal(0, 'Wrong Bob EVER balance change');

        expect(bobMetricsChange.vaultEVERBalance)
            .to.be.equal(2, 'Wrong Vault balance change');
        expect(bobMetricsChange.WEVERTotalSupply)
            .to.be.equal(2, 'Wrong total supply change');
    });

    it('Transfer WEVERs with 0 balance (with additional wrap)', async () => {
        const {
            aliceTokenWallet, alice,
            bobTokenWallet, bob,
            vaultTokenWallet, vault
        } = context;

        const aliceInitialMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);
        const bobInitialMetrics = await getVaultMetrics(bobTokenWallet, bob, vaultTokenWallet, vault);

        const trace = await locklift.tracing.trace(
            aliceTokenWallet.methods.transfer({
                recipient: bob.address,
                amount: locklift.utils.toNano('2'),
                deployWalletValue: locklift.utils.toNano('0'),
                remainingGasTo: alice.address,
                notify: false,
                payload: EMPTY_TVM_CELL
            }).send({
                from: alice.address,
                amount: toNano('3')
            })
        );

        // await trace.traceTree?.beautyPrint();

        const aliceFinalMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);
        const bobFinalMetrics = await getVaultMetrics(bobTokenWallet, bob, vaultTokenWallet, vault);

        const aliceMetricsChange = getMetricsChange(aliceInitialMetrics, aliceFinalMetrics);
        const bobMetricsChange = getMetricsChange(bobInitialMetrics, bobFinalMetrics);

        logger.pending('Alice metrics change');
        logMetricsChange(aliceMetricsChange);

        logger.pending('Bob metrics change')
        logMetricsChange(bobMetricsChange);

        expect(aliceMetricsChange.userWEVERBalance)
            .to.be.equal(0, 'Wrong Alice WEVER balance change');
        expect(aliceMetricsChange.userEVERBalance)
            .to.be.lessThan(-2, 'Alice EVER balance change too big')
            .to.be.greaterThan(-2.2, 'Alice EVER balance change too small');

        expect(bobMetricsChange.userWEVERBalance)
            .to.be.equal(2, 'Wrong Bob WEVER balance change');
        expect(bobMetricsChange.userEVERBalance)
            .to.be.equal(0, 'Wrong Bob EVER balance change');

        expect(bobMetricsChange.vaultEVERBalance)
            .to.be.equal(2, 'Wrong Vault balance change');
        expect(bobMetricsChange.WEVERTotalSupply)
            .to.be.equal(2, 'Wrong total supply change');

    });

    it('Burn tokens', async () => {
        const {
            aliceTokenWallet, alice,
            bobTokenWallet, bob,
            vaultTokenWallet, vault
        } = context;

        const aliceInitialMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);
        const bobInitialMetrics = await getVaultMetrics(bobTokenWallet, bob, vaultTokenWallet, vault);

        const trace = await locklift.tracing.trace(
            bobTokenWallet.methods.burn({
                callbackTo: alice.address,
                amount: locklift.utils.toNano('1'),
                remainingGasTo: bob.address,
                payload: EMPTY_TVM_CELL
            }).send({
                from: bob.address,
                amount: toNano('2')
            })
        );

        // await trace.traceTree?.beautyPrint();

        const aliceFinalMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);
        const bobFinalMetrics = await getVaultMetrics(bobTokenWallet, bob, vaultTokenWallet, vault);

        const aliceMetricsChange = getMetricsChange(aliceInitialMetrics, aliceFinalMetrics);
        const bobMetricsChange = getMetricsChange(bobInitialMetrics, bobFinalMetrics);

        logger.success('Bob metrics change')
        logMetricsChange(bobMetricsChange);

        logger.success('Alice metrics change');
        logMetricsChange(aliceMetricsChange);

        expect(bobMetricsChange.userWEVERBalance)
            .to.be.equal(-1, 'Wrong Bob WEVER balance change');
        expect(bobMetricsChange.userEVERBalance)
            .to.be.lessThan(-2, 'Bob EVER balance change too small')
            .to.be.greaterThan(-2.1, 'Bob EVER balance change too big');

        expect(aliceMetricsChange.userWEVERBalance)
            .to.be.equal(0, 'Wrong Alice WEVER balance change');
        expect(aliceMetricsChange.userEVERBalance)
            .to.be.greaterThan(2.9, 'Alice EVER balance change too small')
            .to.be.lessThan(3, 'Alice EVER balance change too big');

        expect(bobMetricsChange.vaultEVERBalance)
            .to.be.equal(-1, 'Wrong Vault balance change');
        expect(bobMetricsChange.WEVERTotalSupply)
            .to.be.equal(-1, 'Wrong total supply change');
    });
})
