module.exports = async ({getNamedAccounts, deployments}) => {
    const { deployer } = await getNamedAccounts();

    const vault = await deployments.get('TokenVault');

    await deployments.execute('Token',
        {
            from: deployer,
            log: true,
        },
        'transferOwnership',
        vault.address
    );
};

module.exports.tags = ['Execute_Token_transferOwnership'];
