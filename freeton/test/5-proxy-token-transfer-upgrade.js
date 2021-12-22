const {
    setupWton
} = require("./utils");


describe('Test upgrading proxy token transfer', async function() {
    this.timeout(200000);

    let user;
    let proxyTokenTransfer;


    it('Setup contracts', async () => {
        [,, user,,,, proxyTokenTransfer] = await setupWton();
    });

    it('Upgrade', async () => {
        const ProxyTokenTransferMockupUpgrade = await locklift.factory.getContract('ProxyTokenTransferMockupUpgrade');

        console.log(await proxyTokenTransfer.call({ method: 'token_wallet' }));
        console.log(await proxyTokenTransfer.call({ method: 'owner' }));

        await user.runTarget({
            contract: proxyTokenTransfer,
            method: 'upgrade',
            params: {
                code: ProxyTokenTransferMockupUpgrade.code,
                send_gas_to: user.address
            }
        });

        proxyTokenTransfer.abi = ProxyTokenTransferMockupUpgrade.abi;

        console.log(await proxyTokenTransfer.call({ method: 'token_wallet' }));
        console.log(await proxyTokenTransfer.call({ method: 'owner' }));
        console.log(await proxyTokenTransfer.call({ method: 'getDetails' }));
    });
});