import { Address, WalletTypes, fromNano, getRandomNonce, toNano, zeroAddress } from 'locklift';
import logger from 'mocha-logger';
import { EMPTY_TVM_CELL } from '../test/utils';


const main = async () => {
    const keyPair = (await locklift.keystore.getSigner("0"))!;
    const signer = await locklift.keystore.getSigner("0");

    const OWNER = '0:e02729e9be9ad07dea46caa6f77085975049b1a7678150b0a0808e4bb86426be';

    // Deploy temp owner
    const temp_owner = await locklift.factory.accounts.addNewAccount({
        type: WalletTypes.WalletV3,
        publicKey: keyPair.publicKey,
        value: toNano(50)
    });

    // Deploy tunnel
    const {
        contract: tunnel
    } = await locklift.factory.deployContract({
        contract: 'Tunnel',
        constructorParams: {
            sources: [],
            destinations: [],
            owner_: temp_owner.account.address,
        },
        initParams: {
            _randomNonce: getRandomNonce(),
        },
        publicKey: keyPair.publicKey,
        value: toNano('2')
    });

    logger.log(`Tunnel: ${tunnel.address}`);

    // Deploy root
    const tokenWallet = await locklift.factory.getContractArtifacts('VaultTokenWallet_V1');
    const tokenWalletPlatform = await locklift.factory.getContractArtifacts('TokenWalletPlatform');

    const {
        contract: root
    } = await locklift.factory.deployContract({
        contract: 'TokenRootUpgradeable',
        constructorParams: {
            initialSupplyTo: zeroAddress,
            initialSupply: 0,
            deployWalletValue: 0,
            mintDisabled: false,
            burnByRootDisabled: false,
            burnPaused: false,
            remainingGasTo: temp_owner.account.address,
        },
        initParams: {
            name_: "Test Wrapped EVER",
            symbol_: "TWEVER",
            decimals_: 9,
            rootOwner_: tunnel.address,
            deployer_: zeroAddress,
            randomNonce_: getRandomNonce(),
            walletCode_: tokenWallet.code,
            platformCode_: tokenWalletPlatform.code
        },
        publicKey: keyPair.publicKey,
        value: locklift.utils.toNano('5')
    });

    logger.log(`Root (to be upgraded): ${root.address}`);

    // Deploy vault
    const {
        contract: vault
    } = await locklift.factory.deployContract({
        contract: 'Vault',
        constructorParams: {
            owner_: temp_owner.account.address,
            root: root.address,
            root_tunnel: tunnel.address,
            receive_safe_fee: toNano(1),
            settings_deploy_wallet_grams: toNano(0.2),
            initial_balance: toNano(1),            
        },
        initParams: {
            _randomNonce: getRandomNonce(),
        },
        publicKey: keyPair.publicKey,
        value: locklift.utils.toNano('5')
    });

    logger.log(`Vault: ${vault.address}`);

    // Setup tunnel
    logger.log('Setting up tunnel');

    await locklift.tracing.trace(
        tunnel.methods.__updateTunnel({
            source: vault.address,
            destination: root.address,
        }).send({
            from: temp_owner.account.address,
            amount: toNano(0.1)
        })
    );

    await locklift.tracing.trace(
        tunnel.methods.__updateTunnel({
            source: temp_owner.account.address,
            destination: root.address,
        }).send({
            from: temp_owner.account.address,
            amount: toNano(0.1)
        })
    );

    // Drain vault
    logger.log('Draining vault...');

    await locklift.tracing.trace(
        vault.methods.drain({
            receiver: temp_owner.account.address,
        }).send({
            from: temp_owner.account.address,
            amount: toNano(0.1)
        })
    );


    // Wrap some EVERs
    logger.log('Wrapping legacy TWEVERs');

    await locklift.tracing.trace(
        vault.methods.wrap({
            tokens: toNano(10),
            owner_address: new Address(OWNER),
            gas_back_address: temp_owner.account.address,
            payload: EMPTY_TVM_CELL
        }).send({
            from: temp_owner.account.address,
            amount: toNano(12)
        }),
        {
            raise: false
        }
    );

    const {
        value0: owner_wallet_address
    } = await root.methods.walletOf({
        walletOwner: new Address(OWNER),
        answerId: 0
    }).call();

    const owner_wallet = await locklift.factory.getDeployedContract(
        'VaultTokenWallet_V1',
        owner_wallet_address
    );

    const {
        value0: balance
    } = await owner_wallet.methods.balance({ answerId: 0 }).call();

    logger.log(`Owner WEVER balance: ${fromNano(balance)}`);
    logger.log(`Vault EVER balance: ${fromNano(await locklift.provider.getBalance(vault.address))}`);
    logger.log(`Root EVER balance: ${fromNano(await locklift.provider.getBalance(root.address))}`)

    // Upgrade vault
    logger.log(`------ Upgrading contracts -----`);
    let root_tunnel = await locklift.factory.getDeployedContract('TokenRootUpgradeable', tunnel.address);

    logger.log(`Upgrading root...`);
    const VaultTokenRoot_V1 = await locklift.factory.getContractArtifacts('VaultTokenRoot_V1');
    
    await locklift.tracing.trace(
        root_tunnel.methods.upgrade({
            code: VaultTokenRoot_V1.code
        }).send({
            from: temp_owner.account.address,
            amount: toNano(15)
        })
    );

    logger.log(`Transferring root ownership from tunnel to owner...`);
    await locklift.tracing.trace(
        root_tunnel.methods.transferOwnership({
            newOwner: temp_owner.account.address,
            remainingGasTo: temp_owner.account.address,
            callbacks: []
        }).send({
            from: temp_owner.account.address,
            amount: toNano(1)
        })
    );

    const root_vault = await locklift.factory.getDeployedContract('VaultTokenRoot_V1', root.address);

    logger.log(`Setting up legacy vault...`);
    await locklift.tracing.trace(
        root_vault.methods.setLegacyVault({
            legacy_vault_: vault.address
        }).send({
            from: temp_owner.account.address,
            amount: toNano(1)
        })
    );

    logger.log(`Setting up root as tunnel in vault...`);
    const {
        configuration
    } = await vault.methods.configuration().call();

    await locklift.tracing.trace(
        vault.methods.setConfiguration({
            _configuration: {
                ...configuration,
                root_tunnel: root.address,
            }
        }).send({
            from: temp_owner.account.address,
            amount: toNano(1)
        })    
    );

    logger.log(`Draining vault...`);
    await locklift.tracing.trace(
        vault.methods.drain({
            receiver: temp_owner.account.address,
        }).send({
            from: temp_owner.account.address,
            amount: toNano(0.1)
        })
    );

    // Toggle mint callback
    logger.log(`Toggling mint callback...`);

    await locklift.tracing.trace(
        root_vault.methods.toggleLegacyMint({}).send({
            from: temp_owner.account.address,
            amount: toNano(1)
        })
    );    

    logger.log(`Wrapping TWEVERs with root...`);
    await locklift.tracing.trace(
        root_vault.methods.wrap({
            tokens: toNano(5),
            recipient: new Address(OWNER),
            deployWalletValue: toNano(0.2),
            remainingGasTo: temp_owner.account.address,
            notify: false,
            payload: EMPTY_TVM_CELL
        }).send({
            from: temp_owner.account.address,
            amount: toNano(8)
        })
    );

    const {
        value0: balance2
    } = await owner_wallet.methods.balance({ answerId: 0 }).call();
    logger.log(`Owner WEVER balance: ${fromNano(balance2)}`);
    logger.log(`Vault EVER balance: ${fromNano(await locklift.provider.getBalance(vault.address))}`);
    logger.log(`Root EVER balance: ${fromNano(await locklift.provider.getBalance(root.address))}`)
}


main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });
