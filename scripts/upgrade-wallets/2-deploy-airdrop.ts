import {Address, getRandomNonce, toNano} from "locklift";
const logger = require("mocha-logger");


const main = async () => {
    const OWNER = '0:726f7f17c000a0c549ac60c0d16858638cc4e77705cd3c46c689e0ba1699e9cd';
    const signer = await locklift.keystore.getSigner("0");

    const {
        contract: airdrop
    } = await locklift.factory.deployContract({
            contract: 'Airdrop',
            constructorParams: {
                owner_: new Address(OWNER),
                root_: new Address('0:ad395ed2838ccba439a078f0c05a7327fb558daf9cc045688fd206f3da422bb1'),
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

