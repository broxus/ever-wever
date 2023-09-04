import {EMPTY_TVM_CELL, expect, getAddress, setupVaultLegacy} from "../utils";
import {Address, Contract, fromNano, getRandomNonce, toNano, zeroAddress} from "locklift";
import {
    TokenRootUpgradeableAbi,
    TokenWalletUpgradeableAbi,
    UpgradeAssistantFabricAbi,
    VaultTokenRoot_V1Abi
} from "../../build/factorySource";
const logger = require("mocha-logger");
import _ from 'underscore';
import {UpgradeAssistant} from "../upgrade-assistant";


const USERS_AMOUNT = 300;
const USER_INITIAL_BALANCE = toNano('1');
const UPGRADE_VALUE = toNano(USERS_AMOUNT);


describe('Test upgrading root and wallets', async function() {
    this.timeout(20000000);
    // @ts-ignore
    let context: ReturnType<typeof setupWever> extends Promise<infer F> ? F : never = {};
    let root: Contract<TokenRootUpgradeableAbi>;
    let vault_v1: Contract<VaultTokenRoot_V1Abi>;
    let users: Address[];
    let wallets: Address[] = [];

    it("Setup contracts", async function () {
        await locklift.deployments.fixture();

        context = await setupVaultLegacy();
    });

    it('Setup legacy root', async () => {
        const signer = await locklift.keystore.getSigner("0");

        const tokenWallet = await locklift.factory.getContractArtifacts('TokenWalletUpgradeable');
        const tokenWalletPlatform = await locklift.factory.getContractArtifacts('TokenWalletPlatform');

        const {
            contract
        } = await locklift.factory.deployContract({
            contract: 'TokenRootUpgradeable',
            constructorParams: {
                initialSupplyTo: zeroAddress,
                initialSupply: 0,
                deployWalletValue: 0,
                mintDisabled: false,
                burnByRootDisabled: false,
                burnPaused: false,
                remainingGasTo: new Address(context.owner.address.toString())
            },
            initParams: {
                name_: "Wrapped EVER",
                symbol_: "WEVER",
                decimals_: 9,
                rootOwner_: new Address(context.owner.address.toString()),
                deployer_: zeroAddress,
                randomNonce_: getRandomNonce(),
                walletCode_: tokenWallet.code,
                platformCode_: tokenWalletPlatform.code
            },
            publicKey: signer.publicKey,
            value: locklift.utils.toNano('15')
        });

        root = contract;

        logger.log(`Root (to be upgraded): ${root.address}`);
    });

    it(`Setup ${USERS_AMOUNT} token wallets`, async () => {
        const signer = await locklift.keystore.getSigner("0");

        const {
            contract: airdrop
        } = await locklift.tracing.trace(
            locklift.factory.deployContract({
                contract: 'Airdrop',
                constructorParams: {
                    owner_: context.owner.address,
                    root_: root.address,
                    wallets_: USERS_AMOUNT,
                    airdrop_amount_: USER_INITIAL_BALANCE
                },
                initParams: {
                    _randomNonce: getRandomNonce()
                },
                publicKey: signer?.publicKey,
                value: toNano('1'),
            })
        );

        await locklift.tracing.trace(
            root.methods.transferOwnership({
                newOwner: airdrop.address,
                remainingGasTo: context.owner.address,
                callbacks: []
            }).send({
                from: context.owner.address,
                amount: toNano('1')
            })
        );

        const trace = await locklift.tracing.trace(
            airdrop.methods.trigger().send({
                from: context.owner.address,
                amount: toNano(USERS_AMOUNT)
            })
        );

        // await trace.traceTree?.beautyPrint();

        users = _.range(1, USERS_AMOUNT + 1).map((i) => getAddress(i));

        const users_chunks = _.chunk(users, 50)
        for (const [i, users_chunk] of users_chunks.entries()) {
            logger.log(`Getting addresses for chunk ${i + 1} / ${users_chunks.length}`);

            const wallets_promises = users_chunk.map(async (user) => {
                const {
                    value0: wallet
                } = await root.methods.walletOf({
                    walletOwner: user,
                    answerId: 0
                }).call({});
    
                return wallet;
            });
    
            wallets = [...wallets, ...(await Promise.all(wallets_promises))];
        }

        const {
            value0: total_supply
        } = await root.methods.totalSupply({ answerId: 0 }).call();

        expect(Number(total_supply))
            .to.be.equal(Number(USER_INITIAL_BALANCE) * USERS_AMOUNT, 'Wrong total supply after airdrop');
    });

    describe('Upgrading root', async () => {
        let oldPlatformCode: any, oldWalletCode: any;

        it('Store some root details before upgrade', async () => {
            oldPlatformCode = await root.methods.platformCode({ answerId: 0 })
                .call().then(t => t.value0);

            oldWalletCode = await root.methods.walletCode({ answerId: 0 })
                .call().then(t => t.value0);
        });

        it('Upgrade root', async () => {
            const VaultTokenRoot_V1 = await locklift.factory.getContractArtifacts('VaultTokenRoot_V1');

            const to_grant = USERS_AMOUNT * Number(USER_INITIAL_BALANCE);

            await locklift.tracing.trace(
                root.methods.upgrade({
                    code: VaultTokenRoot_V1.code
                }).send({
                    from: context.owner.address,
                    amount: (Number(to_grant) + Number(toNano('1'))).toString()
                })
            );

            vault_v1 = await locklift.factory.getDeployedContract('VaultTokenRoot_V1', root.address);
        });

        it('Check naming', async () => {
            const {
                value0: name
            } = await vault_v1.methods.name({ answerId: 0 }).call();
            const {
                value0: symbol
            } = await vault_v1.methods.symbol({ answerId: 0 }).call();
            const {
                value0: decimals
            } = await vault_v1.methods.decimals({ answerId: 0 }).call();

            expect(name)
                .to.be.equal('Wrapped EVER', 'Wrong name after upgrading root');
            expect(symbol)
                .to.be.equal('WEVER', 'Wrong symbol after upgrading root');
            expect(decimals)
                .to.be.equal('9', 'Wrong decimals after upgrading root');
        });

        it('Check codes', async () => {
            const {
                value0: platformCode
            } = await vault_v1.methods.platformCode({ answerId: 0 }).call();
            const {
                value0: walletCode
            } = await vault_v1.methods.walletCode({ answerId: 0 }).call();

            expect(platformCode)
                .to.be.equal(oldPlatformCode, 'Wrong platform code after upgrading root');
            expect(walletCode)
                .to.be.equal(oldWalletCode, 'Wrong wallet code after upgrading root');
        });

        it('Validate wEVER stats', async () => {
            const total_supply = await vault_v1.methods.totalSupply({ answerId: 0 }).call().then(t => t.value0);
            const balance = await locklift.provider.getBalance(vault_v1.address);
            const reserves = await vault_v1.methods.getReserves({ answerId: 0 }).call().then(t => t.value0);
            const initial_balance = await vault_v1.methods.getInitialBalance({ answerId: 0 }).call().then(t => t.value0);

            expect(Number(balance))
                .to.be.equal(Number(reserves), 'Balance and reserve should be equal');
            expect(Number(total_supply) + Number(initial_balance))
                .to.be.equal(Number(reserves), 'Total supply and reserve should be equal');;
        });
    });

    describe('Upgrade token wallets', async () => {
        // let upgrade_assistant_fabric: Contract<UpgradeAssistantFabricAbi>;
        // let worker_keys: Ed25519KeyPair[];
        let upgrade_assistant: UpgradeAssistant;

        it('Setup upgrade assistant', async () => {
            upgrade_assistant = new UpgradeAssistant(
                context.owner.address,
                root.address,
                wallets,
                1
            );

            await upgrade_assistant.setup({
                deployBatchValue: toNano('5'),
                deployFabricValue: toNano('10')
            });
        });

        it('Upload wallets to batches', async () => {
            await upgrade_assistant.uploadWallets();
        });

        it('Set wallet code', async () => {
            const VaultTokenWallet_V1 = await locklift.factory.getContractArtifacts('VaultTokenWallet_V1');

            await locklift.tracing.trace(
                vault_v1.methods.setWalletCode({
                    code: VaultTokenWallet_V1.code
                }).send({
                    from: context.owner.address,
                    amount: toNano('1')
                })
            );
        });

        it('Transfer root ownership to assistant', async () => {
            await locklift.tracing.trace(
                vault_v1.methods.transferOwnership({
                    newOwner: upgrade_assistant.fabric.address,
                    remainingGasTo: context.owner.address,
                    callbacks: []
                }).send({
                    from: context.owner.address,
                    amount: toNano('1')
                })
            );
        });

        it('Trigger upgrade', async () => {
            const oldBalance = await locklift.provider.getBalance(upgrade_assistant.fabric.address);

            const trace = await locklift.tracing.trace(
                upgrade_assistant.fabric.methods.upgrade({}).send({
                    from: context.owner.address,
                    amount: UPGRADE_VALUE
                }),
                {
                    raise: false
                }
            );

            // await trace.traceTree?.beautyPrint();

            const balance = await locklift.provider.getBalance(upgrade_assistant.fabric.address);

            const diff = Number(oldBalance) - Number(balance) + Number(UPGRADE_VALUE);

            logger.log(`Upgrading ${users.length} wallets took ${fromNano(diff)}`);
        });

        it('Check fabric is done', async () => {
            const done = await upgrade_assistant.isDone();

            expect(done)
                .to.be.equal(true, 'Fabric should be done after upgrade');
        });

        it('Revoke ownership', async () => {
            await locklift.tracing.trace(
                upgrade_assistant.fabric.methods.revokeOwnership({}).send({
                    from: context.owner.address,
                    amount: toNano('1')
                })
            );

            expect(await vault_v1.methods.rootOwner({ answerId: 0 }).call().then(t => t.value0.toString()))
                .to.be.equal(context.owner.address.toString(), 'Ownership revoke failed');

            expect(await locklift.provider.getBalance(upgrade_assistant.fabric.address))
                .to.be.equal('0', 'Factory should lose all its balance');
        });

        it('Check wallets upgraded', async () => {
            const versions = [];

            const wallets_chunks = _.chunk(wallets, 50);

            for (const [i, wallets_chunk] of wallets_chunks.entries()) {
                logger.log(`Getting versions for chunk ${i + 1} / ${wallets_chunks.length}`);

                const versions_promises = wallets_chunk.map(async (wallet) => {
                    const wallet_contract = await locklift.factory.getDeployedContract('VaultTokenWallet_V1', wallet);

                    return wallet_contract.methods.version({ answerId: 0 }).call().then(v => v.value0);
                });

                versions.push(...(await Promise.all(versions_promises)));
            }

            versions.every(v => expect(v).to.be.equal('2', 'Some wallets failed to upgrade'));
        });
    });
});