import {Address, getRandomNonce, toNano} from "locklift";
const logger = require("mocha-logger");


const main = async () => {
    const OWNER = '0:cfcf66505259c0221924bb3ab3759e9e5d9d532f66eb851efd4d0f135237a020';
    const signer = await locklift.keystore.getSigner("0");

    const {
        contract: airdrop
    } = await locklift.factory.deployContract({
            contract: 'Airdrop',
            constructorParams: {
                owner_: new Address(OWNER),
                root_: new Address('0:0e789072e63c46cec521f9853a4f7bbb1ee9197005c8fa6d1e04a0b3ab7c2de4'),
                wallets_: 1000,
                airdrop_amount_: toNano('1')
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

