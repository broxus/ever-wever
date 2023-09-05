import {toNano} from "locklift";
import {getTokenWalletAddress} from "../test/utils";
import {VaultAbi, VaultTokenRoot_V1Abi} from "../build/factorySource";

export default async () => {
    const {
        account: owner
    } = await locklift.deployments.getAccount('VaultOwner');

    const root = await locklift.deployments.getContract<VaultTokenRoot_V1Abi>('VaultRoot');

    await root.methods
        .deployWallet({
            walletOwner: owner.address,
            deployWalletValue: toNano(2),
            answerId: 0,
        })
        .send({
            from: owner.address,
            amount: toNano(5),
        });

    const ownerTokenWalletAddress = await getTokenWalletAddress(root, owner.address);

    await locklift.deployments.saveContract({
        deploymentName: 'VaultRootOwnerTokenWallet',
        contractName: 'VaultTokenWallet_V1',
        address: ownerTokenWalletAddress
    }, true);
}

export const tag = 'Deploy_Owner_Vault_Root_Wallet';
