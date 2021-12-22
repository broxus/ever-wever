const {
    encodeWithdrawalData,
    encodeTonEvent,
    defaultTonRecipient
} = require("ethereum-freeton-bridge-contracts/ethereum/test/utils");

const {
    expect
} = require('./utils');


describe('Test save withdraw and deposit', async () => {
    let dollarVault;
    let dollarVaultWrapper;
    let dollar;

    it('Setup contracts', async () => {
        await deployments.fixture();

        dollarVault = await ethers.getContract('DollarVault');
        dollarVaultWrapper = await ethers.getContract('DollarVaultWrapper');
        dollar = await ethers.getContract('Dollar');
    });

    describe('Test save withdraw', async () => {
        it('Save withdraw', async () => {
            const alice = await ethers.getNamedSigner('alice');

            const withdrawalEventData = await encodeWithdrawalData({
                amount: ethers.utils.parseUnits('10', 9),
                recipient: alice.address
            });

            const payload = await encodeTonEvent({
                eventData: withdrawalEventData,
                proxy: dollarVault.address,
            });

            await expect(() => dollarVaultWrapper.connect(alice).saveWithdraw(payload, [], 0))
                .to.changeTokenBalances(
                    dollar,
                    [dollarVault, alice],
                    [ethers.BigNumber.from(0), ethers.utils.parseUnits('10', 18)]
                );
            ;
        });

        it('Check total supply', async () => {
            expect(await dollar.totalSupply())
                .to.be.equal(ethers.utils.parseUnits('10', 18));
        });
    });

    describe('Test deposit', async () => {
        it('Deposit tokens into vault', async () => {
            const alice = await ethers.getNamedSigner('alice');

            await expect(dollarVaultWrapper.connect(alice).deposit(defaultTonRecipient, ethers.utils.parseUnits('1', 18)))
                .to.emit(dollarVault, 'Deposit')
                .withArgs(ethers.utils.parseUnits('1', 9), defaultTonRecipient.wid, defaultTonRecipient.addr);
        });

        it('Check balances', async () => {
            const alice = await ethers.getNamedSigner('alice');

            expect(await dollar.balanceOf(alice.address))
                .to.be.equal(ethers.utils.parseUnits('9', 18), "Wrong alice balance");

            expect(await dollar.balanceOf(dollarVault.address))
                .to.be.equal(0, "Wrong vault balance");
        });

        it('Check total supply', async () => {
            expect(await dollar.totalSupply())
                .to.be.equal(ethers.utils.parseUnits('9', 18));
        });
    });
});