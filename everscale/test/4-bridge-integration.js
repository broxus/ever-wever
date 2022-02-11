const {
    convertCrystal
} = locklift.utils;

const {
    expect,
    setupWever, stringToBytesArray,
} = require("./utils");


describe('Bridge integration', async function() {
    this.timeout(200000);

    let vault;
    let tunnel;
    let user;

    let root;
    let userTokenWallet;
    let vaultTokenWallet;
    let proxyTokenTransfer;
    let proxyTokenWallet;

    it('Setup contracts', async function() {
        [vault, tunnel, user, root, userTokenWallet, vaultTokenWallet, proxyTokenTransfer, proxyTokenWallet] = await setupWever();
    });

    it('Mint wEVERs', async function() {
        await user.runTarget({
            contract: vault,
            method: 'wrap',
            value: locklift.utils.convertCrystal(10, 'nano'),
            params: {
                tokens: locklift.utils.convertCrystal(4, 'nano'),
                owner_address: user.address,
                gas_back_address: user.address,
            },
        });

        expect(await userTokenWallet.call({ method: 'balance' }))
            .to.be.bignumber.equal(convertCrystal(4, 'nano'), "Wrong user token wallet balance");
    });

    describe('EVER-EVM transfer', async () => {
        const transferPayload = 'te6ccgEBAQEAGgAAMAAAAAAAAAAAAAAAAAAAAAAAAAB7AAABWQ=='; // (123,345)

        it('Transfer tokens to the event proxy', async () => {
            await user.runTarget({
                contract: userTokenWallet,
                method: 'transfer',
                params: {
                    amount: locklift.utils.convertCrystal(2.5, 'nano'),
                    recipient: proxyTokenTransfer.address,
                    deployWalletValue: 200000000,
                    remainingGasTo: user.address,
                    notify: true,
                    payload: transferPayload,
                },
                value: locklift.utils.convertCrystal('4', 'nano'),
            });
        });

        it('Check user token balance', async () => {
            expect(await userTokenWallet.call({ method: 'balance' }))
                .to.be.bignumber.equal(convertCrystal(1.5, 'nano'), "Wrong user token balance");
        });

        it('Check proxy token balance', async () => {
            expect(await proxyTokenWallet.call({ method: 'balance' }))
                .to.be.bignumber.equal(convertCrystal(2.5, 'nano'), "Wrong proxy token balance");
        });

        it('Check proxy counters', async () => {
            const details = await proxyTokenTransfer.call({ method: 'getDetails' });

            expect(details._received_count)
                .to.be.bignumber.equal(convertCrystal(2.5, 'nano'), "Wrong received count");

            expect(details._transferred_count)
                .to.be.bignumber.equal(0, "Wrong transferred count");
        });
    });

    describe('EVM-EVER transfer', async () => {
        it('Send confirmation from the fake evm configuration', async () => {
            const payload = await proxyTokenTransfer.call({
                method: 'encodeEthereumEventData',
                params: {
                    tokens: locklift.utils.convertCrystal(1.5, 'nano'),
                    wid: 0,
                    owner_addr: '0x' + user.address.split(':')[1]
                }
            });

            await user.runTarget({
                contract: proxyTokenTransfer,
                method: 'onEventConfirmed',
                params: {
                    eventData: {
                        configuration: user.address,
                        staking: user.address,
                        chainId: 123,
                        voteData: {
                            eventTransaction: 0,
                            eventIndex: 0,
                            eventData: payload,
                            eventBlockNumber: 0,
                            eventBlock: 0,
                        }
                    },
                    gasBackAddress: user.address
                },
                value: locklift.utils.convertCrystal('5', 'nano'),
            });
        });

        it('Check user token balance', async () => {
            expect(await userTokenWallet.call({ method: 'balance' }))
                .to.be.bignumber.equal(convertCrystal(3, 'nano'), "Wrong user token balance");
        });

        it('Check proxy token balance', async () => {
            expect(await proxyTokenWallet.call({ method: 'balance' }))
                .to.be.bignumber.equal(convertCrystal(1, 'nano'), "Wrong proxy token balance");
        });

        it('Check proxy counters', async () => {
            const details = await proxyTokenTransfer.call({ method: 'getDetails' });

            expect(details._received_count)
                .to.be.bignumber.equal(convertCrystal(2.5, 'nano'), "Wrong received count");

            expect(details._transferred_count)
                .to.be.bignumber.equal(convertCrystal(1.5, 'nano'), "Wrong transferred count");
        });
    });
});