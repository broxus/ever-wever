const logger = require("mocha-logger");
const prompts = require("prompts");
const utils = require("../test/utils");
const ora = require("ora");

async function main() {
    const [keyPair] = await locklift.keys.getKeyPairs();

    const response = await prompts([
        {
            type: 'text',
            name: 'owner',
            message: 'Tunnel owner',
            validate: value => utils.isValidTonAddress(value) ? true : 'Invalid address'
        }
    ]);

    const Tunnel = await locklift.factory.getContract('Tunnel');

    const spinner = ora('Deploying tunnel').start();

    const tunnel = await locklift.giver.deployContract({
        contract: Tunnel,
        constructorParams: {
            sources: [],
            destinations: [],
            owner_: response.owner,
        },
        initParams: {
            _randomNonce: locklift.utils.getRandomNonce(),
        },
        keyPair,
    }, locklift.utils.convertCrystal(5, 'nano'));

    spinner.stop();

    logger.success(`Tunnel address: ${tunnel.address}`);
}


main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });
