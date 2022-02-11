const {
    setupWever,
    expect
} = require("./utils");


describe('Test upgrading proxy token transfer', async function() {
    this.timeout(200000);

    let user;
    let proxyTokenTransfer;
    let oldDetails;

    it('Setup contracts', async () => {
        [,, user,,,, proxyTokenTransfer] = await setupWever();
    });

    it('Save proxy details before upgrade', async () => {
        expect(await proxyTokenTransfer.call({ method: 'apiVersion' }))
            .to.be.equal('0.1.0', 'Wrong api version');

        oldDetails = await proxyTokenTransfer.call({ method: 'getDetails' });
   });

    it('Upgrade', async () => {
        const ProxyTokenTransferMockupUpgrade = await locklift.factory.getContract('ProxyTokenTransferMockupUpgrade');

        await user.runTarget({
            contract: proxyTokenTransfer,
            method: 'upgrade',
            params: {
                code: ProxyTokenTransferMockupUpgrade.code,
                send_gas_to: user.address
            }
        });

        proxyTokenTransfer.abi = ProxyTokenTransferMockupUpgrade.abi;
    });

    it('Check proxy details after upgrade', async () => {
        expect(await proxyTokenTransfer.call({ method: 'apiVersion' }))
            .to.be.equal('0.2.0', 'Wrong api version');

        const details = await proxyTokenTransfer.call({ method: 'getDetails' });

        expect(details._config.tonConfiguration)
            .to.be.equal(oldDetails._config.tonConfiguration, 'Wrong ton configuration');
        expect(details._config.ethereumConfigurations)
            .to.deep.equal(oldDetails._config.ethereumConfigurations, 'Wrong ethereum configurations');
        expect(details._config.tokenRoot)
            .to.be.equal(oldDetails._config.tokenRoot, 'Wrong token root');
        expect(details._config.settingsDeployWalletGrams)
            .to.be.bignumber.equal(oldDetails._config.settingsDeployWalletGrams, 'Wrong settings deploy wallet grams');
        expect(details._config.settingsTransferGrams)
            .to.be.bignumber.equal(oldDetails._config.settingsTransferGrams, 'Wrong settings transfer grams');

        expect(details._owner)
            .to.be.equal(oldDetails._owner, 'Wrong owner');
        expect(details._received_count)
            .to.be.bignumber.equal(oldDetails._received_count, 'Wrong received count');
        expect(details._transferred_count)
            .to.be.bignumber.equal(oldDetails._transferred_count, 'Wrong transferred count');
        expect(details._token_wallet)
            .to.be.equal(oldDetails._token_wallet, 'Wrong token wallet');
    });
});