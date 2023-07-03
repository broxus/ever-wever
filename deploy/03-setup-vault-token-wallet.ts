import {toNano} from "locklift";
import {getTokenWalletAddress} from "../test/utils";
import {VaultTokenRoot_V1Abi} from "../build/factorySource";

export default async () => {
    const vault = await locklift.deployments.getContract<VaultTokenRoot_V1Abi>('Vault');

    const vaultTokenWalletAddress = await getTokenWalletAddress(vault, vault.address);

    await locklift.deployments.saveContract({
        deploymentName: 'VaultTokenWallet',
        contractName: 'TokenWalletUpgradeable',
        address: vaultTokenWalletAddress
    }, true);
}

export const tag = 'Setup_Vault_Token_Wallet'
