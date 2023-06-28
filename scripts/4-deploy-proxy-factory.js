const {
    logContract
} = require("../test/utils");
const ora = require("ora");
const logger = require("mocha-logger");


async function main() {
    const _randomNonce = locklift.utils.getRandomNonce();

    const spinner = ora();

    // Proxy token transfer factory
    const ProxyTokenTransferFactory = await locklift.factory.getContract('ProxyTokenTransferFactory');
    const ProxyTokenTransfer = await locklift.factory.getContract('ProxyTokenTransfer');

    spinner.start('Deploying proxy token transfer factory');

    const proxyTokenTransferFactory = await locklift.giver.deployContract({
        contract: ProxyTokenTransferFactory,
        constructorParams: {
            _proxyCode: ProxyTokenTransfer.code
        },
        initParams: {
            _randomNonce,
        },
    });

    spinner.stop();

    await logger.success(`Proxy token transfer factory: ${proxyTokenTransferFactory.address}`);
}


main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });
