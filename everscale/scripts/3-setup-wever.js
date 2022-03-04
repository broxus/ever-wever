const prompts = require('prompts');
const ora = require('ora');
const logger = require("mocha-logger");


const utils = require('../test/utils');


async function main() {
    const _randomNonce = locklift.utils.getRandomNonce();
    const [keyPair] = await locklift.keys.getKeyPairs();

    const response = await prompts([
        {
            type: 'text',
            name: 'owner',
            message: 'WEVER owner (owns tunnel, vault and proxy)',
            validate: value => utils.isValidTonAddress(value) ? true : 'Invalid address'
        },
        {
            type: 'text',
            name: 'root',
            message: 'WEVER Root',
            validate: value => utils.isValidTonAddress(value) ? true : 'Invalid address'
        },
    ]);


    const spinner = ora('Deploying temporary owner').start();

    const Account = await locklift.factory.getAccount('Wallet');

    const user = await locklift.giver.deployContract({
        contract: Account,
        constructorParams: {},
        initParams: {
            _randomNonce,
        },
        keyPair,
    }, locklift.utils.convertCrystal(30, 'nano'));

    user.afterRun = utils.afterRun;
    user.setKeyPair(keyPair);

    spinner.stop();

    logger.success(`User address: ${user.address}`);

    spinner.start('Deploying proxy token transfer');

    const ProxyTokenTransfer = await locklift.factory.getContract('ProxyTokenTransfer');
    const proxyTokenTransfer = await locklift.giver.deployContract({
        contract: ProxyTokenTransfer,
        constructorParams: {
            owner_: response.owner,
        },
        initParams: {
            _randomNonce,
        },
        keyPair,
    });

    spinner.stop();

    logger.success(`Proxy token transfer: ${proxyTokenTransfer.address}`);

    spinner.start('Deploying tunnel');

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
    }, locklift.utils.convertCrystal(5, 'nano'));

    spinner.stop();

    logger.success(`Tunnel address: ${tunnel.address}`);

    spinner.start('Deploying vault');

    const Vault = await locklift.factory.getContract('Vault');
    const vault = await locklift.giver.deployContract({
        contract: Vault,
        constructorParams: {
            owner_: user.address,
            root_tunnel: tunnel.address,
            root: response.root,
            receive_safe_fee: locklift.utils.convertCrystal(1, 'nano'),
            settings_deploy_wallet_grams: locklift.utils.convertCrystal(0.2, 'nano'),
            initial_balance: locklift.utils.convertCrystal(1, 'nano')
        },
        initParams: {
            _randomNonce,
        },
        keyPair,
    });

    spinner.stop();

    logger.success(`Vault address: ${vault.address}`);

    spinner.start('Adding (vault,root) destination to Tunnel');
    const updateTunnelTx = await user.runTarget({
        contract: tunnel,
        method: '__updateTunnel',
        params: {
            source: vault.address,
            destination: response.root,
        }
    });
    spinner.stop();
    logger.log(`Add (vault,root) tunnel tx: ${updateTunnelTx.transaction.id}`);

    spinner.start('Draining Vault');
    const drainTx = await user.runTarget({
        contract: vault,
        method: 'drain',
        params: {
            receiver: user.address,
        },
    });
    spinner.stop();
    logger.log(`Drain Vault tx: ${drainTx.transaction.id}`);

    spinner.start('Transferring Vault ownership');
    const vaultTransferOwnershipTx = await user.runTarget({
        contract: vault,
        method: 'transferOwnership',
        params: {
            newOwner: response.owner,
        },
    });
    spinner.stop();
    logger.log(`Vault transfer ownership tx: ${vaultTransferOwnershipTx.transaction.id}`);

    spinner.start('Transferring Tunnel ownership');
    const tunnelTransferOwnershipTx = await user.runTarget({
        contract: tunnel,
        method: 'transferOwnership',
        params: {
            newOwner: response.owner,
        },
    });
    spinner.stop();
    logger.log(`Tunnel transfer ownership tx: ${tunnelTransferOwnershipTx.transaction.id}`);

    logger.success('Dont forget to transfer root ownership to Tunnel!');
}


main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });
