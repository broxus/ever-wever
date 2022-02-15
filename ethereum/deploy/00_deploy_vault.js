module.exports = async ({getNamedAccounts, deployments}) => {
    const { deployer } = await getNamedAccounts();

    await deployments.deploy('Vault', {
        from: deployer,
        log: true,
    });
};

module.exports.tags = ['Deploy_Vault'];
