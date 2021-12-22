const logger = require("mocha-logger");
const {
    convertCrystal
} = locklift.utils;

const BigNumber = require('bignumber.js');
const chai = require('chai');
const {us} = require("truffle/build/83.bundled");
chai.use(require('chai-bignumber')());

const { expect } = chai;


async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


const afterRun = async (tx) => {
    if (locklift.network === 'dev') {
        await sleep(60000);
    }
};


const stringToBytesArray = (dataString) => {
    return Buffer.from(dataString).toString('hex')
};


const setupWton = async () => {
    // Wrapped TON token
    // - Deploy WTON root
    const RootToken = await locklift.factory.getContract(
        'RootTokenContract',
        './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
    );

    const TokenWallet = await locklift.factory.getContract(
        'TONTokenWallet',
        './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
    );

    const [keyPair] = await locklift.keys.getKeyPairs();

    const _randomNonce = locklift.utils.getRandomNonce();

    const root = await locklift.giver.deployContract({
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
            _randomNonce,
        },
        keyPair,
    });

    logger.log(`Root address: ${root.address}`);

    // User
    // - Deploy user account
    const Account = await locklift.factory.getAccount('Wallet');

    const user = await locklift.giver.deployContract({
        contract: Account,
        constructorParams: {},
        initParams: {
            _randomNonce,
        },
        keyPair,
    }, convertCrystal(30, 'nano'));

    user.afterRun = afterRun;
    user.setKeyPair(keyPair);

    logger.log(`User address: ${user.address}`);

    // - Deploy user token wallet
    await user.runTarget({
        contract: root,
        method: 'deployEmptyWallet',
        params: {
            deploy_grams: convertCrystal(1, 'nano'),
            wallet_public_key_: 0,
            owner_address_: user.address,
            gas_back_address: user.address,
        },
        value: convertCrystal(2, 'nano'),
    });

    const userTokenWalletAddress = await root.call({
        method: 'getWalletAddress',
        params: {
            wallet_public_key_: 0,
            owner_address_: user.address
        },
    });

    // Wait until user token wallet is presented into the GraphQL
    await locklift.ton.client.net.wait_for_collection({
        collection: 'accounts',
        filter: {
            id: { eq: userTokenWalletAddress },
            balance: { gt: `0x0` }
        },
        result: 'balance'
    });

    logger.log(`User token wallet: ${userTokenWalletAddress}`);

    const userTokenWallet = await locklift.factory.getContract(
        'TONTokenWallet',
        './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
    );

    userTokenWallet.setAddress(userTokenWalletAddress);

    // Tunnel
    // - Deploy tunnel
    const Tunnel = await locklift.factory.getContract('Tunnel');

    const tunnel = await locklift.giver.deployContract({
        contract: Tunnel,
        constructorParams: {
            sources: [],
            destinations: [],
            owner_: user.address,
        },
        initParams: {
            _randomNonce,
        },
        keyPair,
    });

    logger.log(`Tunnel address: ${tunnel.address}`);

    // Vault
    // - Deploy vault
    const WrappedTONVault = await locklift.factory.getContract('WrappedTONVault');


    const vault = await locklift.giver.deployContract({
        contract: WrappedTONVault,
        constructorParams: {
            owner_: user.address,
            root_tunnel: tunnel.address,
            root: root.address,
            receive_safe_fee: convertCrystal(1, 'nano'),
            settings_deploy_wallet_grams: convertCrystal(0.05, 'nano'),
            initial_balance: convertCrystal(1, 'nano')
        },
        initParams: {
            _randomNonce,
        },
        keyPair,
    });

    vault.afterRun = afterRun;

    logger.log(`Vault address: ${vault.address}`);

    // Wait until user token wallet is presented into the GraphQL
    await locklift.ton.client.net.wait_for_collection({
        collection: 'accounts',
        filter: {
            id: { eq: vault.address },
            balance: { gt: `0x0` }
        },
        result: 'balance'
    });

    // - Setup vault token wallet
    const vaultTokenWalletAddress = await vault.call({
        method: 'token_wallet',
    });

    const vaultTokenWallet = await locklift.factory.getContract(
        'TONTokenWallet',
        './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
    );
    vaultTokenWallet.setAddress(vaultTokenWalletAddress);

    logger.log(`Vault token wallet address: ${vaultTokenWallet.address}`);

    await locklift.ton.client.net.wait_for_collection({
        collection: 'accounts',
        filter: {
            id: { eq: vaultTokenWallet.address },
            balance: { gt: `0x0` }
        },
        result: 'balance'
    });

    // Proxy token transfer
    // - Deploy proxy token transfer
    const ProxyTokenTransfer = await locklift.factory.getContract('ProxyTokenTransfer');
    const proxyTokenTransfer = await locklift.giver.deployContract({
       contract: ProxyTokenTransfer,
        constructorParams: {
            owner_: user.address,
        },
        initParams: {
            _randomNonce,
        },
        keyPair,
    });

    await locklift.ton.client.net.wait_for_collection({
        collection: 'accounts',
        filter: {
            id: { eq: proxyTokenTransfer.address },
            balance: { gt: `0x0` }
        },
        result: 'balance'
    });

    logger.log(`Proxy token transfer: ${proxyTokenTransfer.address}`);

    // - Set configuration (use user as ethereum configuration to emulate callbacks)
    await user.runTarget({
        contract: proxyTokenTransfer,
        method: 'setConfiguration',
        params: {
            _config: {
                tonConfiguration: user.address,
                ethereumConfigurations: [
                    user.address
                ],
                tokenRoot: root.address,
                settingsDeployWalletGrams: convertCrystal(0.5, 'nano'),
                settingsTransferGrams: convertCrystal(0.5, 'nano')
            }
        }
    });

    // - Setup proxy token transfer token wallet
    const proxyTokenWalletAddress = await proxyTokenTransfer.call({
        method: 'token_wallet',
    });

    const proxyTokenWallet = await locklift.factory.getContract(
        'TONTokenWallet',
        './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
    );
    proxyTokenWallet.setAddress(proxyTokenWalletAddress);

    logger.log(`Proxy token wallet address: ${proxyTokenWallet.address}`);

    await locklift.ton.client.net.wait_for_collection({
        collection: 'accounts',
        filter: {
            id: { eq: proxyTokenWallet.address },
            balance: { gt: `0x0` }
        },
        result: 'balance'
    });

    // Finish setup
    // - Transfer root ownership to tunnel
    await root.run({
        method: 'transferOwner',
        params: {
            root_public_key_: 0,
            root_owner_address_: tunnel.address,
        },
        keyPair,
    });

    // - Add vault to tunnel sources
    await user.runTarget({
        contract: tunnel,
        method: '__updateTunnel',
        params: {
          source: vault.address,
          destination: root.address,
        }
    });

    // - Drain vault
    if (locklift.network === 'dev') await sleep(40000);

    await user.runTarget({
        contract: vault,
        method: 'drain',
        params: {
            receiver: user.address,
        },
    });


    return [vault, tunnel, user, root, userTokenWallet, vaultTokenWallet, proxyTokenTransfer, proxyTokenWallet];
};


