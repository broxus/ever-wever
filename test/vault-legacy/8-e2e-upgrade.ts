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
    RootUpgradeAssistantAbi,
    TestMinterBurnerAbi,
    TokenRootUpgradeableAbi, 
    TokenWalletUpgradeableAbi, 
    VaultTokenRoot_V1Abi, 
    VaultTokenWallet_V1Abi
} from "../../build/factorySource";
const logger = require("mocha-logger");


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

    it('Alice mints 10 tokens (legacy scheme)', async () => {
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

        // const vault_balance = await locklift.provider.getBalance(context.vault.address);
        // const {
        //     value0: total_supply
        // } = await context.root.methods.totalSupply({ answerId: 0 }).call();

        // expect(total_supply)
        //     .to.be.equal(toNano(INITIAL_USER_BALANCE), 'Wrong total supply');
        // expect(Number(vault_balance))
        //     .to.be.equal(Number(toNano(INITIAL_USER_BALANCE)) + Number(toNano(1)), 'Wrong vault balance');
    });

    it('Bob mints 10 tokens (legacy scheme)', async () => {
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

        // const vault_balance = await locklift.provider.getBalance(context.vault.address);
        // const {
        //     value0: total_supply
        // } = await context.root.methods.totalSupply({ answerId: 0 }).call();

        // expect(total_supply)
        //     .to.be.equal(toNano(2 * INITIAL_USER_BALANCE), 'Wrong total supply');
        // expect(Number(vault_balance))
        //     .to.be.equal(Number(toNano(2 * INITIAL_USER_BALANCE)) + Number(toNano(1)), 'Wrong vault balance');
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
        let root_upgrade_assistant: Contract<RootUpgradeAssistantAbi>;

        it('Deploy root upgrade assistant', async () => {
            const VaultTokenRoot_V1 = await locklift.factory.getContractArtifacts('VaultTokenRoot_V1');

            const {
                configuration
            } = await context.vault.methods.configuration().call();

            const keyPair = (await locklift.keystore.getSigner("0"))!;

            const {
                contract
            } = await locklift.factory.deployContract({
                contract: 'RootUpgradeAssistant',
                constructorParams: {
                    _owner: context.owner.address,
                    _tunnel: context.tunnel.address,
                    _root: context.root.address,
                    _vault: context.vault.address,
                    _rootCode: VaultTokenRoot_V1.code,
                    _vault_receive_safe_fee: configuration.receive_safe_fee,
                    _vault_settings_deploy_wallet_grams: configuration.settings_deploy_wallet_grams,
                    _vault_initial_balance: configuration.initial_balance
                },
                initParams: {
                    _randomNonce: getRandomNonce(),
                },
                publicKey: keyPair.publicKey,
                value: toNano(10)
            });
           
            root_upgrade_assistant = contract;
        });

        it('Add (root upgrade assistant, root) channel', async () => {
            await locklift.tracing.trace(
                context.tunnel.methods.__updateTunnel({
                    source: root_upgrade_assistant.address,
                    destination: context.root.address,
                }).send({
                    from: context.owner.address,
                    amount: toNano(1)
                })
            );
        });

        it('Transfer vault ownership', async () => {
            await locklift.tracing.trace(
                context.vault.methods.transferOwnership({
                    newOwner: root_upgrade_assistant.address,
                }).send({
                    from: context.owner.address,
                    amount: toNano(1)
                })
            );
        });

        it('Trigger upgrade', async () => {
            const trace = await locklift.tracing.trace(
                root_upgrade_assistant.methods
                    .trigger({
                        upgrade_value: toNano(2 * INITIAL_USER_BALANCE + 5)
                    })
                    .send({
                        from: context.owner.address,
                        amount: toNano(2 * INITIAL_USER_BALANCE + 20)
                    })
            );

            // await trace.traceTree?.beautyPrint();

            root = await locklift.factory.getDeployedContract('VaultTokenRoot_V1', context.root.address);
        });

        it('Check vault ownership', async () => {
            const vault_owner = await context.vault.methods.owner().call().then(e => e.owner);

            expect(vault_owner.toString())
                .to.be.equal(context.owner.address.toString(), 'Wrong vault owner');
        });

        it('Check vault configuration', async () => {
            const {
                configuration
            } = await context.vault.methods.configuration().call();

            expect(configuration.root.toString())
                .to.be.equal(root.address.toString(), 'Wrong root address in vault configuration');
            expect(configuration.root_tunnel.toString())
                .to.be.equal(root.address.toString(), 'Wrong root tunnel address in vault configuration');
            expect(Number(configuration.initial_balance))
                .to.be.gt(0, 'Wrong initial balance in vault configuration');
            expect(Number(configuration.settings_deploy_wallet_grams))
                .to.be.gt(0, 'Wrong settings deploy wallet grams in vault configuration');
            expect(Number(configuration.receive_safe_fee))
                .to.be.gt(0, 'Wrong receive safe fee in vault configuration');
        });

        it('Check root ownership', async () => {
            const root_owner = await context.root.methods.rootOwner({ answerId: 0 })
                .call().then(e => e.value0);

            expect(root_owner.toString())
                .to.be.equal(context.owner.address.toString(), 'Wrong root owner');
        });

        it('Set vautl legacy reserves (= total_wrapped)', async () => {
            const {
                total_wrapped
            } = await context.vault.methods.total_wrapped().call();

            const trace = await locklift.tracing.trace(
                root.methods.setLegacyVaultReserves({
                    amount: total_wrapped
                }).send({
                    from: context.owner.address,
                    amount: toNano(1)
                })
            );
        });

        it('Check root balance', async () => {
            expect(await locklift.provider.getBalance(context.root.address))
                .to.be.equal(toNano(1), 'Root balance is not correct');
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
        it('Alice burns tokens with vault', async () => {

        });

        it('Alice wraps 15 tokens with vault', async () => {
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

            // await trace.traceTree?.beautyPrint();

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

        it('Alice burns 1 tokens with vault', async () => {
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

            // await trace.traceTree?.beautyPrint();

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

        it('Mint 1 token with contract', async () => {
            let payload = await minter_burner.methods.buildPayload({
                addr: context.alice.address
            }).call().then(v => v.value0);
    
            const trace = await locklift.tracing.trace(
                context.vault.methods.wrap({
                    tokens: toNano(3), 
                    owner_address: context.alice.address, 
                    gas_back_address: context.alice.address, 
                    payload: payload
                }).send({
                    from: context.alice.address,
                    amount: toNano(40)
                })
            );
    
            expect(trace.traceTree).to.call('acceptMint').withNamedArgs({
                amount: toNano(3), 
                remainingGasTo: context.alice.address,
                notify: true, 
                payload: payload 
            });
        
            // await trace.traceTree?.beautyPrint();
        });

        it('Burn 1 token with contract', async () => {
            const payload = await minter_burner.methods.buildPayload({
                addr: context.alice.address
            }).call().then(v => v.value0);
                
            const trace = await locklift.tracing.trace(
                context.aliceTokenWallet.methods.transfer({
                    amount: toNano(2), 
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
    
            // await trace.traceTree?.beautyPrint();
    
            expect(trace.traceTree).to.emit("BurnCallback").withNamedArgs({payload: payload});
            expect(trace.traceTree).to.call("acceptBurn").withNamedArgs({
                amount: toNano(2),
                walletOwner: context.vault.address, 
                remainingGasTo: context.alice.address, 
                payload: payload
            });
        });
    });

    describe('Test upgraded root, new wallets', async () => {
        it('Upgrade vault wallet', async () => {
            const VaultTokenWallet_V1 = await locklift.factory.getContractArtifacts('VaultTokenWallet_V1');

            const trace = await locklift.tracing.trace(
                context.root.methods.setWalletCode({
                    code: VaultTokenWallet_V1.code
                }).send({
                    from: context.owner.address,
                    amount: toNano(1)
                })
            );

            // await trace.traceTree?.beautyPrint();
        });

        it('Upgrade vault wallet', async () => {
            const trace = await locklift.tracing.trace(
                root.methods.upgradeWallets({
                    wallets: [
                        context.vaultTokenWallet.address,
                        context.aliceTokenWallet.address,
                        context.bobTokenWallet.address,
                    ],
                    accept_upgrade_value: toNano(0.1),
                    remainingGasTo: context.owner.address,
                }).send({
                    from: context.owner.address,
                    amount: toNano(1)
                })
            );

            // await trace.traceTree?.beautyPrint();
        });

        it('Test vault wallet acceptNative', async () => {
            const vaultTokenWallet = await locklift.factory.getDeployedContract(
                'VaultTokenWallet_V1', 
                context.vaultTokenWallet.address
            );

            const aliceInitialMetrics = await getVaultMetrics(
                context.aliceTokenWallet,
                context.alice,
                context.vaultTokenWallet,
                context.vault,
                root
            );
    
            const trace = await locklift.tracing.trace(
                vaultTokenWallet.methods.acceptNative({
                    amount: toNano('1'),
                    deployWalletValue: toNano('0'),
                    remainingGasTo: context.alice.address,
                    payload: EMPTY_TVM_CELL
                }).send({
                    from: context.alice.address,
                    amount: toNano('2')
                })
            );
    
            const aliceFinalMetrics = await getVaultMetrics(
                context.aliceTokenWallet,
                context.alice,
                context.vaultTokenWallet,
                context.vault,
                root
            );
    
            const aliceMetricsChange = getMetricsChange(aliceInitialMetrics, aliceFinalMetrics);    

            logMetricsChange(aliceMetricsChange);
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
                    tokens: toNano(8),
                    recipient: context.bob.address,
                    deployWalletValue: toNano(0.2),
                    remainingGasTo: context.bob.address,
                    notify: true,
                    payload: EMPTY_TVM_CELL
                }).send({
                    from: context.bob.address,
                    amount: toNano(9)
                })
            );

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
                .to.be.equal(8, 'Bob\'s WEVER balance is not correct');
            expect(metricsChange.userEVERBalance)
                .to.be.above(-8.1)
                .to.be.below(-8, 'Bob\'s EVER balance is not correct');
            expect(metricsChange.vaultWEVERBalance)
                .to.be.equal(0, 'Vault\'s WEVER balance is not correct');
            expect(metricsChange.vaultEVERBalance)
                .to.be.equal(0, 'Vault\'s EVER balance is not correct');
            expect(metricsChange.WEVERTotalSupply)
                .to.be.equal(8, 'WEVER total supply is not correct');
            expect(metricsChange.rootWEVERBalance)
                .to.be.equal(8, 'Root WEVER balance is not correct');
        });

        it('Bob transfer WEVERs to root', async () => {
            const bobInitialMetrics = await getVaultMetrics(
                context.bobTokenWallet,
                context.bob,
                context.vaultTokenWallet,
                context.vault,
                root,
            );

            const trace = await locklift.tracing.trace(
                context.bobTokenWallet.methods.transfer({
                    amount: toNano(6),
                    payload: EMPTY_TVM_CELL,
                    remainingGasTo: context.bob.address,
                    deployWalletValue: toNano(0.2),
                    recipient: root.address,
                    notify: true
                }).send({
                    from: context.bob.address,
                    amount: toNano(1)
                }),
                {
                    // raise: false
                }
            );

            // await trace.traceTree?.beautyPrint();

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

        it('Log stats', async () => {
            const vault_balance = await locklift.provider.getBalance(context.vault.address);
            const {
                total_wrapped
            } = await context.vault.methods.total_wrapped().call();

            logger.log(`Vault balance: ${fromNano(vault_balance)}`);
            logger.log(`Vault total wrapped: ${fromNano(total_wrapped)}`);

            const {
                legacy_vault_reserves
            } = await root.methods.legacy_vault_reserves().call();
            const root_balance = await locklift.provider.getBalance(root.address);
            const {
                value0: total_supply
            } = await root.methods.totalSupply({ answerId: 0 }).call();

            logger.log(`Root legacy vault reserves: ${fromNano(legacy_vault_reserves)}`);
            logger.log(`Root balance: ${fromNano(root_balance)}`);
            logger.log(`Root total supply: ${fromNano(total_supply)}`);
        });

        it('Burn more tokens than root has', async () => {
            const {
                value0: bob_balance
            } = await context.bobTokenWallet.methods.balance({ answerId: 0 }).call();

            const bobInitialMetrics = await getVaultMetrics(
                context.bobTokenWallet,
                context.bob,
                context.vaultTokenWallet,
                context.vault,
                root,
            );

            const trace = await locklift.tracing.trace(
                context.bobTokenWallet.methods.transfer({
                    amount: bob_balance,
                    payload: EMPTY_TVM_CELL,
                    remainingGasTo: context.bob.address,
                    deployWalletValue: toNano(0.2),
                    recipient: root.address,
                    notify: true
                }).send({
                    from: context.bob.address,
                    amount: toNano(1)
                })
            );

            // await trace.traceTree?.beautyPrint();

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
                .to.be.equal(0, "Bob's WEVER balance is not correct");
            expect(metricsChange.userEVERBalance)
                .to.be.above(-0.5)
                .to.be.below(-0.01, "Bob's EVER balance is not correct");
            expect(metricsChange.vaultWEVERBalance)
                .to.be.equal(0, 'Vault\'s WEVER balance is not correct');
            expect(metricsChange.vaultEVERBalance)
                .to.be.equal(0, 'Vault\'s EVER balance is not correct');

            expect(metricsChange.WEVERTotalSupply)
                .to.be.equal(0, 'WEVER total supply is not correct');
            expect(metricsChange.rootWEVERBalance)
                .to.be.equal(0, 'Root WEVER balance is not correct');
        });
    });
});