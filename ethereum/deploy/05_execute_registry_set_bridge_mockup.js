module.exports = async ({getNamedAccounts, deployments}) => {
    const { deployer } = await getNamedAccounts();

    await deployments.deploy('BridgeMockup', {
        from: deployer,
        log: true,
    });

    const bridge = await deployments.get('BridgeMockup');

    await deployments.execute('Registry',
        {
            from: deployer,
            log: true,
        },
        'setBridge',
        bridge.address
    );
};

module.exports.tags = ['Execute_Registry_setBridge'];
