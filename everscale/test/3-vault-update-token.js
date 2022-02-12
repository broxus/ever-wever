const logger = require("mocha-logger");
const {
    convertCrystal
} = locklift.utils;
const {expect, use} = require("chai");


const {
    stringToBytesArray,
    afterRun,
    getVaultMetrics,
    getMetricsChange,
    logMetricsChange,
    setupWever,
    EMPTY_TVM_CELL,
    ...utils
} = require("./utils");


describe('Test vault update to new token', async function() {
    this.timeout(200000);

    let vault;
    let tunnel;
    let user;

    let root;
    let userTokenWallet;
    let vaultTokenWallet;

    let root2;
    let userTokenWallet2;
    let vaultTokenWallet2;

    it('Setup contracts', async function() {
        [vault, tunnel, user, root, userTokenWallet, vaultTokenWallet] = await setupWever();
    });

    describe('Deploy new wEVER', async function() {
        it('Deploy new root', async function() {
            const RootToken = await locklift.factory.getContract('TokenRoot', utils.TOKEN_PATH);
            const TokenWallet = await locklift.factory.getContract('TokenWallet', utils.TOKEN_PATH);

            const [keyPair] = await locklift.keys.getKeyPairs();

            root2 = await locklift.giver.deployContract({
                contract: RootToken,
                constructorParams: {
                    initialSupplyTo: user.address,
                    initialSupply: 0,
                    deployWalletValue: locklift.utils.convertCrystal('0.1', 'nano'),
                    mintDisabled: false,
                    burnByRootDisabled: true,
                    burnPaused: false,
                    remainingGasTo: locklift.utils.zeroAddress
                },
                initParams: {
                    deployer_: locklift.utils.zeroAddress,
                    randomNonce_: locklift.utils.getRandomNonce(),
                    rootOwner_: user.address,
                    name_: 'Wrapped EVER',
                    symbol_: 'WEVER',
                    decimals_: 9,
                    walletCode_: TokenWallet.code,
                },
                keyPair,
            });

            logger.log(`Root2 address: ${root2.address}`);

            expect(root2.address)
                .to.not.be.equal(root.address, 'Roots should be different');
        });

        it('Deploy user token wallet for root2', async function() {
            await user.runTarget({
                contract: root2,
                method: 'deployWallet',
                params: {
                    walletOwner: user.address,
                    deployWalletValue: locklift.utils.convertCrystal(2, 'nano'),
                },
                value: locklift.utils.convertCrystal(5, 'nano'),
            });

            const userTokenWalletAddress = await utils.getTokenWalletAddress(
                root2,
                user.address
            );

            userTokenWallet2 = await locklift.factory.getContract('TokenWallet', utils.TOKEN_PATH);
            userTokenWallet2.setAddress(userTokenWalletAddress);

            logger.log(`User token wallet2 address: ${userTokenWalletAddress}`);

            expect(userTokenWallet)
                .to.not.be.equal(userTokenWallet.address, 'User token wallets should be different');
        });

        it('Transfer root ownership to tunnel', async function() {
            const [keyPair] = await locklift.keys.getKeyPairs();

            await user.runTarget({
                contract: root2,
                method: 'transferOwnership',
                params: {
                    newOwner: tunnel.address,
                    remainingGasTo: user.address,
                    callbacks: {}
                },
                keyPair,
            });

            const root2Owner = await root2.call({
                method: 'rootOwner',
            });

            expect(root2Owner)
                .to.be.equal(tunnel.address, 'Root2 owner should be tunnel');
        });
    });

    describe('Update vault target root', async function() {
        it('Update root in vault configuration', async function() {
            const configuration = await vault.call({ method: 'configuration' });

            const configurationNewRoot = {
                ...configuration,
                root: root2.address
            };

            await user.runTarget({
                contract: vault,
                method: 'setConfiguration',
                params: {
                    _configuration: configurationNewRoot,
                }
            });
        });

        it('Check vault configuration root', async function() {
            const configuration = await vault.call({ method: 'configuration' });

            expect(configuration.root)
                .to.be.equal(root2.address, 'New configuration should update root');
        });

        it('Drain vault after update', async function() {
            await afterRun();

            await user.runTarget({
                contract: vault,
                method: 'drain',
                params: {
                    receiver: user.address,
                },
            });
        });

        it('Check vault balance correct', async function() {
            const vaultBalance = await locklift.ton.getBalance(vault.address);
            const vaultTotalWrapped = await vault.call({ method: 'total_wrapped' });

            const {
                initial_balance: vaultInitialBalance
            } = (await vault.call({ method: 'configuration' }));

            expect(convertCrystal(vaultBalance, 'ton').toNumber())
                .to.be.equal(
                    locklift.utils.convertCrystal(vaultTotalWrapped.plus(vaultInitialBalance), 'ton').toNumber(),
                    'Vault balance differs from total wrapped + initial balance'
                );
        });

        it('Check new vault token wallet', async function() {
            const vaultTokenWalletAddress = await vault.call({
                method: 'token_wallet',
            });

            const vaultTokenWalletAddressExpected = await utils.getTokenWalletAddress(
                root2,
                vault.address
            );

            expect(vaultTokenWalletAddress)
                .to.be.equal(vaultTokenWalletAddressExpected, 'Wrong vault token wallet');

            logger.log(`New Vault token wallet address: ${vaultTokenWalletAddressExpected}`);

            const vaultTokenWallet2 = await locklift.factory.getContract('TokenWallet', utils.TOKEN_PATH);

            vaultTokenWallet2.setAddress(vaultTokenWalletAddress);

            expect(vaultTokenWallet2.address)
                .to.not.be.equal(vaultTokenWallet.address, 'Vault token wallets should be different');
        });
    });

    describe('Update tunnel', async function() {
        it('Update tunnel vault destination', async function() {
            await user.runTarget({
                contract: tunnel,
                method: '__updateTunnel',
                params: {
                    source: vault.address,
                    destination: root2.address,
                }
            });
        });

        it('Check tunnel target', async function() {
            const {
                destinations
            } = await tunnel.call({ method: '__getTunnels' });

            expect(destinations)
                .to.include(root2.address, 'New tunnel destination should be root2');
        });
    });

    describe('Test new token', async function() {
        it('Wrap EVERs to new wEVERs', async function() {
            const initialMetrics = {
                v1: (await getVaultMetrics(
                    userTokenWallet,
                    user,
                    vaultTokenWallet,
                    vault,
                    root,
                )),
                v2: (await getVaultMetrics(
                    userTokenWallet2,
                    user,
                    vaultTokenWallet2,
                    vault,
                    root2,
                ))
            };

            await user.runTarget({
                contract: vault,
                method: 'wrap',
                value: locklift.utils.convertCrystal(4, 'nano'),
                params: {
                    tokens: locklift.utils.convertCrystal(2, 'nano'),
                    owner_address: user.address,
                    gas_back_address: user.address,
                    payload: EMPTY_TVM_CELL
                },
            });

            const finalMetrics = {
                v1: (await getVaultMetrics(
                    userTokenWallet,
                    user,
                    vaultTokenWallet,
                    vault,
                    root,
                )),
                v2: (await getVaultMetrics(
                    userTokenWallet2,
                    user,
                    vaultTokenWallet2,
                    vault,
                    root2,
                ))
            };

            const metricsChange = {
                v1: getMetricsChange(initialMetrics.v1, finalMetrics.v1),
                v2: getMetricsChange(initialMetrics.v2, finalMetrics.v2),
            };

            logger.success('Old wEVER metrics change');
            logMetricsChange(metricsChange.v1);

            logger.success('New wEVER metrics change');
            logMetricsChange(metricsChange.v2);

            // Check metrics for old token
            expect(metricsChange.v1.userWEVERBalance)
                .to.be.equal(0, 'Wrong user old wEVER balance change');

            expect(metricsChange.v1.vaultWEVERBalance)
                .to.be.equal(0, 'Wrong vault old wEVER balance change');

            expect(metricsChange.v1.WEVERTotalSupply)
                .to.be.equal(0, 'Wrong old wEVER total supply change');

            // Check metrics for new token
            expect(metricsChange.v2.userWEVERBalance)
                .to.be.equal(2, 'Wrong user new wEVER balance change');

            expect(metricsChange.v2.userEVERBalance)
                .to.be.below(-2, 'Too low user EVER balance change')
                .to.be.above(-2.5, 'Too high user EVER balance change');

            expect(metricsChange.v2.vaultWEVERBalance)
                .to.be.equal(0, 'Wrong vault new wEVER balance change');

            expect(metricsChange.v2.vaultEVERBalance)
                .to.be.equal(
                    metricsChange.v2.userWEVERBalance,
                    'Vault EVER balance change differs from user new wEVER balance change'
                );

            expect(metricsChange.v2.vaultTotalWrapped)
                .to.be.equal(
                    metricsChange.v2.userWEVERBalance,
                    'Vault total wrapped change differs from user new wEVER balance change'
                );

            expect(metricsChange.v2.WEVERTotalSupply)
                .to.be.equal(
                    metricsChange.v2.userWEVERBalance,
                    'wEVER total supply change differs from user new wEVER balance change'
                );
        });

        it('Unwrap new wEVERs to EVERs', async function() {
            const initialMetrics = {
                v1: (await getVaultMetrics(
                    userTokenWallet,
                    user,
                    vaultTokenWallet,
                    vault,
                    root,
                )),
                v2: (await getVaultMetrics(
                    userTokenWallet2,
                    user,
                    vaultTokenWallet2,
                    vault,
                    root2,
                ))
            };

            await user.runTarget({
                contract: userTokenWallet2,
                method: 'transfer',
                params: {
                    amount: locklift.utils.convertCrystal(2, 'nano'),
                    recipient: vault.address,
                    deployWalletValue: 200000000,
                    remainingGasTo: user.address,
                    notify: true,
                    payload: stringToBytesArray(''),
                },
                value: locklift.utils.convertCrystal('4', 'nano'),
            });

            const finalMetrics = {
                v1: (await getVaultMetrics(
                    userTokenWallet,
                    user,
                    vaultTokenWallet,
                    vault,
                    root,
                )),
                v2: (await getVaultMetrics(
                    userTokenWallet2,
                    user,
                    vaultTokenWallet2,
                    vault,
                    root2,
                ))
            };

            const metricsChange = {
                v1: getMetricsChange(initialMetrics.v1, finalMetrics.v1),
                v2: getMetricsChange(initialMetrics.v2, finalMetrics.v2),
            };

            logger.success('Old wEVER metrics change');
            logMetricsChange(metricsChange.v1);

            logger.success('New wEVER metrics change');
            logMetricsChange(metricsChange.v2);

            // Check metrics for old token
            expect(metricsChange.v1.userWEVERBalance)
                .to.be.equal(0, 'Wrong user old wEVER balance change');

            expect(metricsChange.v1.vaultWEVERBalance)
                .to.be.equal(0, 'Wrong vault old wEVER balance change');

            expect(metricsChange.v1.WEVERTotalSupply)
                .to.be.equal(0, 'Wrong old wEVER total supply change');

            // Check metrics for new token
            expect(metricsChange.v2.userWEVERBalance)
                .to.be.equal(-2, 'Wrong user new wEVER balance change');

            expect(metricsChange.v2.userEVERBalance)
                .to.be.below(2, 'Too high user EVER balance change')
                .to.be.above(1.5, 'Too low user EVER balance change');

            expect(metricsChange.v2.vaultWEVERBalance)
                .to.be.equal(0, 'Wrong vault new wEVER balance change');

            expect(metricsChange.v2.vaultEVERBalance)
                .to.be.equal(
                    metricsChange.v2.userWEVERBalance,
                    'Vault EVER balance change differs from user new wEVER balance change'
                );

            expect(metricsChange.v2.vaultTotalWrapped)
                .to.be.equal(
                    metricsChange.v2.userWEVERBalance,
                    'Vault total wrapped change differs from user new wEVER balance change'
                );

            expect(metricsChange.v2.WEVERTotalSupply)
                .to.be.equal(
                    metricsChange.v2.userWEVERBalance,
                    'wEVER total supply change differs from user new wEVER balance change'
                );
        });
    });
});
