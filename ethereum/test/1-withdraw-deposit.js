const {
    encodeWithdrawalData,
    encodeTonEvent,
    defaultTonRecipient
} = require("ton-eth-bridge-contracts/ethereum/test/utils");

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

    it('Set deposit and withdraw fees', async () => {
        const deployer = await ethers.getNamedSigner('deployer');

        await vault.connect(deployer).setDepositFee(100);
        await vault.connect(deployer).setWithdrawFee(200);
    });

    describe('Save withdraw', async () => {
        let fee;
        const amount = ethers.utils.parseUnits('1000', 9);

        it('Save withdrawal to Alice for 1000 tokens', async () => {
            const alice = await ethers.getNamedSigner('alice');

            const withdrawalEventData = await encodeWithdrawalData({
                amount: amount,
                recipient: alice.address
            });

            const withdrawFee = await vault.withdrawFee();

            fee = withdrawFee.mul(amount).div(10000);

            const payload = await encodeTonEvent({
                eventData: withdrawalEventData,
                proxy: vault.address,
            });

            await expect(() => vault.connect(alice).saveWithdraw(payload, []))
                .to.changeTokenBalances(
                    token,
                    [vault, alice],
                    [ethers.BigNumber.from(0), amount - fee]
                );
        });

        it('Check total supply', async () => {
            expect(await token.totalSupply())
                .to.be.equal(amount - fee, 'Wrong total supply');
        });

        it('Skim fees to EVM', async () => {
            const fees = await vault.fees();

            expect(fees)
                .to.be.gt(0, 'Zero fees after withdraw');

            const deployer = await ethers.getNamedSigner('deployer');

            await expect(() => vault.connect(deployer).skim(false))
                .to.changeTokenBalances(
                    token,
                    [vault, deployer],
                    [ethers.BigNumber.from(0), fees]
                );

            expect(await vault.fees())
                .to.be.equal(0, 'Fees non zero after skim');
        });
    });

    describe('Deposit', async () => {
        const amount = ethers.utils.parseUnits('500', 9);
        let fee;

        it('Alice deposits 500 tokens into Vault', async () => {
            const alice = await ethers.getNamedSigner('alice');

            const depositFee = await vault.depositFee();

            fee = depositFee.mul(amount).div(10000);

            await expect(
                vault
                    .connect(alice)
                    .deposit(defaultTonRecipient, amount)
            ).to.emit(vault, 'Deposit')
                .withArgs(
                    amount - fee,
                    defaultTonRecipient.wid,
                    defaultTonRecipient.addr
                );
        });

        it('Check vault balance', async () => {
            expect(await token.balanceOf(vault.address))
                .to.be.equal(0, "Wrong vault balance");
        });

        it('Skim fees to Everscale', async () => {
            const fees = await vault.fees();

            expect(fees)
                .to.be.gt(0, 'Zero fees after withdraw');

            const deployer = await ethers.getNamedSigner('deployer');
            const rewards = await vault.rewards();

            expect(vault.connect(deployer).skim(true))
                .to.emit(vault, 'Deposit')
                .withArgs(
                    fees,
                    rewards.wid,
                    rewards.addr
                );

            expect(await vault.fees())
                .to.be.equal(0, 'Fees non zero after skim');
        });
    });
});
