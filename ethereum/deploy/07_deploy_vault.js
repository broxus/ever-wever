const {
    defaultConfiguration
} = require("ethereum-freeton-bridge-contracts/ethereum/test/utils");


module.exports = async ({getNamedAccounts, deployments}) => {
    const { deployer } = await getNamedAccounts();

    const dollar = await deployments.get('Dollar');

    const tx = await deployments.execute('Registry',
        {
            from: deployer,
            log: true,
        },
        'newVault',
        dollar.address,
        ethers.constants.AddressZero,
        9,
        0,
        0
    );

    const [{
        args: {
            vault: vaultAddress,
        }
    }] = tx.events.filter(e => e.event === 'NewVault');

    const {
        abi: vaultAbi
    } = await deployments.getExtendedArtifact('Vault');

    await deployments.save('DollarVault', {
        abi: vaultAbi,
        address: vaultAddress,
    });

    const vaultWrapperAddress = await deployments.read(
        'DollarVault',
        {
            gasLimit: 1000000
        },
        'wrapper',
    );

    const {
        abi: vaultWrapperAbi
    } = await deployments.getExtendedArtifact('VaultWrapper');

    await deployments.save('DollarVaultWrapper', {
        abi: vaultWrapperAbi,
        address: vaultWrapperAddress
    });

    await deployments.execute('DollarVault',
        {
            from: deployer,
            log: true
        },
        'setConfiguration',
        defaultConfiguration,
    );
};

module.exports.tags = ['Execute_Registry_newVault'];
