module.exports = async ({getNamedAccounts, deployments}) => {
    const { deployer, owner } = await getNamedAccounts();

    await deployments.execute('TokenVault',
        {
            from: deployer,
            log: true,
        },
        'setGovernance',
        owner
    );
};

module.exports.tags = ['Execute_Vault_setGovernance'];
