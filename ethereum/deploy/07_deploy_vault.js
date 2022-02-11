const {
    defaultConfiguration
} = require("ton-eth-bridge-contracts/ethereum/test/utils");


module.exports = async ({getNamedAccounts, deployments}) => {
    const { deployer } = await getNamedAccounts();

    const token = await deployments.get('Token');

    const tx = await deployments.execute('Registry',
        {
            from: deployer,
            log: true,
        },
        'newVault',
        token.address,
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

    await deployments.save('TokenVault', {
        abi: vaultAbi,
        address: vaultAddress,
    });

    await deployments.execute('TokenVault',
        {
            from: deployer,
            log: true
        },
        'setConfiguration',
        defaultConfiguration,
    );
};

module.exports.tags = ['Execute_Registry_newVault'];
