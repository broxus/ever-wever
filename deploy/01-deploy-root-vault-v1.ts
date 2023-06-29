import {getRandomNonce, toNano, zeroAddress} from "locklift";
import {VaultAbi} from "../build/factorySource";

export default async () => {
    const keyPair = (await locklift.keystore.getSigner("0"))!;

    const { code: tokenWalletCode } = locklift.factory.getContractArtifacts("VaultTokenWallet_V1");
    const { code: tokenWalletPlatformCode } = locklift.factory.getContractArtifacts("TokenWalletPlatform");

    const owner = await locklift.deployments.getAccount('VaultOwner');

    await locklift.deployments.deploy({
        deployConfig: {
            contract: "VaultTokenRoot_V1",
            constructorParams: {},
            value: toNano(15),
            initParams: {
                name_: "Wrapped EVER",
                symbol_: "WEVER",
                decimals_: 9,
                rootOwner_: owner.account.address,
                deployer_: zeroAddress,
                randomNonce_: getRandomNonce(),
                walletCode_: tokenWalletCode,
                platformCode_: tokenWalletPlatformCode
            },
            publicKey: keyPair.publicKey,
        },
        deploymentName: 'Vault',
        enableLogs: true
    });

    const vault = await locklift.deployments.getContract<VaultAbi>('Vault');

    await vault.methods
        .drain({
            receiver: owner.account.address
        })
        .send({
            from: owner.account.address,
            amount: toNano(1),
        });
}


export const tag = 'Deploy_Vault';
