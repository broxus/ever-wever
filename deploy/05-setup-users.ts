import {toNano, WalletTypes} from "locklift";
import {VaultAbi} from "../build/factorySource";
import {getTokenWalletAddress} from "../test/utils";


const setupUser = async (name: string, signerId: string) => {
    await locklift.deployments.deployAccounts([
            {
                deploymentName: name,
                signerId,
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
    } = await locklift.deployments.getAccount(name);

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
        deploymentName: `${name}TokenWallet`,
        contractName: 'TokenWalletUpgradeable',
        address: userTokenWalletAddress
    }, true);
}


export default async () => {
    await setupUser('Alice', "10");
    await setupUser('Bob', "11");
}


export const tag = 'Setup_Users';
