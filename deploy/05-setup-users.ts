import {toNano, WalletTypes} from "locklift";
import {VaultAbi, VaultTokenRoot_V1Abi} from "../build/factorySource";
import {getTokenWalletAddress} from "../test/utils";


const setupUser = async (name: string, signerId: string) => {
    await locklift.deployments.deployAccounts([
            {
                deploymentName: name,
                signerId,
                accountSettings: {
                    type: WalletTypes.EverWallet,
                    value: locklift.utils.toNano(1000),
                },
            },
        ],
        true // enableLogs
    );

    const {
        account: user
    } = await locklift.deployments.getAccount(name);

    const root = await locklift.deployments.getContract<VaultTokenRoot_V1Abi>('VaultRoot');

    await root.methods
        .deployWallet({
            walletOwner: user.address,
            deployWalletValue: toNano(2),
            answerId: 0,
        })
        .send({
            from: user.address,
            amount: toNano(5),
        });

    const userTokenWalletAddress = await getTokenWalletAddress(root, user.address);

    await locklift.deployments.saveContract({
        deploymentName: `VaultRoot${name}TokenWallet`,
        contractName: 'VaultTokenWallet_V1',
        address: userTokenWalletAddress
    }, true);
}


export default async () => {
    await setupUser('Alice', "10");
    await setupUser('Bob', "11");
}


export const tag = 'Setup_Users';
