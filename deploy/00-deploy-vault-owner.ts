import {WalletTypes} from "locklift";

export default async () => {
    await locklift.deployments.deployAccounts([
            {
                deploymentName: "VaultOwner",
                signerId: "0",
                accountSettings: {
                    type: WalletTypes.EverWallet,
                    value: locklift.utils.toNano(30),
                },
            },
        ],
        true // enableLogs
    );
}


export const tag = 'Deploy_Vault_Owner';
