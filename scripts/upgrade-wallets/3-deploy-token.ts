import logger from 'mocha-logger';
import {Address, getRandomNonce, zeroAddress} from "locklift";

const main = async () => {
    const signer = await locklift.keystore.getSigner("0");

    const tokenWallet = await locklift.factory.getContractArtifacts('TokenWalletUpgradeable');
    const tokenWalletPlatform = await locklift.factory.getContractArtifacts('TokenWalletPlatform');

    const OWNER = '0:1bd84004df384f44018d649e56e8f7d524b02dd9367e3197cb1f4c1ba890462d';

    const {
        contract: root
    } = await locklift.factory.deployContract({
        contract: 'TokenRootUpgradeable',
        constructorParams: {
            initialSupplyTo: zeroAddress,
            initialSupply: 0,
            deployWalletValue: 0,
            mintDisabled: false,
            burnByRootDisabled: false,
            burnPaused: false,
            remainingGasTo: new Address(OWNER)
        },
        initParams: {
            name_: "Wrapped VENOM",
            symbol_: "WVENOM",
            decimals_: 9,
            rootOwner_: new Address(OWNER),
            deployer_: zeroAddress,
            randomNonce_: getRandomNonce(),
            walletCode_: tokenWallet.code,
            platformCode_: tokenWalletPlatform.code
        },
        publicKey: signer.publicKey,
        value: locklift.utils.toNano('15')
    });

    logger.log(`Root (to be upgraded): ${root.address}`);
}


main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });
