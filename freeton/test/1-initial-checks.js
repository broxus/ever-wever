const {
  expect,
  afterRun,
  setupWton,
} = require("./utils");
const {convertCrystal} = require("locklift/locklift/utils");


describe('Setup contracts', async function() {
  this.timeout(200000);

  let vault;
  let tunnel;
  let user;

  let root;
  let userTokenWallet;
  let vaultTokenWallet;
  let proxyTokenTransfer;
  let proxyTokenWallet;
  let tonEventConfiguration;

  it('Setup contracts', async function() {
    [vault, tunnel, user, root, userTokenWallet, vaultTokenWallet, proxyTokenTransfer, proxyTokenWallet] = await setupWton();
  });

  describe('Wrapped TON token', async function() {
    it('Check wTON root', async function() {

      const name = await root.call({
        method: 'name',
        params: {}
      });

      expect(name.toString()).to.be.equal("Wrapped TON", 'Wrong root name');
      expect((await locklift.ton.getBalance(root.address)).toNumber())
          .to.be.above(0, 'Root balance empty');
    });

    it('Check root owned by tunnel', async function() {
      const {
        root_public_key,
        root_owner_address
      } = await root.call({
        method: 'getDetails',
      });

      expect(root_public_key.toNumber())
          .to.be.equal(0, 'Wrong root public key');

      expect(root_owner_address)
          .to.be.equal(tunnel.address, 'Root owner should be tunnel');
    });
  });

  describe('User', async function() {
    it('Check user account', async function() {
      const userBalance = await locklift.ton.getBalance(user.address);

      expect(userBalance.toNumber())
          .to.be.above(0, 'Bad user balance');

      const {
        acc_type_name
      } = await locklift.ton.getAccountType(user.address);

      expect(acc_type_name)
          .to.be.equal('Active', 'User account not active');
    });

    it('Check user token wallet status', async function() {
      const {
        acc_type_name
      } = await locklift.ton.getAccountType(userTokenWallet.address);

      expect(acc_type_name)
          .to.be.equal('Active', 'User token wallet not active');
    });

    it('Check user token wallet balance', async function() {
      const userTokenBalance = await userTokenWallet.call({
        method: 'balance'
      });

      expect(userTokenBalance.toNumber())
          .to.be.equal(0, 'Initial user token balance non zero');
    })
  });

  describe('Vault', async function() {
    it('Check vault root', async function() {
      const {
        root: vaultRoot
      } = await vault.call({
        method: 'configuration',
      });

      expect(vaultRoot)
          .to.equal(root.address, 'Wrong root address');
    });

    it('Check vault token wallet', async function() {
      await afterRun();

      const vaultTokenWalletAddressExpected = await root.call({
        method: 'getWalletAddress',
        params: {
          wallet_public_key_: 0,
          owner_address_: vault.address
        },
      });

      expect(vaultTokenWalletAddressExpected)
          .to.be.equal(vaultTokenWallet.address, 'Wrong vault token wallet');
    });

    it('Check vault token wallet receive callback', async function() {
      const {
        receive_callback
      } = (await vaultTokenWallet.call({
        method: 'getDetails',
      }));

      expect(receive_callback)
          .to.be.equal(vault.address, 'Wrong vault token wallet receive callback');
    });
  });

  describe('Proxy token transfer', async () => {
    it('Check proxy token wallet deployed', async () => {
      expect(proxyTokenWallet.address)
          .to.not.be.equal(locklift.utils.zeroAddress, "Proxy token wallet not deployed");

      const {
        acc_type_name
      } = await locklift.ton.getAccountType(proxyTokenWallet.address);

      expect(acc_type_name)
          .to.be.equal('Active', 'Proxy token wallet not active');
    });

    it('Check proxy token wallet owner', async () => {
      const {
        wallet_public_key,
        owner_address,
      } = await proxyTokenWallet.call({ method: 'getDetails' });

      expect(wallet_public_key)
          .to.be.bignumber.equal(0, "Wrong owner public key");

      expect(owner_address)
          .to.be.equal(proxyTokenTransfer.address, "Wrong owner address");
    });

    it('Check proxy token wallet receive callback', async () => {
      const {
        receive_callback
      } = await proxyTokenWallet.call({ method: 'getDetails' });

      expect(receive_callback)
          .to.be.equal(proxyTokenTransfer.address, "Wrong proxy token wallet receive callback");
    });

    it('Check proxy details', async () => {
      const details = await proxyTokenTransfer.call({ method: 'getDetails' });

      expect(details._config.tonConfiguration)
          .to.be.equal(user.address, "Wrong ton configuration");

      expect(details._config.ethereumConfigurations)
          .to.have.lengthOf(1, "Wrong amount of ethereum configurations");

      expect(details._config.ethereumConfigurations[0])
          .to.be.equal(user.address, "Wrong ethereum configuration");

      expect(details._config.settingsDeployWalletGrams)
          .to.be.bignumber.equal(convertCrystal(0.5, 'nano'), "Wrong settings deploy grams");

      expect(details._config.settingsTransferGrams)
          .to.be.bignumber.equal(convertCrystal(0.5, 'nano'), "Wrong settings transfer grams");

      expect(details._owner)
          .to.be.equal(user.address, "Wrong proxy owner");

      expect(details._received_count)
          .to.be.bignumber.equal(0, "Wrong received count");

      expect(details._transferred_count)
          .to.be.bignumber.equal(0, "Wrong transferred count");
    });
  });

  describe('Tunnel', async function() {
    it('Check tunnel sources', async function() {
      const {
        sources,
        destinations,
      } = await tunnel.call({ method: '__getTunnels' });

      expect(sources)
          .to.have.lengthOf(1, 'Wrong amount of tunnel sources');
      expect(destinations)
          .to.have.lengthOf(1, 'Wrong amount of tunnel destinations');

      expect(sources[0])
          .to.be.equal(vault.address, 'Tunnel source differs from vault');
      expect(destinations[0])
          .to.be.equal(root.address, 'Tunnel destination differs from root');
    });
  });
});