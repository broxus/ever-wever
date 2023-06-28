const logger = require("mocha-logger");
const prompts = require("prompts");
const utils = require("../test/utils");
const ora = require("ora");

async function main() {
    const _randomNonce = locklift.utils.getRandomNonce();
    const [keyPair] = await locklift.keys.getKeyPairs();

    const response = await prompts([
        {
            type: 'text',
            name: 'owner',
            message: 'Vault owner',
            validate: value => utils.isValidTonAddress(value) ? true : 'Invalid address'
        },
        {
            type: 'text',
            name: 'tunnel',
            message: 'Vault tunnel',
            validate: value => utils.isValidTonAddress(value) ? true : 'Invalid address'
        },
        {
            type: 'text',
            name: 'root',
            message: 'Vault root',
            validate: value => utils.isValidTonAddress(value) ? true : 'Invalid address'
        },
    ]);

    const Vault = await locklift.factory.getContract('Vault');

    const spinner = ora('Deploying vault').start();

    const vault = await locklift.giver.deployContract({
        contract: Vault,
        constructorParams: {
            owner_: response.owner,
            root_tunnel: response.tunnel,
            root: response.root,
            receive_safe_fee: locklift.utils.convertCrystal(1, 'nano'),
            settings_deploy_wallet_grams: locklift.utils.convertCrystal(0.05, 'nano'),
            initial_balance: locklift.utils.convertCrystal(1, 'nano')
        },
        initParams: {
            _randomNonce,
        },
        keyPair,
    });

    spinner.stop();

    logger.log(`Vault address: ${vault.address}`);
}


main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });
