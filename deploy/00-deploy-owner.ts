import {WalletTypes} from "locklift";

export default async () => {
    await locklift.deployments.deployAccounts(
        [
            {
                deploymentName: "Owner",
                signerId: "0",
                accountSettings: {
                    type: WalletTypes.EverWallet,
                    value: locklift.utils.toNano(1000),
                },
            },
        ],
        true // enableLogs
    );
}


export const tag = 'Deploy_Owner';
