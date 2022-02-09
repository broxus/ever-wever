module.exports = async ({getNamedAccounts, deployments}) => {
    const { deployer } = await getNamedAccounts();

    await deployments.deploy('Token', {
        from: deployer,
        log: true,
        args: [
            'Token',
            'TKN',
            9,
        ]
    });
};

module.exports.tags = ['Deploy_Token'];
