const logger = require("mocha-logger");

const BigNumber = require('bignumber.js');

const chai = require('chai');
chai.use(require('chai-bignumber')());

const { expect } = chai;

const TOKEN_PATH = '../node_modules/ton-eth-bridge-token-contracts/build';

const EMPTY_TVM_CELL = 'te6ccgEBAQEAAgAAAA==';

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


const getTokenWalletAddress = async function(_root, user) {
    return _root.call({
        method: 'walletOf',
        params: { walletOwner: user }
    });
}


const waitForAddressToBeActive = async (contract) => {
    return locklift.ton.client.net.wait_for_collection({
        collection: 'accounts',
        filter: {
            id: { eq: contract },
            balance: { gt: `0x0` }
        },
        result: 'balance'
    });
}



const setupWever = async () => {
    const [keyPair] = await locklift.keys.getKeyPairs();
    const _randomNonce = locklift.utils.getRandomNonce();

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
    }, locklift.utils.convertCrystal(30, 'nano'));

    user.afterRun = afterRun;
    user.setKeyPair(keyPair);

    logger.log(`User address: ${user.address}`);


    // Wrapped EVER token
    // - Deploy wEVER root
    const RootToken = await locklift.factory.getContract('TokenRoot', TOKEN_PATH);
    const TokenWallet = await locklift.factory.getContract('TokenWallet', TOKEN_PATH);

    const root = await locklift.giver.deployContract({
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

    logger.log(`Root address: ${root.address}`);

    // - Deploy user token wallet
    const tx = await user.runTarget({
        contract: root,
        method: 'deployWallet',
        params: {
            walletOwner: user.address,
            deployWalletValue: locklift.utils.convertCrystal(2, 'nano'),
        },
        value: locklift.utils.convertCrystal(5, 'nano'),
    });

    const userTokenWalletAddress = await getTokenWalletAddress(root, user.address);

    // // Wait until user token wallet is presented into the GraphQL
    // await waitForAddressToBeActive(userTokenWalletAddress.address);

    logger.log(`User token wallet: ${userTokenWalletAddress}`);

    const userTokenWallet = await locklift.factory.getContract('TokenWallet', TOKEN_PATH);

    userTokenWallet.setAddress(userTokenWalletAddress);
    userTokenWallet.name = 'User token wallet';

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
    const Vault = await locklift.factory.getContract('Vault');

    const vault = await locklift.giver.deployContract({
        contract: Vault,
        constructorParams: {
            owner_: user.address,
            root_tunnel: tunnel.address,
            root: root.address,
            receive_safe_fee: locklift.utils.convertCrystal(1, 'nano'),
            settings_deploy_wallet_grams: locklift.utils.convertCrystal(0.05, 'nano'),
            initial_balance: locklift.utils.convertCrystal(1, 'nano')
        },
        initParams: {
            _randomNonce,
        },
        keyPair,
    });

    vault.afterRun = afterRun;

    logger.log(`Vault address: ${vault.address}`);

    // Wait until user token wallet is presented into the GraphQL
    await waitForAddressToBeActive(vault.address);

    // - Setup vault token wallet
    const vaultTokenWalletAddress = await vault.call({
        method: 'token_wallet',
    });

    const vaultTokenWallet = await locklift.factory.getContract('TokenWallet', TOKEN_PATH);
    vaultTokenWallet.setAddress(vaultTokenWalletAddress);
    vaultTokenWallet.name = 'Vault token wallet';

    logger.log(`Vault token wallet address: ${vaultTokenWallet.address}`);

    await waitForAddressToBeActive(vaultTokenWallet.address);

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

    await waitForAddressToBeActive(proxyTokenTransfer.address);

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
                root: root.address,
                settingsDeployWalletGrams: locklift.utils.convertCrystal(0.5, 'nano'),
                settingsTransferGrams: locklift.utils.convertCrystal(0.5, 'nano')
            }
        }
    });

    // - Setup proxy token transfer token wallet
    const proxyTokenWalletAddress = await proxyTokenTransfer.call({
        method: 'token_wallet',
    });

    const proxyTokenWallet = await locklift.factory.getContract('TokenWallet', TOKEN_PATH);
    proxyTokenWallet.setAddress(proxyTokenWalletAddress);
    proxyTokenWallet.name = 'Proxy token wallet';

    logger.log(`Proxy token wallet address: ${proxyTokenWallet.address}`);

    // await waitForAddressToBeActive(proxyTokenWallet.address);

    // Finish setup
    // - Transfer root ownership to tunnel
    await user.runTarget({
        contract: root,
        method: 'transferOwnership',
        params: {
            newOwner: tunnel.address,
            remainingGasTo: user.address,
            callbacks: {}
        },
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


const getVaultMetrics = async function(
    userTokenWallet,
    user,
    vaultTokenWallet,
    vault,
    root,
) {
    return {
        userWEVERBalance: userTokenWallet ? (await userTokenWallet.call({ method: 'balance' })) : 0,
        userEVERBalance: user ? (await locklift.ton.getBalance(user.address)) : 0,
        vaultWEVERBalance: vaultTokenWallet ? (await vaultTokenWallet.call({ method: 'balance' })) : 0,
        vaultEVERBalance: vault ? (await locklift.ton.getBalance(vault.address)) : 0,
        vaultTotalWrapped: vault ? (await vault.call({ method: 'total_wrapped' })) : 0,
        WEVERTotalSupply: root ? (await root.call({ method: 'totalSupply' })) : 0,
    };
};



const getMetricsChange = function(initial, final) {
    return {
        userWEVERBalance: locklift.utils.convertCrystal(final.userWEVERBalance - initial.userWEVERBalance, 'ton').toNumber(),
        userEVERBalance: locklift.utils.convertCrystal(final.userEVERBalance - initial.userEVERBalance, 'ton').toNumber(),
        vaultWEVERBalance: locklift.utils.convertCrystal(final.vaultWEVERBalance - initial.vaultWEVERBalance, 'ton').toNumber(),
        vaultEVERBalance: locklift.utils.convertCrystal(final.vaultEVERBalance - initial.vaultEVERBalance, 'ton').toNumber(),
        vaultTotalWrapped: locklift.utils.convertCrystal(final.vaultTotalWrapped - initial.vaultTotalWrapped, 'ton').toNumber(),
        WEVERTotalSupply: locklift.utils.convertCrystal(final.WEVERTotalSupply - initial.WEVERTotalSupply, 'ton').toNumber(),
    }
};


const logMetricsChange = function(change) {
    logger.log(`User wEVER balance change: ${change.userWEVERBalance}`);
    logger.log(`User EVER balance change: ${change.userEVERBalance}`);
    logger.log(`Vault wEVER balance change: ${change.vaultWEVERBalance}`);
    logger.log(`Vault EVER balance change: ${change.vaultEVERBalance}`);
    logger.log(`Vault total wrapped change: ${change.vaultTotalWrapped}`);
    logger.log(`wEVER total supply change: ${change.WEVERTotalSupply}`);
};


const logGiverBalance = async function() {
    const giverBalance = await locklift.ton.getBalance(locklift.networkConfig.giver.address);

    logger.log(`Giver balance: ${locklift.utils.convertCrystal(giverBalance, 'ton')}`);

    return giverBalance;
};


const isValidTonAddress = (address) => /^(?:-1|0):[0-9a-fA-F]{64}$/.test(address);


module.exports = {
    expect,
    setupWever,
    getVaultMetrics,
    getMetricsChange,
    logMetricsChange,
    logGiverBalance,
    afterRun,
    stringToBytesArray,
    getTokenWalletAddress,
    TOKEN_PATH,
    EMPTY_TVM_CELL,
    isValidTonAddress
};
