import {Address, getRandomNonce, toNano} from "locklift";
const logger = require("mocha-logger");


const main = async () => {
    const OWNER = '0:1bd84004df384f44018d649e56e8f7d524b02dd9367e3197cb1f4c1ba890462d';
    const ROOT = '0:ef9454582730631bf7c6cd2e47baefdba84437f96a0dfaa4ab312f989c879063';

    const signer = await locklift.keystore.getSigner("0");

    const {
        contract: airdrop
    } = await locklift.factory.deployContract({
            contract: 'Airdrop',
            constructorParams: {
                owner_: new Address(OWNER),
                root_: new Address(ROOT),
                wallets_: 30_000,
                airdrop_amount_: toNano('0.0000001')
            },
            initParams: {
                _randomNonce: getRandomNonce()
            },
            publicKey: signer?.publicKey,
            value: toNano('1'),
        });

    logger.log(`Airdrop: ${airdrop.address}`);
}


main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });

