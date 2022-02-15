module.exports = async ({getNamedAccounts, deployments}) => {
    const { deployer } = await getNamedAccounts();

    const proxyAdmin = await deployments.get('DefaultProxyAdmin');

    await deployments.deploy('BridgeMockup', {
        from: deployer,
        log: true,
    });

    const bridge = await deployments.get('BridgeMockup');

    await deployments.deploy('Registry', {
        from: deployer,
        log: true,
        args: [
            bridge.address,
            proxyAdmin.address,
        ]
    });
};

module.exports.tags = ['Deploy_Registry'];
