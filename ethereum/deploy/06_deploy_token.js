const ethers = require('ethers');


module.exports = async ({getNamedAccounts, deployments}) => {
    const { deployer } = await getNamedAccounts();

    await deployments.deploy('Dollar', {
        from: deployer,
        contract: 'Token',
        log: true,
        args: [
            "Dollar",
            "USD",
            18,
        ],
    });
};

module.exports.tags = ['Deploy_Dollar'];
