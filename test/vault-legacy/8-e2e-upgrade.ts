import { Address, Contract, fromNano, getRandomNonce, toNano, zeroAddress } from "locklift";
import {
    EMPTY_TVM_CELL, 
    expect, 
    setupVaultLegacy,
    getMetricsChange,
    getVaultMetrics,
    logMetricsChange 
} from "../utils";
import { 
    TestMinterBurnerAbi,
    TokenRootUpgradeableAbi, 
    TokenWalletUpgradeableAbi, 
    VaultTokenRoot_V1Abi, 
    VaultTokenWallet_V1Abi
} from "../../build/factorySource";


describe('E2E upgrade test', async function() {
    this.timeout(200000);

    // @ts-ignore
    let context: ReturnType<typeof setupVaultLegacy> extends Promise<infer F> ? F : never = {};
    let root: Contract<VaultTokenRoot_V1Abi>;

    // let rootTunnel: Contract<TokenRootUpgradeableAbi> | Contract<VaultTokenRoot_V1Abi>;

    const INITIAL_USER_BALANCE = 10;

    it('Setup contracts', async () => {
        await locklift.deployments.fixture();

        context = await setupVaultLegacy();

        await locklift.tracing.trace(
            context.vault.methods.drain({
                receiver: context.owner.address,
            }).send({
                from: context.owner.address,
                amount: toNano(1)
            })
        );
    });

    it('Alice mints tokens (legacy scheme)', async () => {
        const trace = await locklift.tracing.trace(
            context.vault.methods.wrap({
                tokens: toNano(INITIAL_USER_BALANCE),
                owner_address: context.alice.address,
                gas_back_address: context.alice.address,
                payload: EMPTY_TVM_CELL
            }).send({
                from: context.alice.address,
                amount: toNano(15)
            })
        );

        // await trace.traceTree?.beautyPrint();

        expect(await context.aliceTokenWallet.methods.balance({ answerId: 0 }).call().then(r => r.value0))
            .to.be.equal(toNano(INITIAL_USER_BALANCE), 'Alice\'s balance is not correct');
    });

    it('Bob mints tokens (legacy scheme)', async () => {
        await locklift.tracing.trace(
            context.vault.methods.wrap({
                tokens: toNano(INITIAL_USER_BALANCE),
                owner_address: context.bob.address,
                gas_back_address: context.bob.address,
                payload: EMPTY_TVM_CELL
            }).send({
                from: context.bob.address,
                amount: toNano(15)
            })
        );

        expect(await context.bobTokenWallet.methods.balance({ answerId: 0 }).call().then(r => r.value0))
            .to.be.equal(toNano(INITIAL_USER_BALANCE), 'Bob\'s balance is not correct');
    });

    it('Check root total supply', async () => {
        expect(await context.root.methods.totalSupply({ answerId: 0 }).call().then(r => r.value0))
            .to.be.equal(toNano(2 * INITIAL_USER_BALANCE), 'Total supply is not correct');
    });

    it('Check vault balance', async () => {
        expect(await locklift.provider.getBalance(context.vault.address))
            .to.be.equal(toNano(2 * INITIAL_USER_BALANCE + 1), 'Vault balance is not correct');
    });

    describe('Upgrade root (not upgrading wallets)', async () => {
        let root_tunnel: Contract<TokenRootUpgradeableAbi>;

        it('Upgrade root through tunnel (whole supply is granted)', async () => {
            const VaultTokenRoot_V1 = await locklift.factory.getContractArtifacts('VaultTokenRoot_V1');
    
            root_tunnel = await locklift.factory.getDeployedContract('TokenRootUpgradeable', context.tunnel.address);

            await locklift.tracing.trace(
                root_tunnel.methods.upgrade({
                    code: VaultTokenRoot_V1.code
                }).send({
                    from: context.owner.address,
                    amount: toNano(2 * INITIAL_USER_BALANCE + 5)
                })
            );
    
            root = await locklift.factory.getDeployedContract('VaultTokenRoot_V1', context.root.address);
        });

        it('Transfer root ownership from tunnel to owner', async () => {
            await locklift.tracing.trace(
                root_tunnel.methods.transferOwnership({
                    newOwner: context.owner.address,
                    remainingGasTo: context.owner.address,
                    callbacks: []
                }).send({
                    from: context.owner.address,
                    amount: toNano(1)
                })
            );
        });
    
        it('Set legacy vault in root', async () => {
            await locklift.tracing.trace(
                root.methods.setLegacyVault({
                    legacy_vault_: context.vault.address
                }).send({
                    from: context.owner.address,
                    amount: toNano(1)
                })
            );
        });

        it('Set root as tunnel in vault', async () => {
            const {
                configuration
            } = await context.vault.methods.configuration().call();
    
            await locklift.tracing.trace(
                context.vault.methods.setConfiguration({
                    _configuration: {
                        ...configuration,
                        root_tunnel: root.address,
                    }
                }).send({
                    from: context.owner.address,
                    amount: toNano(1)
                })    
            );
        });

        it('Drain vault', async () => {
            await locklift.tracing.trace(
                context.vault.methods.drain({
                    receiver: context.owner.address,
                }).send({
                    from: context.owner.address,
                    amount: toNano(1)
                })
            );
        });
    });

    describe('Test: upgraded root, legacy wallets', async () => {
        it('Alice wraps tokens with vault', async () => {
            const aliceInitialMetrics = await getVaultMetrics(
                context.aliceTokenWallet, 
                context.alice, 
                context.vaultTokenWallet, 
                context.vault,
                root
            );

            const trace = await locklift.tracing.trace(
                context.vault.methods.wrap({
                    tokens: toNano(INITIAL_USER_BALANCE),
                    owner_address: context.alice.address,
                    gas_back_address: context.alice.address,
                    payload: EMPTY_TVM_CELL
                }).send({
                    from: context.alice.address,
                    amount: toNano(15)
                })
            );

            await trace.traceTree?.beautyPrint();

            const aliceFinalMetrics = await getVaultMetrics(
                context.aliceTokenWallet, 
                context.alice, 
                context.vaultTokenWallet, 
                context.vault,
                root
            );

            const metricsChange = getMetricsChange(aliceInitialMetrics, aliceFinalMetrics);

            logMetricsChange(metricsChange);

            expect(metricsChange.userWEVERBalance)
                .to.be.equal(10, 'Alice\'s WEVER balance is not correct');
            expect(metricsChange.userEVERBalance)
                .to.be.above(-10.1)
                .to.be.below(-10, 'Alice\'s EVER balance is not correct');
            expect(metricsChange.vaultWEVERBalance)
                .to.be.equal(0, 'Vault\'s WEVER balance is not correct');
            expect(metricsChange.vaultEVERBalance)
                .to.be.equal(10, 'Vault\'s EVER balance is not correct');
            expect(metricsChange.WEVERTotalSupply)
                .to.be.equal(10, 'WEVER total supply is not correct');
            expect(metricsChange.rootWEVERBalance)
                .to.be.equal(0, 'Root WEVER balance is not correct');
        });

        it('Alice burns tokens with vault', async () => {
            const aliceInitialMetrics = await getVaultMetrics(
                context.aliceTokenWallet, 
                context.alice, 
                context.vaultTokenWallet, 
                context.vault,
                root
            );

            const trace = await locklift.tracing.trace(
                context.aliceTokenWallet.methods.transfer({
                    amount: toNano(1),
                    payload: EMPTY_TVM_CELL,
                    remainingGasTo: context.alice.address,
                    deployWalletValue: toNano(0),
                    recipient: context.vault.address,
                    notify: true
                }).send({
                    from: context.alice.address,
                    amount: toNano(1)
                })
            );

            await trace.traceTree?.beautyPrint();

            const aliceFinalMetrics = await getVaultMetrics(
                context.aliceTokenWallet, 
                context.alice, 
                context.vaultTokenWallet, 
                context.vault,
                root
            );

            const metricsChange = getMetricsChange(aliceInitialMetrics, aliceFinalMetrics);

            logMetricsChange(metricsChange);

            expect(metricsChange.userWEVERBalance)
                .to.be.equal(-1, "Alice's WEVER balance is not correct");
            expect(metricsChange.userEVERBalance)
                .to.be.above(0.8)
                .to.be.below(1, "Alice's EVER balance is not correct");
            expect(metricsChange.vaultWEVERBalance)
                .to.be.equal(0, 'Vault\'s WEVER balance is not correct');
            expect(metricsChange.vaultEVERBalance)
                .to.be.equal(-1, 'Vault\'s EVER balance is not correct');
            expect(metricsChange.WEVERTotalSupply)
                .to.be.equal(-1, 'WEVER total supply is not correct');
            expect(metricsChange.rootWEVERBalance)
                .to.be.equal(0, 'Root WEVER balance is not correct');
        });

        it('Bob wraps tokens with root', async () => {
            const bobInitialMetrics = await getVaultMetrics(
                context.bobTokenWallet,
                context.bob,
                context.vaultTokenWallet,
                context.vault,
                root
            );

            const trace = await locklift.tracing.trace(
                root.methods.wrap({
                    tokens: toNano(3),
                    recipient: context.bob.address,
                    deployWalletValue: toNano(0.2),
                    remainingGasTo: context.bob.address,
                    notify: true,
                    payload: EMPTY_TVM_CELL
                }).send({
                    from: context.bob.address,
                    amount: toNano(5)
                })
            );

            await trace.traceTree?.beautyPrint();

            const bobFinalMetrics = await getVaultMetrics(
                context.bobTokenWallet,
                context.bob,
                context.vaultTokenWallet,
                context.vault,
                root
            );

            const metricsChange = getMetricsChange(bobInitialMetrics, bobFinalMetrics);

            logMetricsChange(metricsChange);

            expect(metricsChange.userWEVERBalance)
                .to.be.equal(3, 'Bob\'s WEVER balance is not correct');
            expect(metricsChange.userEVERBalance)
                .to.be.above(-3.1)
                .to.be.below(-3, 'Bob\'s EVER balance is not correct');
            expect(metricsChange.vaultWEVERBalance)
                .to.be.equal(0, 'Vault\'s WEVER balance is not correct');
            expect(metricsChange.vaultEVERBalance)
                .to.be.equal(0, 'Vault\'s EVER balance is not correct');
            expect(metricsChange.WEVERTotalSupply)
                .to.be.equal(3, 'WEVER total supply is not correct');
            expect(metricsChange.rootWEVERBalance)
                .to.be.equal(3, 'Root WEVER balance is not correct');
        });

        it('Bob burns tokens with root', async () => {
            const bobInitialMetrics = await getVaultMetrics(
                context.bobTokenWallet,
                context.bob,
                context.vaultTokenWallet,
                context.vault,
                root
            );

            const trace = await locklift.tracing.trace(
                context.bobTokenWallet.methods.transfer({
                    amount: toNano(6),
                    payload: EMPTY_TVM_CELL,
                    remainingGasTo: context.bob.address,
                    deployWalletValue: toNano(0),
                    recipient: root.address,
                    notify: true
                }).send({
                    from: context.bob.address,
                    amount: toNano(1)
                })
            );

            await trace.traceTree?.beautyPrint();

            const bobFinalMetrics = await getVaultMetrics(
                context.bobTokenWallet,
                context.bob,
                context.vaultTokenWallet,
                context.vault,
                root
            );

            const metricsChange = getMetricsChange(bobInitialMetrics, bobFinalMetrics);

            logMetricsChange(metricsChange);

            expect(metricsChange.userWEVERBalance)
                .to.be.equal(-6, "Bob's WEVER balance is not correct");
            expect(metricsChange.userEVERBalance)
                .to.be.above(5.7)
                .to.be.below(6, "Bob's EVER balance is not correct");
            expect(metricsChange.vaultWEVERBalance)
                .to.be.equal(0, 'Vault\'s WEVER balance is not correct');
            expect(metricsChange.vaultEVERBalance)
                .to.be.equal(0, 'Vault\'s EVER balance is not correct');

            expect(metricsChange.WEVERTotalSupply)
                .to.be.equal(-6, 'WEVER total supply is not correct');
            expect(metricsChange.rootWEVERBalance)
                .to.be.equal(-6, 'Root WEVER balance is not correct');
        });
    });

    describe('Test callbacks', async () => {
        let minter_burner: Contract<TestMinterBurnerAbi>;
        let minter_burner_wallet: Contract<VaultTokenWallet_V1Abi>;

        it('Setup test minted burner', async () => {
            const keyPair = (await locklift.keystore.getSigner("0"))!;

            const {
                contract
            } = await locklift.tracing.trace(
                locklift.factory.deployContract({
                    contract: 'TestMinterBurner',
                    constructorParams: {
                        root_: root.address,
                        vault_: context.vault.address,
                    },
                    initParams: {
                        _randomNonce: getRandomNonce(),
                    },
                    publicKey: keyPair.publicKey,
                    value: toNano(15),
                })
            );

            minter_burner = contract;

            minter_burner_wallet = await locklift.factory.getDeployedContract(
                'VaultTokenWallet_V1', 
                minter_burner.address
            );
        });

        it('Mint with contract', async () => {
            let payload = await minter_burner.methods.buildPayload({
                addr: context.alice.address
            }).call().then(v => v.value0);
    
            const trace = await locklift.tracing.trace(
                context.vault.methods.wrap({
                    tokens: toNano(10), 
                    owner_address: context.alice.address, 
                    gas_back_address: context.alice.address, 
                    payload: payload
                }).send({
                    from: context.alice.address,
                    amount: toNano(40)
                })
            );
    
            expect(trace.traceTree).to.call('acceptMint').withNamedArgs({
                amount: toNano(10), 
                remainingGasTo: context.alice.address,
                notify: true, 
                payload: payload 
            });
        
            await trace.traceTree?.beautyPrint();
        });

        it('Burn with contract', async () => {
            const payload = await minter_burner.methods.buildPayload({
                addr: context.alice.address
            }).call().then(v => v.value0);
                
            const trace = await locklift.tracing.trace(
                context.aliceTokenWallet.methods.transfer({
                    amount: toNano(5), 
                    recipient: minter_burner.address, 
                    deployWalletValue: 0, 
                    remainingGasTo: context.alice.address, 
                    notify: true,
                    payload: payload
                }).send({
                    from: context.alice.address,
                    amount: toNano(10)
                })
            );
    
            await trace.traceTree?.beautyPrint();
    
            expect(trace.traceTree).to.emit("BurnCallback").withNamedArgs({payload: payload});
            expect(trace.traceTree).to.call("acceptBurn").withNamedArgs({
                amount: toNano(5),
                walletOwner: context.vault.address, 
                remainingGasTo: context.alice.address, 
                payload: payload
            });
        });
    });
});