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
            message: 'Proxy owner',
            validate: value => utils.isValidTonAddress(value) ? true : 'Invalid address'
        }
    ]);

    const ProxyTokenTransfer = await locklift.factory.getContract('ProxyTokenTransfer');

    const spinner = ora('Deploying proxy token transfer').start();

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
}


main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });
