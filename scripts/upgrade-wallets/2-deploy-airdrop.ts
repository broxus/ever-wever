import {Address, getRandomNonce, toNano} from "locklift";
const logger = require("mocha-logger");


const main = async () => {
    const OWNER = '0:cfcf66505259c0221924bb3ab3759e9e5d9d532f66eb851efd4d0f135237a020';
    const ROOT = '0:1795caddede4217bbfb332e387482ad24a32e86a6086e185b165f46e2823fd61';

    const signer = await locklift.keystore.getSigner("0");

    const {
        contract: airdrop
    } = await locklift.factory.deployContract({
            contract: 'Airdrop',
            constructorParams: {
                owner_: new Address(OWNER),
                root_: new Address(ROOT),
                wallets_: 100_000,
                airdrop_amount_: toNano('0.001')
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

