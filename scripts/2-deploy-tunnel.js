const logger = require("mocha-logger");
const prompts = require("prompts");
const ora = require("ora");
const { isValidEverAddress } = require("locklift/utils");
const { Address, getRandomNonce, toNano } = require("locklift");

const main = async () => {
    const signer = await locklift.keystore.getSigner("0");

    const response = await prompts([
        {
            type: 'text',
            name: 'owner',
            message: 'Tunnel owner',
            validate: value => isValidEverAddress(value) ? true : 'Invalid address'
        }
    ]);

    const spinner = ora('Deploying tunnel').start();

    const {
        contract
    } = await locklift.factory.deployContract({
        contract: 'Tunnel',
        constructorParams: {
            sources: [],
            destinations: [],
            owner_: new Address(response.owner),
        },
        initParams: {
            _randomNonce: getRandomNonce()
        },
        publicKey: signer.publicKey,
        value: toNano(10)
    });

    spinner.stop();

    logger.success(`Tunnel address: ${contract.address}`);
}


main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });
