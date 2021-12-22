const logger = require("mocha-logger");
const {
    convertCrystal
} = locklift.utils;
const {expect} = require("chai");


const {
    stringToBytesArray,
    afterRun,
    getWTONMetrics,
    getMetricsChange,
    logMetricsChange,
    setupWton
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
        [vault, tunnel, user, root, userTokenWallet, vaultTokenWallet] = await setupWton();
    });

    describe('Deploy new wTON', async function() {
        it('Deploy new root', async function() {
            const RootToken = await locklift.factory.getContract(
                'RootTokenContract',
                './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
            );

            const TokenWallet = await locklift.factory.getContract(
                'TONTokenWallet',
                './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
            );

            const [keyPair] = await locklift.keys.getKeyPairs();

            root2 = await locklift.giver.deployContract({
                contract: RootToken,
                constructorParams: {
                    root_public_key_: `0x${keyPair.public}`,
                    root_owner_address_: locklift.ton.zero_address
                },
                initParams: {
                    name: stringToBytesArray('Wrapped TON'),
                    symbol: stringToBytesArray('wTON'),
                    decimals: 9,
                    wallet_code: TokenWallet.code,
                    _randomNonce: locklift.utils.getRandomNonce(),
                },
                keyPair,
            });

            logger.log(`Root2 address: ${root2.address}`);
        });

        it('Deploy new user token wallet', async function() {
            await user.runTarget({
                contract: root2,
                method: 'deployEmptyWallet',
                params: {
                    deploy_grams: convertCrystal(1, 'nano'),
                    wallet_public_key_: 0,
                    owner_address_: user.address,
                    gas_back_address: user.address,
                },
                value: convertCrystal(2, 'nano'),
            });

            userTokenWallet2 = await locklift.factory.getContract(
                'TONTokenWallet',
                './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
            );

            const userTokenWalletAddress = await root2.call({
                method: 'getWalletAddress',
                params: {
                    wallet_public_key_: 0,
                    owner_address_: user.address
                },
            });

            userTokenWallet2.setAddress(userTokenWalletAddress);

            logger.log(`User token wallet2 address: ${userTokenWalletAddress}`);
        });

        it('Transfer root ownership to tunnel', async function() {
            const [keyPair] = await locklift.keys.getKeyPairs();

            await root2.run({
                method: 'transferOwner',
                params: {
                    root_public_key_: 0,
                    root_owner_address_: tunnel.address,
                },
                keyPair,
            });

            const {
                root_public_key,
                root_owner_address
            } = await root.call({
                method: 'getDetails',
            });

            expect(root_public_key.toNumber()).to.be.equal(0, 'Wrong root2 public key');
            expect(root_owner_address).to.be.equal(tunnel.address, 'Root2 owner should be tunnel');
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
            expect(configuration.root).to.be.equal(root2.address, 'New configuration should update root');
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
                convertCrystal(vaultTotalWrapped.plus(vaultInitialBalance), 'ton').toNumber(),
                'Vault balance differs from total wrapped + initial balance'
            );
        });

        it('Check new vault token wallet', async function() {
            const vaultTokenWalletAddress = await vault.call({
                method: 'token_wallet',
            });

            const vaultTokenWalletAddressExpected = await root2.call({
                method: 'getWalletAddress',
                params: {
                    wallet_public_key_: 0,
                    owner_address_: user.address
                },
            });

            logger.log(`New Vault token wallet address: ${vaultTokenWalletAddressExpected}`);

            vaultTokenWallet2 = await locklift.factory.getContract(
                'TONTokenWallet',
                './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
            );

            vaultTokenWallet2.setAddress(vaultTokenWalletAddress);
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
        it('Wrap TONs to new wTONs', async function() {
            const initialMetrics = {
                v1: (await getWTONMetrics(
                    userTokenWallet,
                    user,
                    vaultTokenWallet,
                    vault,
                    root,
                )),
                v2: (await getWTONMetrics(
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
                value: convertCrystal(2.5, 'nano'),
                params: {
                    tokens: convertCrystal(1, 'nano'),
                    wallet_public_key: 0,
                    owner_address: user.address,
                    gas_back_address: user.address,
                },
            });

            const finalMetrics = {
                v1: (await getWTONMetrics(
                    userTokenWallet,
                    user,
                    vaultTokenWallet,
                    vault,
                    root,
                )),
                v2: (await getWTONMetrics(
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

            logger.success('Old wTON metrics change');
            logMetricsChange(metricsChange.v1);

            logger.success('New wTON metrics change');
            logMetricsChange(metricsChange.v2);

            // Check metrics for old token
            expect(metricsChange.v1.userWTONBalance)
                .to.be.equal(0, 'Wrong user old wTON balance change');

            expect(metricsChange.v1.vaultWTONBalance)
                .to.be.equal(0, 'Wrong vault old wTON balance change');

            expect(metricsChange.v1.wTONTotalSupply)
                .to.be.equal(0, 'Wrong old wTON total supply change');

            // Check metrics for new token
            expect(metricsChange.v2.userWTONBalance)
                .to.be.equal(1, 'Wrong user new wTON balance change');

            expect(metricsChange.v2.userTONBalance)
                .to.be.below(-1, 'Too low user TON balance change')
                .to.be.above(-1.5, 'Too high user TON balance change');

            expect(metricsChange.v2.vaultWTONBalance)
                .to.be.equal(0, 'Wrong vault new wTON balance change');

            expect(metricsChange.v2.vaultTONBalance)
                .to.be.equal(
                metricsChange.v2.userWTONBalance,
                'Vault TON balance change differs from user new wTON balance change'
            );

            expect(metricsChange.v2.vaultTotalWrapped)
                .to.be.equal(
                metricsChange.v2.userWTONBalance,
                'Vault total wrapped change differs from user new wTON balance change'
            );

            expect(metricsChange.v2.wTONTotalSupply)
                .to.be.equal(
                metricsChange.v2.userWTONBalance,
                'wTON total supply change differs from user new wTON balance change'
            );
        });

        it('Unwrap new WTONs to TONs', async function() {
            const initialMetrics = {
                v1: (await getWTONMetrics(
                    userTokenWallet,
                    user,
                    vaultTokenWallet,
                    vault,
                    root,
                )),
                v2: (await getWTONMetrics(
                    userTokenWallet2,
                    user,
                    vaultTokenWallet2,
                    vault,
                    root2,
                ))
            };

            await user.runTarget({
                contract: userTokenWallet2,
                method: 'transferToRecipient',
                params: {
                    recipient_public_key: 0,
                    recipient_address: vault.address,
                    tokens: convertCrystal(1, 'nano'),
                    deploy_grams: 0,
                    transfer_grams: 0,
                    send_gas_to: user.address,
                    notify_receiver: true,
                    payload: stringToBytesArray(''),
                },
                value: convertCrystal('4', 'nano'),
            });

            const finalMetrics = {
                v1: (await getWTONMetrics(
                    userTokenWallet,
                    user,
                    vaultTokenWallet,
                    vault,
                    root,
                )),
                v2: (await getWTONMetrics(
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

            logger.success('Old wTON metrics change');
            logMetricsChange(metricsChange.v1);

            logger.success('New wTON metrics change');
            logMetricsChange(metricsChange.v2);

            // Check metrics for old token
            expect(metricsChange.v1.userWTONBalance)
                .to.be.equal(0, 'Wrong user old wTON balance change');

            expect(metricsChange.v1.vaultWTONBalance)
                .to.be.equal(0, 'Wrong vault old wTON balance change');

            expect(metricsChange.v1.wTONTotalSupply)
                .to.be.equal(0, 'Wrong old wTON total supply change');

            // Check metrics for new token
            expect(metricsChange.v2.userWTONBalance)
                .to.be.equal(-1, 'Wrong user new wTON balance change');

            expect(metricsChange.v2.userTONBalance)
                .to.be.below(1, 'Too high user TON balance change')
                .to.be.above(0.7, 'Too low user TON balance change');

            expect(metricsChange.v2.vaultWTONBalance)
                .to.be.equal(0, 'Wrong vault new wTON balance change');

            expect(metricsChange.v2.vaultTONBalance)
                .to.be.equal(
                metricsChange.v2.userWTONBalance,
                'Vault TON balance change differs from user new wTON balance change'
            );

            expect(metricsChange.v2.vaultTotalWrapped)
                .to.be.equal(
                metricsChange.v2.userWTONBalance,
                'Vault total wrapped change differs from user new wTON balance change'
            );

            expect(metricsChange.v2.wTONTotalSupply)
                .to.be.equal(
                metricsChange.v2.userWTONBalance,
                'wTON total supply change differs from user new wTON balance change'
            );
        });
    });
});
