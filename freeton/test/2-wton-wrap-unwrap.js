const logger = require('mocha-logger');
const { expect } = require('chai');


const {
  convertCrystal
} = locklift.utils;


const {
  setupWton,
  getMetricsChange,
  getWTONMetrics,
  logMetricsChange,
  logGiverBalance,
  afterRun,
  stringToBytesArray
} = require('./utils');


describe('Test wTON wrap / unwrap', async function() {
  this.timeout(200000);

  let vault;
  let tunnel;
  let user;

  let root;
  let userTokenWallet;
  let vaultTokenWallet;
  let proxyTokenTransfer;
  
  let initialGiverBalance;

  before(async function() {
    initialGiverBalance = await logGiverBalance();
  });

  after(async function() {
    const finalGiverBalance = await logGiverBalance();

    logger.log(`Giver balance change: ${
      convertCrystal(initialGiverBalance - finalGiverBalance, 'ton')
    }`);
  });

  it('Setup contracts', async function() {
    [vault, tunnel, user, root, userTokenWallet, vaultTokenWallet] = await setupWton();
  });

  
  describe('Test granting', async function() {
    it('Grant TONs to the vault', async function() {
      const initialMetrics = await getWTONMetrics(
        userTokenWallet,
        user,
        vaultTokenWallet,
        vault,
        root,
      );
      
      await user.runTarget({
        contract: vault,
        method: 'grant',
        params: {
          amount: convertCrystal(4, 'nano'),
        },
        value: convertCrystal(6, 'nano')
      });
      
      const finalMetrics = await getWTONMetrics(
        userTokenWallet,
        user,
        vaultTokenWallet,
        vault,
        root,
      );
      
      const metricsChange = getMetricsChange(initialMetrics, finalMetrics);
      
      logMetricsChange(metricsChange);
      
      expect(metricsChange.userWTONBalance)
        .to.be.equal(0, 'Wrong user wTON balance change');

      expect(metricsChange.userTONBalance)
        .to.be.below(-4, 'Too low user TON balance change')
        .to.be.above(-4.5, 'Too high user TON balance change');

      expect(metricsChange.vaultWTONBalance)
        .to.be.equal(0, 'Wrong vault wTON balance change');

      expect(metricsChange.vaultTONBalance)
        .to.be.equal(
        4,
        'Vault TON balance change differs from granted'
      );

      expect(metricsChange.vaultTotalWrapped)
        .to.be.equal(
        4,
        'Wrong vault total wrapped'
      );

      expect(metricsChange.wTONTotalSupply)
        .to.be.equal(
        0,
        'wTON total supply should not change'
      );
    });
  });
  
  describe('Test wrapping', async function() {
    describe('Wrap TON to wTONs by sending TONs to vault', async function() {
      it('Send TONs to vault', async function() {
        const initialMetrics = await getWTONMetrics(
          userTokenWallet,
          user,
          vaultTokenWallet,
          vault,
          root,
        );

        await user.runTarget({
          contract: vault,
          value: convertCrystal(5, 'nano')
        });

        const finalMetrics = await getWTONMetrics(
          userTokenWallet,
          user,
          vaultTokenWallet,
          vault,
          root,
        );

        const metricsChange = getMetricsChange(initialMetrics, finalMetrics);

        logMetricsChange(metricsChange);

        expect(metricsChange.userWTONBalance)
          .to.be.above(3.5, 'Too low user wTON balance change')
          .and.to.be.below(4, 'Too high user wTON balance change');

        expect(metricsChange.userTONBalance)
          .to.be.below(-4, 'Too low user TON balance change')
          .to.be.above(-4.5, 'Too high user TON balance change');

        expect(metricsChange.vaultWTONBalance)
          .to.be.equal(0, 'Wrong vault wTON balance change');

        expect(metricsChange.vaultTONBalance)
          .to.be.equal(
            metricsChange.userWTONBalance,
            'Vault TON balance change differs from user wTON balance change'
          );

        expect(metricsChange.vaultTotalWrapped)
          .to.be.equal(
            metricsChange.userWTONBalance,
            'Vault total wrapped change differs from user wTON balance change'
          );

        expect(metricsChange.wTONTotalSupply)
          .to.be.equal(
            metricsChange.userWTONBalance,
            'wTON total supply change differs from user wTON balance change'
          );
      });
    });

    describe('Wrap TON to wTONs by calling wrap', function () {
      it('Call wrap', async function() {
        const initialMetrics = await getWTONMetrics(
          userTokenWallet,
          user,
          vaultTokenWallet,
          vault,
          root,
        );

        await user.runTarget({
          contract: vault,
          method: 'wrap',
          value: convertCrystal(2.5, 'nano'),
          params: {
            tokens: convertCrystal(1, 'nano'),
            wallet_public_key: 0,
            owner_address: user.address,
            gas_back_address: user.address,
          },
        });

        const finalMetrics = await getWTONMetrics(
          userTokenWallet,
          user,
          vaultTokenWallet,
          vault,
          root,
        );

        const metricsChange = getMetricsChange(initialMetrics, finalMetrics);

        logMetricsChange(metricsChange);

        expect(metricsChange.userWTONBalance)
          .to.be.equal(1, 'Wrong user wTON balance change');

        expect(metricsChange.userTONBalance)
          .to.be.below(-1, 'Too low user TON balance change')
          .to.be.above(-1.5, 'Too high user TON balance change');

        expect(metricsChange.vaultWTONBalance)
          .to.be.equal(0, 'Wrong vault wTON balance change');

        expect(metricsChange.vaultTONBalance)
          .to.be.equal(
            metricsChange.userWTONBalance,
            'Vault TON balance change differs from user wTON balance change'
          );

        expect(metricsChange.vaultTotalWrapped)
          .to.be.equal(
            metricsChange.userWTONBalance,
            'Vault total wrapped change differs from user wTON balance change'
          );

        expect(metricsChange.wTONTotalSupply)
          .to.be.equal(
            metricsChange.userWTONBalance,
            'wTON total supply change differs from user wTON balance change'
          );
      });
    });

    describe('Unwrap wTON to TON by sending wTONs to vault token wallet', async function() {
      it('Send wTONs to vault token wallet', async function() {
        const initialMetrics = await getWTONMetrics(
          userTokenWallet,
          user,
          vaultTokenWallet,
          vault,
          root,
        );

        await user.runTarget({
          contract: userTokenWallet,
          method: 'transferToRecipient',
          params: {
            recipient_public_key: 0,
            recipient_address: vault.address,
            tokens: convertCrystal(2.5, 'nano'),
            deploy_grams: 200000000,
            transfer_grams: 200000000,
            send_gas_to: user.address,
            notify_receiver: true,
            payload: stringToBytesArray(''),
          },
          value: convertCrystal('4', 'nano'),
        });

        const finalMetrics = await getWTONMetrics(
          userTokenWallet,
          user,
          vaultTokenWallet,
          vault,
          root,
        );

        const metricsChange = getMetricsChange(initialMetrics, finalMetrics);

        logMetricsChange(metricsChange);

        expect(metricsChange.userWTONBalance)
          .to.be.equal(-2.5, 'Wrong user wTON balance change');

        expect(metricsChange.userTONBalance)
          .to.be.above(2, 'Too low user TON balance change')
          .to.be.below(2.5, 'Too high user TON balance change');

        expect(metricsChange.vaultWTONBalance)
          .to.be.equal(0, 'Wrong vault wTON balance change');

        expect(metricsChange.vaultTONBalance)
          .to.be.equal(
            metricsChange.userWTONBalance,
            'Vault TON balance change differs from user wTON balance change'
          );

        expect(metricsChange.vaultTotalWrapped)
          .to.be.equal(
            metricsChange.userWTONBalance,
            'Vault total wrapped change differs from user wTON balance change'
          );

        expect(metricsChange.wTONTotalSupply)
          .to.be.equal(
            metricsChange.userWTONBalance,
            'wTON total supply change differs from user wTON balance change'
          );
      });
    });
  });
  

  describe('Test TONs withdraw', async function() {
    it('Withdraw with owner account', async function() {
      const initialMetrics = await getWTONMetrics(
        userTokenWallet,
        user,
        vaultTokenWallet,
        vault,
        root,
      );
      
      await user.runTarget({
        contract: vault,
        method: 'withdraw',
        params: {
          amount: convertCrystal(3, 'nano'),
        }
      });
      
      const finalMetrics = await getWTONMetrics(
        userTokenWallet,
        user,
        vaultTokenWallet,
        vault,
        root,
      );
      
      const metricsChange = getMetricsChange(initialMetrics, finalMetrics);
      
      logMetricsChange(metricsChange);
      
      expect(metricsChange.userWTONBalance)
        .to.be.equal(0, 'Wrong user wTON balance change');
      
      expect(metricsChange.userTONBalance)
        .to.be.below(3.5, 'Too low user TON balance change')
        .to.be.above(2.9, 'Too high user TON balance change');
      
      expect(metricsChange.vaultWTONBalance)
        .to.be.equal(0, 'Wrong vault wTON balance change');
      
      expect(metricsChange.vaultTONBalance)
        .to.be.equal(
        -3,
        'Vault TON balance change too high'
      );
      
      expect(metricsChange.vaultTotalWrapped)
        .to.be.equal(
        -3,
        'Wrong vault total wrapped change'
      );
      
      expect(metricsChange.wTONTotalSupply)
        .to.be.equal(
        0,
        'wTON total supply should not change'
      );
    });
    
    it('Try to withdraw with non owner', async function() {
      const Account = await locklift.factory.getAccount('Wallet');
      const [keyPair] = await locklift.keys.getKeyPairs();
      
      const wrongOwner = await locklift.giver.deployContract({
        contract: Account,
        constructorParams: {},
        initParams: {
          _randomNonce: locklift.utils.getRandomNonce(),
        },
        keyPair,
      }, convertCrystal(30, 'nano'));
      
      wrongOwner.afterRun = afterRun;
      
      wrongOwner.setKeyPair(keyPair);
      
      await wrongOwner.runTarget({
        contract: root,
        method: 'deployEmptyWallet',
        params: {
          deploy_grams: convertCrystal(1, 'nano'),
          wallet_public_key_: 0,
          owner_address_: wrongOwner.address,
          gas_back_address: wrongOwner.address,
        },
        value: convertCrystal(2, 'nano'),
      });
      
      const wrongOwnerTokenWalletAddress = await root.call({
        method: 'getWalletAddress',
        params: {
          wallet_public_key_: 0,
          owner_address_: wrongOwner.address
        },
      });
      
      // Wait until user token wallet is presented into the GraphQL
      await locklift.ton.client.net.wait_for_collection({
        collection: 'accounts',
        filter: {
          id: { eq: wrongOwnerTokenWalletAddress },
          balance: { gt: `0x0` }
        },
        result: 'balance'
      });
      
      logger.log(`Wrong owner token wallet: ${wrongOwnerTokenWalletAddress}`);
      
      const wrongOwnerTokenWallet = await locklift.factory.getContract(
        'TONTokenWallet',
        './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
      );
      
      wrongOwnerTokenWallet.setAddress(wrongOwnerTokenWalletAddress);
      
      const initialMetrics = await getWTONMetrics(
        wrongOwnerTokenWallet,
        wrongOwner,
        vaultTokenWallet,
        vault,
        root,
      );
      
      await wrongOwner.runTarget({
        contract: vault,
        method: 'withdraw',
        params: {
          amount: convertCrystal(3, 'nano'),
        }
      });
      
      const finalMetrics = await getWTONMetrics(
        wrongOwnerTokenWallet,
        wrongOwner,
        vaultTokenWallet,
        vault,
        root,
      );
      
      const metricsChange = getMetricsChange(initialMetrics, finalMetrics);
      
      logMetricsChange(metricsChange);
      
      
      expect(metricsChange.userWTONBalance)
        .to.be.equal(0, 'Wrong user wTON balance change');
      
      expect(metricsChange.userTONBalance)
        .to.be.below(0.01, 'Too low user TON balance change');
      
      expect(metricsChange.vaultWTONBalance)
        .to.be.equal(0, 'Wrong vault wTON balance change');
      
      expect(metricsChange.vaultTONBalance)
        .to.be.above(
        -0.0001,
        'Vault TON balance change too low'
      ).to.be.below(
        0,
        'Vault TON balance change too high'
      );
      
      expect(metricsChange.vaultTotalWrapped)
        .to.be.equal(
        0,
        'Vault total wrapped change should not change'
      );
      
      expect(metricsChange.wTONTotalSupply)
        .to.be.equal(
        0,
        'wTON total supply should not change'
      );
    });
  });
  
  let newOwner;

  // describe('Test ownership transfer', async function() {
  //   describe('Setup', async function() {
  //     it('Deploy new owner account', async function() {
  //       const Account = await locklift.factory.getAccount('Wallet');
  //       const [keyPair] = await locklift.keys.getKeyPairs();
  //
  //       newOwner = await locklift.giver.deployContract({
  //         contract: Account,
  //         constructorParams: {},
  //         initParams: {
  //           _randomNonce: getRandomNonce(),
  //         },
  //         keyPair,
  //       }, convertCrystal(30, 'nano'));
  //
  //       user.afterRun = afterRun;
  //       user.setKeyPair(keyPair);
  //
  //       logger.log(`New owner: ${newOwner.address}`);
  //
  //       expect(newOwner.address)
  //         .to.be.not.equal(user.address, 'New owner is same as previous');
  //     });
  //   });
  //
  //   describe('Tunnel', async function() {
  //     it('Transfer ownership', async function() {
  //       const tx = await user.runTarget({
  //         contract: tunnel,
  //         method: 'transferOwnership',
  //         params: {
  //           owner_: newOwner.address
  //         }
  //       });
  //
  //       logger.log(`Transfer tunnel ownership tx: ${tx.transaction.id}`);
  //     });
  //
  //     it('Check new ownership', async function() {
  //       const owner = await tunnel.call({
  //         method: 'owner'
  //       });
  //
  //       expect(owner)
  //         .to.be.equal(newOwner.address, 'Wrong tunnel owner');
  //     });
  //   });
  //
  //   describe('Vault', async function() {
  //     it('Transfer ownership', async function() {
  //       const tx = await user.runTarget({
  //         contract: vault,
  //         method: 'transferOwnership',
  //         params: {
  //           owner_: newOwner.address
  //         }
  //       });
  //
  //       logger.log(`Transfer vault ownership tx: ${tx.transaction.id}`);
  //     });
  //
  //     it('Check new ownership', async function() {
  //       const owner = await vault.call({
  //         method: 'owner'
  //       });
  //
  //       expect(owner)
  //         .to.be.equal(newOwner.address, 'Wrong vault owner');
  //     });
  //   });
  //
  //   describe('Event proxy', async function() {
  //     it('Transfer ownership', async function() {
  //       const tx = await user.runTarget({
  //         contract: tokenEventProxy,
  //         method: 'transferOwner',
  //         params: {
  //           external_owner_pubkey_: 0,
  //           internal_owner_address_: newOwner.address,
  //         }
  //       });
  //
  //       logger.log(`Transfer event proxy ownership tx: ${tx.transaction.id}`);
  //     });
  //
  //     it('Check new ownership', async function() {
  //       const owner = await tokenEventProxy.call({
  //         method: 'internal_owner_address'
  //       });
  //
  //       expect(owner)
  //         .to.be.equal(newOwner.address, 'Wrong event proxy owner');
  //     });
  //   });
  // });
});
