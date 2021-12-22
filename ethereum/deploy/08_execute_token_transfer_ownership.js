module.exports = async ({getNamedAccounts, deployments}) => {
    const { deployer } = await getNamedAccounts();

    const dollarVault = await deployments.get('DollarVault');

    await deployments.execute(
        'Dollar',
        {
            from: deployer,
            log: true,
        },
        'transferOwnership',
        dollarVault.address
    );
};

module.exports.tags = ['Execute_Dollar_transferOwnership'];
