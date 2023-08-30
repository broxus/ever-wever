import {getRandomNonce, toNano, zeroAddress} from "locklift";
import {VaultAbi, VaultTokenRoot_V1Abi} from "../build/factorySource";

export default async () => {
    const keyPair = (await locklift.keystore.getSigner("0"))!;

    const { code: tunnelCode } = locklift.factory.getContractArtifacts("Tunnel");
    const { code: tokenWalletPlatformCode } = locklift.factory.getContractArtifacts("TokenWalletPlatform");

    const owner = await locklift.deployments.getAccount('VaultOwner');
    const root = await locklift.deployments.getContract<VaultTokenRoot_V1Abi>('Vault');
    

    const tunnel = await locklift.deployments.deploy({
        deployConfig: {
            contract: "Tunnel",
            constructorParams: {sources: [owner.account.address], destinations: [owner.account.address], owner_: owner.account.address},
            value: toNano(15),
            initParams: {  
                _randomNonce: getRandomNonce(),
            },
            publicKey: keyPair.publicKey,
        },
        deploymentName: 'Tunnel',
        enableLogs: true
    });

    await root.methods.transferOwnership({
        newOwner: tunnel.contract.address, 
        remainingGasTo: owner.account.address, 
        callbacks: []
    }).send({from: owner.account.address, amount: toNano(2)});
    


    
}


export const tag = 'Deploy_Tunnel';
