const {
    encodeWithdrawalData,
    encodeTonEvent,
    defaultTonRecipient
} = require("ethereum-freeton-bridge-contracts/ethereum/test/utils");

const {
    expect
} = require('./utils');


describe('Test save withdraw and deposit', async () => {
    let vault;
    let token;

    it('Setup contracts', async () => {
        await deployments.fixture();

        vault = await ethers.getContract('TokenVault');
        token = await ethers.getContract('Token');
    });

    describe('Save withdraw', async () => {
        const amount = ethers.utils.parseUnits('1000', 9);

        it('Save withdrawal to Alice for 1000 tokens', async () => {
            const alice = await ethers.getNamedSigner('alice');

            const withdrawalEventData = await encodeWithdrawalData({
                amount: amount,
                recipient: alice.address
            });

            const payload = await encodeTonEvent({
                eventData: withdrawalEventData,
                proxy: vault.address,
            });

            await expect(() => vault.connect(alice).saveWithdrawal(payload, []))
                .to.changeTokenBalances(
                    token,
                    [vault, alice],
                    [ethers.BigNumber.from(0), amount]
                );
        });

        it('Check total supply', async () => {
            expect(await token.totalSupply())
                .to.be.equal(amount, 'Wrong total supply');
        });
    });

    describe('Deposit', async () => {
        const amount = ethers.utils.parseUnits('500', 9);

        it('Alice deposits 500 tokens into Vault', async () => {
            const alice = await ethers.getNamedSigner('alice');

            await expect(
                vault
                    .connect(alice)
                    .deposit(defaultTonRecipient, amount)
            ).to.emit(vault, 'Deposit')
                .withArgs(
                    amount,
                    defaultTonRecipient.wid,
                    defaultTonRecipient.addr
                );
        });

        it('Check balances', async () => {
            const alice = await ethers.getNamedSigner('alice');

            expect(await token.balanceOf(alice.address))
                .to.be.equal(ethers.utils.parseUnits('500', 9), "Wrong balance after deposit");

            expect(await token.balanceOf(vault.address))
                .to.be.equal(0, "Wrong vault balance");
        });

        it('Check total supply', async () => {
            expect(await token.totalSupply())
                .to.be.equal(ethers.utils.parseUnits('500', 9));
        });
    });
});