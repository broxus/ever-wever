const {
    defaultConfiguration
} = require("ethereum-freeton-bridge-contracts/ethereum/test/utils");


module.exports = async ({getNamedAccounts, deployments}) => {
    const { deployer } = await getNamedAccounts();

    const tx = await deployments.execute('Registry',
        {
            from: deployer,
            log: true,
        },
        'newVault',
        'Token',
        'TKN',
        9,
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

    const {
        abi: tokenAbi
    } = await deployments.getExtendedArtifact('Token');

    const tokenAddress = await deployments.read(
        'TokenVault',
        {
            gasLimit: 1000000
        },
        'token',
    );

    await deployments.save('Token', {
        abi: tokenAbi,
        address: tokenAddress
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
