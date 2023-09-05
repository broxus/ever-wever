import {toNano} from "locklift";
import {getTokenWalletAddress} from "../test/utils";
import {VaultTokenRoot_V1Abi} from "../build/factorySource";

export default async () => {
    const root = await locklift.deployments.getContract<VaultTokenRoot_V1Abi>('VaultRoot');

    const vaultRootWalletAddress = await getTokenWalletAddress(root, root.address);

    await locklift.deployments.saveContract({
        deploymentName: 'VaultRootRootTokenWallet',
        contractName: 'VaultTokenWallet_V1',
        address: vaultRootWalletAddress
    }, true);
}

export const tag = 'Setup_Vault_Root_Wallet'
