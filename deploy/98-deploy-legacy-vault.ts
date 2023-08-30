import {getRandomNonce, toNano, zeroAddress} from "locklift";
import {VaultAbi, VaultTokenRoot_V1Abi, TunnelAbi} from "../build/factorySource";

export default async () => {
    const keyPair = (await locklift.keystore.getSigner("0"))!;

    const { code: vaultCode } = locklift.factory.getContractArtifacts("Vault");
    const { code: tokenWalletPlatformCode } = locklift.factory.getContractArtifacts("TokenWalletPlatform");

    const owner = await locklift.deployments.getAccount('VaultOwner');
    const root = await locklift.deployments.getContract<VaultTokenRoot_V1Abi>('Vault');
    const tunnel = await locklift.deployments.getContract<TunnelAbi>('Tunnel');

    let vault = await locklift.deployments.deploy({
        deployConfig: {
            contract: "Vault",
            constructorParams: {
                owner_: owner.account.address, 
                root_tunnel: tunnel.address, 
                root: root.address, 
                receive_safe_fee: toNano(0.1), 
                settings_deploy_wallet_grams: toNano(0.1), 
                initial_balance: toNano(1)
            },
            value: toNano(15),
            initParams: {  
                _randomNonce: getRandomNonce(),
            },
            publicKey: keyPair.publicKey,
        },
        deploymentName: 'LegacyVault',
        enableLogs: true
    });

    await tunnel.methods.__updateTunnel({
        source: vault.contract.address, 
        destination: root.address
    }).send({
        from: owner.account.address,
        amount: toNano(1)
    });

    let legacyVaultTokenWallet = await vault.contract.methods.token_wallet().call().then(a => a.token_wallet);

    await locklift.deployments.saveContract({
        deploymentName: "LegacyVaultTokenWallet", 
        contractName: "VaultTokenWallet_V1", 
        address: legacyVaultTokenWallet
    });

    await vault.contract.methods
        .grant({amount: toNano(2)})
        .send({
            from: owner.account.address,
            amount: toNano(1),
        });

    
}


export const tag = 'Deploy_Legacy_Vault';
