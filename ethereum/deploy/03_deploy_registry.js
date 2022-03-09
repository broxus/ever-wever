module.exports = async ({getNamedAccounts, deployments}) => {
    const { deployer, bridge } = await getNamedAccounts();

    const proxyAdmin = await deployments.get('DefaultProxyAdmin');

    await deployments.deploy('Registry', {
        from: deployer,
        log: true,
        args: [
            bridge,
            proxyAdmin.address,
        ]
    });
};

module.exports.tags = ['Deploy_Registry'];
