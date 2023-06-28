import {toNano, WalletTypes} from "locklift";
import {VaultAbi} from "../build/factorySource";
import {getTokenWalletAddress} from "../test/utils";


export default async () => {
    await locklift.deployments.deployAccounts([
            {
                deploymentName: "User",
                signerId: "0",
                accountSettings: {
                    type: WalletTypes.EverWallet,
                    value: locklift.utils.toNano(100),
                },
            },
        ],
        true // enableLogs
    );

    const {
        account: user
    } = await locklift.deployments.getAccount('User');

    const vault = await locklift.deployments.getContract<VaultAbi>('Vault');

    await vault.methods
        .deployWallet({
            walletOwner: user.address,
            deployWalletValue: toNano(2),
            answerId: 0,
        })
        .send({
            from: user.address,
            amount: toNano(5),
        });

    const userTokenWalletAddress = await getTokenWalletAddress(vault, user.address);

    await locklift.deployments.saveContract({
        deploymentName: 'UserTokenWallet',
        contractName: 'TokenWalletUpgradeable',
        address: userTokenWalletAddress
    }, true);

}


export const tag = 'Setup_User';
