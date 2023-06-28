import {toNano} from "locklift";
import {getTokenWalletAddress} from "../test/utils";
import {VaultAbi} from "../build/factorySource";

export default async () => {
    const {
        account: owner
    } = await locklift.deployments.getAccount('VaultOwner');

    const vault = await locklift.deployments.getContract<VaultAbi>('Vault');

    await vault.methods
        .deployWallet({
            walletOwner: owner.address,
            deployWalletValue: toNano(2),
            answerId: 0,
        })
        .send({
            from: owner.address,
            amount: toNano(5),
        });

    const ownerTokenWalletAddress = await getTokenWalletAddress(vault, owner.address);

    await locklift.deployments.saveContract({
        deploymentName: 'OwnerTokenWallet',
        contractName: 'TokenWalletUpgradeable',
        address: ownerTokenWalletAddress
    }, true);
}

export const tag = 'Deploy_Owner_Token_Wallet';
