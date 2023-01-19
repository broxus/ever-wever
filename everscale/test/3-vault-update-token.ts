import { Contract, fromNano, getRandomNonce, toNano, zeroAddress } from "locklift";
import { TokenRootUpgradeableAbi, TokenWalletAbi, TokenWalletUpgradeableAbi } from "../build/factorySource";
import {
  getMetricsChange,
  getTokenWalletAddress,
  getVaultMetrics,
  logMetricsChange,
  setupWever,
  stringToBytesArray,
} from "./utils";
import BigNumber from "bignumber.js";
import { expect } from "chai";

const logger = require("mocha-logger");
const EMPTY_TVM_CELL = "te6ccgEBAQEAAgAAAA==";

describe("Test vault update to new token", async function () {
  // @ts-ignore
  let context: (ReturnType<typeof setupWever> extends Promise<infer F> ? F : never) & {
    root2: Contract<TokenRootUpgradeableAbi>;
    userTokenWallet2: Contract<TokenWalletUpgradeableAbi>;
    vaultTokenWallet2: Contract<TokenWalletAbi>;
  } = {};

  describe("Setup contracts and Deploy new wEVER", async function () {
    it("Deploy new root", async function () {
      const setupPrams = await setupWever();
      const keyPair = (await locklift.keystore.getSigner("0"))!;
      const { code: walletCode } = locklift.factory.getContractArtifacts("TokenWalletUpgradeable");
      const { code: platformCode } = locklift.factory.getContractArtifacts("TokenWalletPlatform");

      const { contract: root2 } = await locklift.tracing.trace(
        locklift.factory.deployContract({
          contract: "TokenRootUpgradeable",
          value: toNano(3),
          initParams: {
            deployer_: zeroAddress,
            randomNonce_: getRandomNonce(),
            rootOwner_: setupPrams.user.address,
            name_: "Wrapped EVER",
            symbol_: "WEVER",
            decimals_: 9,
            walletCode_: walletCode,
            platformCode_: platformCode,
          },
          constructorParams: {
            initialSupplyTo: setupPrams.user.address,
            initialSupply: 0,
            deployWalletValue: toNano(0.1),
            mintDisabled: false,
            burnByRootDisabled: true,
            burnPaused: false,
            remainingGasTo: zeroAddress,
          },
          publicKey: keyPair.publicKey,
        }),
      );

      await root2.methods
        .deployWallet({
          answerId: 0,
          deployWalletValue: toNano(0.5),
          walletOwner: setupPrams.user.address,
        })
        .send({
          from: setupPrams.user.address,
          amount: toNano(5),
        });
      const userTokenWalletAddress = await getTokenWalletAddress(root2, setupPrams.user.address);

      const userTokenWallet2 = await locklift.factory.getDeployedContract(
        "TokenWalletUpgradeable",
        userTokenWalletAddress,
      );
      logger.log(`User token wallet2 address: ${userTokenWalletAddress}`);

      expect(setupPrams.userTokenWallet).to.not.be.equal(
        userTokenWallet2.address,
        "User token wallets should be different",
      );
      // @ts-ignore
      context = { ...setupPrams, root2, userTokenWallet2 };
      logger.log(`Root2 address: ${context.root2.address}`);

      expect(context.root2.address).to.not.be.equal(context.root.address, "Roots should be different");
    });

    it("Transfer root ownership to tunnel", async function () {
      const { user, root2, tunnel } = context;

      await root2.methods
        .transferOwnership({
          newOwner: tunnel.address,
          remainingGasTo: user.address,
          callbacks: [],
        })
        .send({
          from: user.address,
          amount: toNano(2),
        });

      const root2Owner = await root2.methods
        .rootOwner({
          answerId: 0,
        })
        .call()
        .then(res => res.value0);

      expect(root2Owner.toString()).to.be.equal(tunnel.address.toString(), "Root2 owner should be tunnel");
    });
  });

  describe("Update vault target root", async function () {
    it("Update root in vault configuration", async function () {
      const { user, vault, root2 } = context;

      const configuration = await vault.methods
        .configuration()
        .call()
        .then(res => res.configuration);

      const configurationNewRoot = {
        ...configuration,
        root: root2.address,
      };

      await vault.methods
        .setConfiguration({
          _configuration: configurationNewRoot,
        })
        .send({
          from: user.address,
          amount: toNano(2),
        });
    });

    it("Check vault configuration root", async function () {
      const { vault, root2 } = context;

      const configuration = await vault.methods
        .configuration()
        .call()
        .then(res => res.configuration);

      expect(configuration.root.toString()).to.be.equal(
        root2.address.toString(),
        "New configuration should update root",
      );
    });

    it("Drain vault after update", async function () {
      const { user, vault } = context;

      await vault.methods
        .drain({
          receiver: user.address,
        })
        .send({
          from: user.address,
          amount: toNano(2),
        });
    });

    it("Check vault balance correct", async function () {
      const { vault } = context;

      const vaultBalance = await locklift.provider.getBalance(vault.address);

      const vaultTotalWrapped = await vault.methods
        .total_wrapped()
        .call()
        .then(res => res.total_wrapped);

      const { initial_balance: vaultInitialBalance } = await vault.methods
        .configuration()
        .call()
        .then(res => res.configuration);

      expect(Number(fromNano(vaultBalance))).to.be.equal(
        Number(fromNano(new BigNumber(vaultTotalWrapped).plus(vaultInitialBalance).toString())),
        "Vault balance differs from total wrapped + initial balance",
      );
    });

    it("Check new vault token wallet", async function () {
      const { vaultTokenWallet, vault, root2 } = context;

      const vaultTokenWalletAddress = await vault.methods
        .token_wallet()
        .call()
        .then(res => res.token_wallet);

      const vaultTokenWalletAddressExpected = await getTokenWalletAddress(root2, vault.address);

      expect(vaultTokenWalletAddress.toString()).to.be.equal(
        vaultTokenWalletAddressExpected.toString(),
        "Wrong vault token wallet",
      );

      logger.log(`New Vault token wallet address: ${vaultTokenWalletAddressExpected}`);

      const vaultTokenWallet2 = await locklift.factory.getDeployedContract("TokenWallet", vaultTokenWalletAddress);
      context["vaultTokenWallet2"] = vaultTokenWallet2;
      expect(vaultTokenWallet2.address.toString()).to.not.be.equal(
        vaultTokenWallet.address.toString(),
        "Vault token wallets should be different",
      );
    });
  });

  describe("Update tunnel", async function () {
    it("Update tunnel vault destination", async function () {
      const { user, vault, root2, tunnel } = context;

      await tunnel.methods.__updateTunnel({ source: vault.address, destination: root2.address }).send({
        from: user.address,
        amount: toNano(2),
      });
    });

    it("Check tunnel target", async function () {
      const { root2, tunnel } = context;

      const { destinations } = await tunnel.methods.__getTunnels().call();

      expect(destinations.map(el => el.toString())).to.include(
        root2.address.toString(),
        "New tunnel destination should be root2",
      );
    });
  });

  describe("Test new token", async function () {
    it("Wrap EVERs to new wEVERs", async function () {
      const { userTokenWallet, user, vaultTokenWallet, vault, root, root2, userTokenWallet2, vaultTokenWallet2 } =
        context;

      const initialMetrics = {
        v1: await getVaultMetrics(userTokenWallet, user, vaultTokenWallet, vault, root),
        v2: await getVaultMetrics(userTokenWallet2, user, vaultTokenWallet2, vault, root2),
      };

      await vault.methods
        .wrap({
          tokens: toNano(2),
          owner_address: user.address,
          gas_back_address: user.address,
          payload: EMPTY_TVM_CELL,
        })
        .send({
          from: user.address,
          amount: toNano(4),
        });

      const finalMetrics = {
        v1: await getVaultMetrics(userTokenWallet, user, vaultTokenWallet, vault, root),
        v2: await getVaultMetrics(userTokenWallet2, user, vaultTokenWallet2, vault, root2),
      };

      const metricsChange = {
        v1: getMetricsChange(initialMetrics.v1, finalMetrics.v1),
        v2: getMetricsChange(initialMetrics.v2, finalMetrics.v2),
      };

      logger.success("Old wEVER metrics change");
      logMetricsChange(metricsChange.v1);

      logger.success("New wEVER metrics change");
      logMetricsChange(metricsChange.v2);

      // Check metrics for old token
      expect(metricsChange.v1.userWEVERBalance).to.be.equal(0, "Wrong user old wEVER balance change");

      expect(metricsChange.v1.vaultWEVERBalance).to.be.equal(0, "Wrong vault old wEVER balance change");

      expect(metricsChange.v1.WEVERTotalSupply).to.be.equal(0, "Wrong old wEVER total supply change");

      // Check metrics for new token
      expect(metricsChange.v2.userWEVERBalance).to.be.equal(2, "Wrong user new wEVER balance change");

      expect(metricsChange.v2.userEVERBalance)
        .to.be.below(-2, "Too low user EVER balance change")
        .to.be.above(-2.5, "Too high user EVER balance change");

      expect(metricsChange.v2.vaultWEVERBalance).to.be.equal(0, "Wrong vault new wEVER balance change");

      expect(metricsChange.v2.vaultEVERBalance).to.be.equal(
        metricsChange.v2.userWEVERBalance,
        "Vault EVER balance change differs from user new wEVER balance change",
      );

      expect(metricsChange.v2.vaultTotalWrapped).to.be.equal(
        metricsChange.v2.userWEVERBalance,
        "Vault total wrapped change differs from user new wEVER balance change",
      );

      expect(metricsChange.v2.WEVERTotalSupply).to.be.equal(
        metricsChange.v2.userWEVERBalance,
        "wEVER total supply change differs from user new wEVER balance change",
      );
    });

    it("Unwrap new wEVERs to EVERs", async function () {
      const { userTokenWallet, user, vaultTokenWallet, vault, root, root2, userTokenWallet2, vaultTokenWallet2 } =
        context;
      const initialMetrics = {
        v1: await getVaultMetrics(userTokenWallet, user, vaultTokenWallet, vault, root),
        v2: await getVaultMetrics(userTokenWallet2, user, vaultTokenWallet2, vault, root2),
      };

      await userTokenWallet2.methods
        .transfer({
          amount: toNano(2),
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

      const finalMetrics = {
        v1: await getVaultMetrics(userTokenWallet, user, vaultTokenWallet, vault, root),
        v2: await getVaultMetrics(userTokenWallet2, user, vaultTokenWallet2, vault, root2),
      };

      const metricsChange = {
        v1: getMetricsChange(initialMetrics.v1, finalMetrics.v1),
        v2: getMetricsChange(initialMetrics.v2, finalMetrics.v2),
      };

      logger.success("Old wEVER metrics change");
      logMetricsChange(metricsChange.v1);

      logger.success("New wEVER metrics change");
      logMetricsChange(metricsChange.v2);

      // Check metrics for old token
      expect(metricsChange.v1.userWEVERBalance).to.be.equal(0, "Wrong user old wEVER balance change");

      expect(metricsChange.v1.vaultWEVERBalance).to.be.equal(0, "Wrong vault old wEVER balance change");

      expect(metricsChange.v1.WEVERTotalSupply).to.be.equal(0, "Wrong old wEVER total supply change");

      // Check metrics for new token
      expect(metricsChange.v2.userWEVERBalance).to.be.equal(-2, "Wrong user new wEVER balance change");

      expect(metricsChange.v2.userEVERBalance)
        .to.be.below(2, "Too high user EVER balance change")
        .to.be.above(1.5, "Too low user EVER balance change");

      expect(metricsChange.v2.vaultWEVERBalance).to.be.equal(0, "Wrong vault new wEVER balance change");

      expect(metricsChange.v2.vaultEVERBalance).to.be.equal(
        metricsChange.v2.userWEVERBalance,
        "Vault EVER balance change differs from user new wEVER balance change",
      );

      expect(metricsChange.v2.vaultTotalWrapped).to.be.equal(
        metricsChange.v2.userWEVERBalance,
        "Vault total wrapped change differs from user new wEVER balance change",
      );

      expect(metricsChange.v2.WEVERTotalSupply).to.be.equal(
        metricsChange.v2.userWEVERBalance,
        "wEVER total supply change differs from user new wEVER balance change",
      );
    });
  });
});
