import {toNano} from "locklift";
import {getTokenWalletAddress} from "../test/utils";
import {VaultAbi} from "../build/factorySource";

export default async () => {
    const vault = await locklift.deployments.getContract<VaultAbi>('Vault');

    const vaultTokenWalletAddress = await vault.methods
        .token_wallet()
        .call()
        .then(res => res.token_wallet);

    await locklift.deployments.saveContract({
        deploymentName: 'VaultTokenWallet',
        contractName: 'TokenWalletUpgradeable',
        address: vaultTokenWalletAddress
    }, true);
}

export const tag = 'Setup_Vault_Token_Wallet'
