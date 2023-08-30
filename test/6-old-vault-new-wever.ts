import {EMPTY_TVM_CELL, getMetricsChange, getVaultMetrics, 
    logMetricsChange, setupWever, ZERO_ADDRESS, setupLegacyWever} from "./utils";
import {Address, Contract, toNano} from "locklift";
import {expect} from "chai";

// @ts-ignore
import logger from 'mocha-logger';
import { TestMinterBurnerAbi, VaultTokenWallet_V1Abi } from "../build/factorySource";


describe('Transfer tokens with additional wrap', async function() {
    this.timeout(200000);

    // @ts-ignore
    let context: ReturnType<typeof setupWever> extends Promise<infer F> ? F : never = {};
    let minterBurner: Contract<TestMinterBurnerAbi>;

    it("Setup contracts", async function () {
        await locklift.deployments.fixture();

        context = await setupLegacyWever();
        minterBurner = await locklift.deployments.getContract<TestMinterBurnerAbi>('TestMinterBurner');
    });

    it("Call mint on new Wever, with new Vault", async function () {
        const { aliceTokenWallet, alice, vaultTokenWallet, vault } = context;

        let payload = await minterBurner.methods.buildPayload({addr: alice.address}).call().then(v => v.value0);


       const {traceTree} = await locklift.tracing.trace(
        minterBurner.methods.mint({
            amount: toNano(10), 
            to: alice.address, 
            remainingGasTo: alice.address, 
            payload: payload
        }).send({from: alice.address, amount: toNano(20)}));

       traceTree?.beautyPrint();
    });

    it("Call vault directly", async function () {
        const { aliceTokenWallet, alice, vaultTokenWallet, vault } = context;

        let payload = await minterBurner.methods.buildPayload({addr: alice.address}).call().then(v => v.value0);


       const {traceTree} = await locklift.tracing.trace(
        vault.methods.wrap({
            tokens: toNano(10), 
            owner_address: alice.address, 
            gas_back_address: alice.address, 
            payload: payload
        }).send({from: alice.address, amount: toNano(40)}));

        expect(traceTree).to.call('acceptMint').withNamedArgs({
            amount: toNano(10), 
            remainingGasTo: alice.address,
            notify: true, 
            payload: payload 
        });
        expect

       traceTree?.beautyPrint();
    });

    it("Burn from minterBurner", async function () {
        const { aliceTokenWallet, alice, vaultTokenWallet, vault } = context;

        let payload = await minterBurner.methods.buildPayload({addr: alice.address}).call().then(v => v.value0);
        
        let minterBurnerTW = await locklift.deployments.getContract<VaultTokenWallet_V1Abi>('MinterBurnerTokenWallet');


       const {traceTree} = await locklift.tracing.trace(
        aliceTokenWallet.methods.transfer({
            amount: toNano(5), 
            recipient: minterBurner.address, 
            deployWalletValue: 0, 
            remainingGasTo: minterBurner.address, 
            notify: true,
            payload: payload
        }).send({from: alice.address, amount: toNano(10)}));

       traceTree?.beautyPrint();
       expect(traceTree).to.emit("BurnCallback").withNamedArgs({payload: payload});
        expect(traceTree).to.call("acceptBurn").withNamedArgs({
            amount: toNano(5), 
            walletOwner: vault.address, 
            remainingGasTo: minterBurnerTW.address, 
            payload: payload
        });
    });

})
