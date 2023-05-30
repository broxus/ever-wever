import {getRandomNonce, toNano, zeroAddress} from "locklift";

export default async () => {
    const keyPair = (await locklift.keystore.getSigner("0"))!;

    const { code: tokenWalletCode } = locklift.factory.getContractArtifacts("TokenWalletUpgradeable");
    const { code: tokenWalletPlatformCode } = locklift.factory.getContractArtifacts("TokenWalletPlatform");

    const owner = await locklift.deployments.getAccount('VaultOwner');

    await locklift.deployments.deploy({
        deployConfig: {
            contract: "Vault",
            constructorParams: {
                owner_: owner.account.address,
            },
            value: toNano(2),
            initParams: {
                deployer_: zeroAddress,
                randomNonce_: getRandomNonce(),
                rootOwner_: owner.account.address,
                name_: "Wrapped EVER",
                symbol_: "WEVER",
                decimals_: 9,
                walletCode_: tokenWalletCode,
                platformCode_: tokenWalletPlatformCode
            },
            publicKey: keyPair.publicKey,
        },
        deploymentName: 'Vault',
        enableLogs: true
    });
}


export const tag = 'Deploy_Vault';