const getWTONMetrics = async function(
    userTokenWallet,
    user,
    vaultTokenWallet,
    vault,
    root,
) {
    return {
        userWTONBalance: userTokenWallet ? (await userTokenWallet.call({ method: 'balance' })) : 0,
        userTONBalance: user ? (await locklift.ton.getBalance(user.address)) : 0,
        vaultWTONBalance: vaultTokenWallet ? (await vaultTokenWallet.call({ method: 'balance' })) : 0,
        vaultTONBalance: vault ? (await locklift.ton.getBalance(vault.address)) : 0,
        vaultTotalWrapped: vault ? (await vault.call({ method: 'total_wrapped' })) : 0,
        wTONTotalSupply: root ? (await root.call({ method: 'getTotalSupply' })) : 0,
    };
};



const getMetricsChange = function(initial, final) {
    return {
        userWTONBalance: convertCrystal(final.userWTONBalance - initial.userWTONBalance, 'ton').toNumber(),
        userTONBalance: convertCrystal(final.userTONBalance - initial.userTONBalance, 'ton').toNumber(),
        vaultWTONBalance: convertCrystal(final.vaultWTONBalance - initial.vaultWTONBalance, 'ton').toNumber(),
        vaultTONBalance: convertCrystal(final.vaultTONBalance - initial.vaultTONBalance, 'ton').toNumber(),
        vaultTotalWrapped: convertCrystal(final.vaultTotalWrapped - initial.vaultTotalWrapped, 'ton').toNumber(),
        wTONTotalSupply: convertCrystal(final.wTONTotalSupply - initial.wTONTotalSupply, 'ton').toNumber(),
    }
};


const logMetricsChange = function(change) {
    logger.log(`User wTON balance change: ${change.userWTONBalance}`);
    logger.log(`User TON balance change: ${change.userTONBalance}`);
    logger.log(`Vault wTON balance change: ${change.vaultWTONBalance}`);
    logger.log(`Vault TON balance change: ${change.vaultTONBalance}`);
    logger.log(`Vault total wrapped change: ${change.vaultTotalWrapped}`);
    logger.log(`wTON total supply change: ${change.wTONTotalSupply}`);
};


const logGiverBalance = async function() {
    const giverBalance = await locklift.ton.getBalance(locklift.networkConfig.giver.address);

    logger.log(`Giver balance: ${convertCrystal(giverBalance, 'ton')}`);

    return giverBalance;
};


module.exports = {
    expect,
    setupWton,
    getWTONMetrics,
    getMetricsChange,
    logMetricsChange,
    logGiverBalance,
    afterRun,
    stringToBytesArray,
};
