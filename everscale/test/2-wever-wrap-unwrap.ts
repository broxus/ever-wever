import {
  getMetricsChange,
  getTokenWalletAddress,
  getVaultMetrics,
  logMetricsChange,
  setupWever,
  stringToBytesArray,
} from "./utils";
import { toNano, WalletTypes } from "locklift";

const logger = require("mocha-logger");
const { expect } = require("chai");
const EMPTY_TVM_CELL = "te6ccgEBAQEAAgAAAA==";
describe("Test wTON wrap / unwrap", async function () {
  this.timeout(200000);
  // @ts-ignore
  let context: ReturnType<typeof setupWever> extends Promise<infer F> ? F : never = {};

  it("Setup contracts", async function () {
    context = await setupWever();
  });

  describe("Test granting", async function () {
    it("Grant EVERs to the vault", async function () {
      const { userTokenWallet, user, vaultTokenWallet, vault, root } = context;
      const initialMetrics = await getVaultMetrics(userTokenWallet, user, vaultTokenWallet, vault, root);

      await vault.methods
        .grant({
          amount: toNano(4),
        })
        .send({
          from: user.address,
          amount: toNano(6),
        });

      const finalMetrics = await getVaultMetrics(userTokenWallet, user, vaultTokenWallet, vault, root);

      const metricsChange = getMetricsChange(initialMetrics, finalMetrics);

      logMetricsChange(metricsChange);

      expect(metricsChange.userWEVERBalance).to.be.equal(0, "Wrong user wEVER balance change");

      expect(metricsChange.userEVERBalance)
        .to.be.below(-4, "Too low user EVER balance change")
        .to.be.above(-4.5, "Too high user EVER balance change");

      expect(metricsChange.vaultWEVERBalance).to.be.equal(0, "Wrong vault wEVER balance change");

      expect(metricsChange.vaultEVERBalance).to.be.equal(4, "Vault EVER balance change differs from granted");

      expect(metricsChange.vaultTotalWrapped).to.be.equal(4, "Wrong vault total wrapped");

      expect(metricsChange.WEVERTotalSupply).to.be.equal(0, "wTON total supply should not change");
    });
  });

  describe("Test wrapping", async function () {
    describe("Wrap TON to wEVERs by sending EVERs to vault", async function () {
      it("Send EVERs to vault", async function () {
        const { userTokenWallet, user, vaultTokenWallet, vault, root } = context;

        const initialMetrics = await getVaultMetrics(userTokenWallet, user, vaultTokenWallet, vault, root);

        await locklift.provider.sendMessage({
          amount: toNano(5),
          recipient: vault.address,
          bounce: true,
          sender: user.address,
        });

        const finalMetrics = await getVaultMetrics(userTokenWallet, user, vaultTokenWallet, vault, root);

        const metricsChange = getMetricsChange(initialMetrics, finalMetrics);

        logMetricsChange(metricsChange);
        expect(metricsChange.userWEVERBalance)
          .to.be.above(3.5, "Too low user wEVER balance change")
          .and.to.be.equal(4, "Too high user wEVER balance change");

        expect(metricsChange.userEVERBalance)
          .to.be.below(-4, "Too low user EVER balance change")
          .to.be.above(-4.5, "Too high user EVER balance change");

        expect(metricsChange.vaultWEVERBalance).to.be.equal(0, "Wrong vault wEVER balance change");

        expect(metricsChange.vaultEVERBalance).to.be.equal(
          metricsChange.userWEVERBalance,
          "Vault EVER balance change differs from user wEVER balance change",
        );

        expect(metricsChange.vaultTotalWrapped).to.be.equal(
          metricsChange.userWEVERBalance,
          "Vault total wrapped change differs from user wEVER balance change",
        );

        expect(metricsChange.WEVERTotalSupply).to.be.equal(
          metricsChange.userWEVERBalance,
          "wTON total supply change differs from user wEVER balance change",
        );
      });
    });

    describe("Wrap TON to wEVERs by calling wrap", function () {
      it("Call wrap", async function () {
        const { userTokenWallet, user, vaultTokenWallet, vault, root } = context;

        const initialMetrics = await getVaultMetrics(userTokenWallet, user, vaultTokenWallet, vault, root);

        await locklift.transactions.waitFinalized(
          vault.methods
            .wrap({
              tokens: toNano(1),
              owner_address: user.address,
              gas_back_address: user.address,
              payload: EMPTY_TVM_CELL,
            })
            .send({
              from: user.address,
              amount: toNano(2.5),
            }),
        );

        const finalMetrics = await getVaultMetrics(userTokenWallet, user, vaultTokenWallet, vault, root);

        const metricsChange = getMetricsChange(initialMetrics, finalMetrics);

        logMetricsChange(metricsChange);

        expect(metricsChange.userWEVERBalance).to.be.equal(1, "Wrong user wEVER balance change");

        expect(metricsChange.userEVERBalance)
          .to.be.below(-1, "Too low user EVER balance change")
          .to.be.above(-1.5, "Too high user EVER balance change");

        expect(metricsChange.vaultWEVERBalance).to.be.equal(0, "Wrong vault wEVER balance change");

        expect(metricsChange.vaultEVERBalance).to.be.equal(
          metricsChange.userWEVERBalance,
          "Vault EVER balance change differs from user wEVER balance change",
        );

        expect(metricsChange.vaultTotalWrapped).to.be.equal(
          metricsChange.userWEVERBalance,
          "Vault total wrapped change differs from user wEVER balance change",
        );

        expect(metricsChange.WEVERTotalSupply).to.be.equal(
          metricsChange.userWEVERBalance,
          "wTON total supply change differs from user wEVER balance change",
        );
      });
    });

    describe("Unwrap wTON to TON by sending wEVERs to vault token wallet", async function () {
      it("Send wEVERs to vault token wallet", async function () {
        const { userTokenWallet, user, vaultTokenWallet, vault, root } = context;

        const initialMetrics = await getVaultMetrics(userTokenWallet, user, vaultTokenWallet, vault, root);

        await userTokenWallet.methods
          .transfer({
            amount: toNano(2.5),
            recipient: vault.address,
            deployWalletValue: 200000000,
            remainingGasTo: user.address,
            notify: true,
            payload: stringToBytesArray(""),
          })
          .send({
            from: user.address,
            amount: toNano(4),
          });

        const finalMetrics = await getVaultMetrics(userTokenWallet, user, vaultTokenWallet, vault, root);

        const metricsChange = getMetricsChange(initialMetrics, finalMetrics);

        logMetricsChange(metricsChange);

        expect(metricsChange.userWEVERBalance).to.be.equal(-2.5, "Wrong user wEVER balance change");

        expect(metricsChange.userEVERBalance)
          .to.be.above(2, "Too low user EVER balance change")
          .to.be.below(2.5, "Too high user EVER balance change");

        expect(metricsChange.vaultWEVERBalance).to.be.equal(0, "Wrong vault wEVER balance change");

        expect(metricsChange.vaultEVERBalance).to.be.equal(
          metricsChange.userWEVERBalance,
          "Vault EVER balance change differs from user wEVER balance change",
        );

        expect(metricsChange.vaultTotalWrapped).to.be.equal(
          metricsChange.userWEVERBalance,
          "Vault total wrapped change differs from user wEVER balance change",
        );

        expect(metricsChange.WEVERTotalSupply).to.be.equal(
          metricsChange.userWEVERBalance,
          "wTON total supply change differs from user wEVER balance change",
        );
      });
    });
  });

  describe("Test EVERs withdraw", async function () {
    it("Withdraw with owner account", async function () {
      const { userTokenWallet, user, vaultTokenWallet, vault, root } = context;

      const initialMetrics = await getVaultMetrics(userTokenWallet, user, vaultTokenWallet, vault, root);

      await vault.methods
        .withdraw({
          amount: toNano(3),
        })
        .send({
          from: user.address,
          amount: toNano(2),
        });
      const finalMetrics = await getVaultMetrics(userTokenWallet, user, vaultTokenWallet, vault, root);

      const metricsChange = getMetricsChange(initialMetrics, finalMetrics);

      logMetricsChange(metricsChange);

      expect(metricsChange.userWEVERBalance).to.be.equal(0, "Wrong user wEVER balance change");

      expect(metricsChange.userEVERBalance)
        .to.be.below(3.5, "Too low user EVER balance change")
        .to.be.above(2.9, "Too high user EVER balance change");

      expect(metricsChange.vaultWEVERBalance).to.be.equal(0, "Wrong vault wEVER balance change");

      expect(metricsChange.vaultEVERBalance).to.be.equal(-3, "Vault EVER balance change too high");

      expect(metricsChange.vaultTotalWrapped).to.be.equal(-3, "Wrong vault total wrapped change");

      expect(metricsChange.WEVERTotalSupply).to.be.equal(0, "wTON total supply should not change");
    });

    it("Try to withdraw with non owner", async function () {
      const { userTokenWallet, user, vaultTokenWallet, vault, root } = context;
      const keyPair = (await locklift.keystore.getSigner("1"))!;
      const { account: wrongOwner } = await locklift.factory.accounts.addNewAccount({
        type: WalletTypes.EverWallet,
        value: toNano(30),
        publicKey: keyPair.publicKey,
      });

      await root.methods
        .deployWallet({
          walletOwner: wrongOwner.address,
          deployWalletValue: toNano(1),
          answerId: 0,
        })
        .send({
          from: wrongOwner.address,
          amount: toNano(2),
        });

      const wrongOwnerTokenWalletAddress = await getTokenWalletAddress(root, wrongOwner.address);

      logger.log(`Wrong owner token wallet: ${wrongOwnerTokenWalletAddress}`);
      const wrongOwnerTokenWallet = locklift.factory.getDeployedContract("TokenWallet", wrongOwnerTokenWalletAddress);

      const initialMetrics = await getVaultMetrics(wrongOwnerTokenWallet, wrongOwner, vaultTokenWallet, vault, root);

      // await wrongOwner.runTarget({
      //   contract: vault,
      //   method: "withdraw",
      //   params: {
      //     amount: locklift.utils.convertCrystal(3, "nano"),
      //   },
      // });
      await vault.methods
        .withdraw({
          amount: toNano(3),
        })
        .send({
          from: wrongOwner.address,
          amount: toNano(2),
        });

      const finalMetrics = await getVaultMetrics(wrongOwnerTokenWallet, wrongOwner, vaultTokenWallet, vault, root);

      const metricsChange = getMetricsChange(initialMetrics, finalMetrics);

      logMetricsChange(metricsChange);

      expect(metricsChange.userWEVERBalance).to.be.equal(0, "Wrong user wEVER balance change");

      expect(metricsChange.userEVERBalance).to.be.below(0.01, "Too low user EVER balance change");

      expect(metricsChange.vaultWEVERBalance).to.be.equal(0, "Wrong vault wEVER balance change");

      expect(Number(metricsChange.vaultEVERBalance))
        .to.be.above(-0.0001, "Vault EVER balance change too low")
        .to.be.below(0, "Vault EVER balance change too high");

      expect(metricsChange.vaultTotalWrapped).to.be.equal(0, "Vault total wrapped change should not change");

      expect(metricsChange.WEVERTotalSupply).to.be.equal(0, "wTON total supply should not change");
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
  //       }, locklift.utils.convertCrystal(30, 'nano'));
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
