import {toNano, WalletTypes} from "locklift";
import {VaultAbi} from "../build/factorySource";

export default async () => {
    await locklift.deployments.deployAccounts([
            {
                deploymentName: "Guardian",
                signerId: "0",
                accountSettings: {
                    type: WalletTypes.EverWallet,
                    value: locklift.utils.toNano(30),
                },
            },
        ],
        true // enableLogs
    );

    const {
        account: owner
    } = await locklift.deployments.getAccount('VaultOwner');

    const {
        account: guardian
    } = await locklift.deployments.getAccount('Guardian');

    const vault = await locklift.deployments.getContract<VaultAbi>('Vault');

    await vault.methods
        .setGuardian({
            _guardian: guardian.address
        })
        .send({
            from: owner.address,
            amount: toNano(1),
        });
}


export const tag = 'Setup_Guardian';
