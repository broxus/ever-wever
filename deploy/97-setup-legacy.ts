import {Contract, getRandomNonce, toNano, zeroAddress} from "locklift";
import {TokenRootUpgradeableAbi, TunnelAbi, VaultAbi, VaultTokenRoot_V1Abi} from "../build/factorySource";
import { getTokenWalletAddress } from "../test/utils";

export default async () => {
    const keyPair = (await locklift.keystore.getSigner("0"))!;

    const owner = await locklift.deployments.getAccount('Owner');

    // Deploy tunnel
    await locklift.deployments.deploy({
        deployConfig: {
            contract: "Tunnel",
            constructorParams: {
                sources: [owner.account.address],
                destinations: [owner.account.address],
                owner_: owner.account.address
            },
            value: toNano(15),
            initParams: {  
                _randomNonce: getRandomNonce(),
            },
            publicKey: keyPair.publicKey,
        },
        deploymentName: 'LegacyTunnel',
        enableLogs: true
    });

    const tunnel: Contract<TunnelAbi> = await locklift.deployments.getContract('LegacyTunnel');

    // Deploy root
    const { code: tokenWalletCode } = locklift.factory.getContractArtifacts("TokenWalletUpgradeable");
    const { code: tokenWalletPlatformCode } = locklift.factory.getContractArtifacts("TokenWalletPlatform");

    await locklift.deployments.deploy({
        deployConfig: {
            contract: 'TokenRootUpgradeable',
            constructorParams: {
                initialSupplyTo: zeroAddress,
                initialSupply: 0,
                deployWalletValue: 0,
                mintDisabled: false,
                burnByRootDisabled: false,
                burnPaused: false,
                remainingGasTo: owner.account.address,
            },
            initParams: {
                name_: "Wrapped EVER",
                symbol_: "wEVER",
                decimals_: 9,
                rootOwner_: tunnel.address,
                deployer_: zeroAddress,
                randomNonce_: getRandomNonce(),
                walletCode_: tokenWalletCode,
                platformCode_: tokenWalletPlatformCode
            },
            value: toNano(10),
            publicKey: keyPair.publicKey,
        },
        deploymentName: 'LegacyRoot',
        enableLogs: true
    });

    const root: Contract<TokenRootUpgradeableAbi> = await locklift.deployments.getContract('LegacyRoot');

    // Deploy legacy vault
    await locklift.deployments.deploy({
        deployConfig: {
            contract: "Vault",
            constructorParams: {
                owner_: owner.account.address, 
                root_tunnel: tunnel.address, 
                root: root.address, 
                receive_safe_fee: toNano(0.1), 
                settings_deploy_wallet_grams: toNano(0.1), 
                initial_balance: toNano(1)
            },
            value: toNano(15),
            initParams: {  
                _randomNonce: getRandomNonce(),
            },
            publicKey: keyPair.publicKey,
        },
        deploymentName: 'LegacyVault',
        enableLogs: true
    });

    const vault = await locklift.deployments.getContract('LegacyVault');

    // Setup tunnel
    // - Add (vault, root) tunnel
    await tunnel.methods.__updateTunnel({
        source: vault.address, 
        destination: root.address
    }).send({
        from: owner.account.address,
        amount: toNano(1)
    });
    
    // - Add (owner, root) tunnel
    await tunnel.methods.__updateTunnel({
        source: owner.account.address, 
        destination: root.address
    }).send({
        from: owner.account.address,
        amount: toNano(1)
    });

    // Setup vault wallet
    const vault_wallet = await getTokenWalletAddress(root, vault.address);

    await locklift.deployments.saveContract({
        deploymentName: `LegacyRootVaultTokenWallet`,
        contractName: 'TokenWalletUpgradeable',
        address: vault_wallet
    }, true);

    // Setup user wallets
    // - Owner
    await root.methods.deployWallet({
        walletOwner: owner.account.address,
        deployWalletValue: toNano(2),
        answerId: 0,
    }).send({
        from: owner.account.address,
        amount: toNano(5)
    });

    const owner_wallet = await getTokenWalletAddress(root, owner.account.address);

    await locklift.deployments.saveContract({
        deploymentName: `VaultLegacyOwnerTokenWallet`,
        contractName: 'TokenWalletUpgradeable',
        address: owner_wallet
    }, true);

    // - Alice
    const alice = await locklift.deployments.getAccount('Alice');

    await root.methods.deployWallet({
        walletOwner: alice.account.address,
        deployWalletValue: toNano(2),
        answerId: 0,
    }).send({
        from: owner.account.address,
        amount: toNano(5)
    });

    const alice_wallet = await getTokenWalletAddress(root, alice.account.address);

    await locklift.deployments.saveContract({
        deploymentName: `VaultLegacyAliceTokenWallet`,
        contractName: 'TokenWalletUpgradeable',
        address: alice_wallet
    }, true);

    // - Bob
    const bob = await locklift.deployments.getAccount('Bob');

    await root.methods.deployWallet({
        walletOwner: bob.account.address,
        deployWalletValue: toNano(2),
        answerId: 0,
    }).send({
        from: owner.account.address,
        amount: toNano(5)
    });

    const bob_wallet = await getTokenWalletAddress(root, bob.account.address);

    await locklift.deployments.saveContract({
        deploymentName: `VaultLegacyBobTokenWallet`,
        contractName: 'TokenWalletUpgradeable',
        address: bob_wallet
    }, true);
}


export const tag = 'Setup_Legacy';
