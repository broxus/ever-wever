import { getRandomNonce, toNano } from "locklift";
import { isValidEverAddress } from "locklift/utils";

const logger = require("mocha-logger");
const prompts = require("prompts");


const main = async () => {
    const keyPair = (await locklift.keystore.getSigner("0"))!;


    const response = await prompts([
        {
            type: 'text',
            name: 'owner',
            message: 'Owner address',
            validate: (value: string) => isValidEverAddress(value) ? true : 'Invalid address',
        },
        {
            type: 'text',
            name: 'tunnel',
            message: 'Tunnel address',
            validate: (value: string) => isValidEverAddress(value) ? true : 'Invalid address',
        },
        {
            type: 'text',
            name: 'root',
            message: 'Root address',
            validate: (value: string) => isValidEverAddress(value) ? true : 'Invalid address',
        },
        {
            type: 'text',
            name: 'vault',
            message: 'Vault address',
            validate: (value: string) => isValidEverAddress(value) ? true : 'Invalid address',
        },
    ]);    

    const VaultTokenRoot_V1 = await locklift.factory.getContractArtifacts('VaultTokenRoot_V1');

    const vault = await locklift.factory.getDeployedContract(
        'Vault',
        response.vault
    );

    const {
        configuration
    } = await vault.methods.configuration().call();

    const {
        contract: root_upgrade_assistant
    } = await locklift.factory.deployContract({
        contract: 'RootUpgradeAssistant',
        constructorParams: {
            _owner: response.owner,
            _tunnel: response.tunnel,
            _root: response.root,
            _vault: response.vault,
            _rootCode: VaultTokenRoot_V1.code,
            _vault_receive_safe_fee: configuration.receive_safe_fee,
            _vault_settings_deploy_wallet_grams: configuration.settings_deploy_wallet_grams,
            _vault_initial_balance: configuration.initial_balance
        },
        initParams: {
            _randomNonce: getRandomNonce(),
        },
        publicKey: keyPair.publicKey,
        value: toNano(10)
    });

    logger.log(`Root upgrade assistant: ${root_upgrade_assistant.address.toString()}`);
    logger.log('Dont forget to add (root_upgrade_assistant, root) to the tunnel!');
}


main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });
