import {getRandomNonce, toNano, zeroAddress} from "locklift";
import {VaultAbi, VaultTokenRoot_V1Abi, TunnelAbi} from "../build/factorySource";

export default async () => {
    const keyPair = (await locklift.keystore.getSigner("0"))!;

    const owner = await locklift.deployments.getAccount('VaultOwner');
    const root = await locklift.deployments.getContract<VaultTokenRoot_V1Abi>('Vault');
    const legacyVault = await locklift.deployments.getContract<VaultAbi>('LegacyVault');
    const tunnel = await locklift.deployments.getContract<TunnelAbi>('Tunnel');



    const contract = await locklift.deployments.deploy({
        deployConfig: {
            contract: "TestMinterBurner",
            constructorParams: {
               root_: root.address,
               vault_: legacyVault.address
            },
            value: toNano(15),
            initParams: {  
                _randomNonce: getRandomNonce(),
            },
            publicKey: keyPair.publicKey,
        },
        deploymentName: 'TestMinterBurner',
        enableLogs: true
    });

    let tw = await contract.contract.methods.wallet().call().then(v => v.wallet);

    await locklift.deployments.saveContract({
        deploymentName: "MinterBurnerTokenWallet", 
        contractName: "VaultTokenWallet_V1", 
        address: tw
    });

    // await tunnel.methods.__updateTunnel({
    //     source: contract.contract.address, 
    //     destination: contract.contract.address
    // }).send({
    //     from: owner.account.address,
    //     amount: toNano(1)
    // });
}


export const tag = 'Deploy_Test_Minter_Burner';
