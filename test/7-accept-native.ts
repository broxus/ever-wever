import { Account } from "everscale-standalone-client";
import { EMPTY_TVM_CELL, getMetricsChange, getVaultMetrics, logMetricsChange, setupWever } from "./utils";
import { Contract, WalletTypes, toNano } from "locklift";
import logger from 'mocha-logger';
import { VaultTokenWallet_V1Abi } from "../build/factorySource";


describe('Test token wallet accept native', () => {
    // @ts-ignore
    let context: ReturnType<typeof setupWever> extends Promise<infer F> ? F : never = {};
    let user: Account;
    let userTokenWallet: Contract<VaultTokenWallet_V1Abi>

    it('Setup contracts', async () => {
        await locklift.deployments.fixture();

        context = await setupWever();

        const signer = await locklift.keystore.getSigner("0");

        const account = await locklift.factory.accounts.addNewAccount({
            type: WalletTypes.EverWallet,
            publicKey: signer?.publicKey as string,
            value: toNano('10')
        });

        user = account.account;

        const {
            value0: userTokenWalletAddress
        } = await context.vault.methods.walletOf({
            walletOwner: user.address,
            answerId: 0
        }).call();

        userTokenWallet = await locklift.factory.getDeployedContract('VaultTokenWallet_V1', userTokenWalletAddress);
    });

    it('Accept native, token wallet deployment disabled', async () => {
        const { aliceTokenWallet, alice, vaultTokenWallet, vault } = context;

        // const aliceInitialMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);
        // const bobInitialMetrics = await getVaultMetrics(userTokenWallet, user, vaultTokenWallet, vault);

        const trace = await locklift.tracing.trace(
            aliceTokenWallet.methods.acceptNative({
                amount: toNano('1'),
                deployWalletValue: toNano('0'),
                remainingGasTo: user.address,
                payload: EMPTY_TVM_CELL
            }).send({
                from: alice.address,
                amount: toNano('2')
            })
        );

        await trace.traceTree?.beautyPrint();

        // const aliceFinalMetrics = await getVaultMetrics(aliceTokenWallet, alice, vaultTokenWallet, vault);
        // const bobFinalMetrics = await getVaultMetrics(bobTokenWallet, user, vaultTokenWallet, vault);

        // const aliceMetricsChange = getMetricsChange(aliceInitialMetrics, aliceFinalMetrics);
        // const bobMetricsChange = getMetricsChange(bobInitialMetrics, bobFinalMetrics);

        // logger.success('Bob metrics change');
        // logMetricsChange(bobMetricsChange);

        // logger.success('Alice metrics change');
        // logMetricsChange(aliceMetricsChange);
    });

    it('Accept native, token wallet deploy enabled', async () => {
        const { aliceTokenWallet, alice, vaultTokenWallet, vault } = context;

        const trace = await locklift.tracing.trace(
            aliceTokenWallet.methods.acceptNative({
                amount: toNano('1'),
                deployWalletValue: toNano('0.2'),
                remainingGasTo: user.address,
                payload: EMPTY_TVM_CELL
            }).send({
                from: alice.address,
                amount: toNano('2')
            })
        );

        await trace.traceTree?.beautyPrint();
    });
});
