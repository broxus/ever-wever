import { Address, Contract, fromNano, getRandomNonce, toNano, WalletTypes, zeroAddress } from "locklift";
import {
  TokenRootAbi,
  TokenRootUpgradeableAbi,
  TokenWalletAbi,
  TokenWalletUpgradeableAbi,
  VaultAbi,
} from "../build/factorySource";
import { Account } from "everscale-standalone-client";

const logger = require("mocha-logger");

const chai = require("chai");
chai.use(require("chai-bignumber")());

export const stringToBytesArray = (dataString: string) => {
  return Buffer.from(dataString).toString("hex");
};

export const getTokenWalletAddress = async function (
  root: Contract<TokenRootAbi> | Contract<TokenRootUpgradeableAbi>,
  user: Address,
): Promise<Address> {
  return root.methods
    .walletOf({
      walletOwner: user,
      answerId: 0,
    })
    .call()
    .then(res => res.value0);
};

export const setupWever = async () => {
  const keyPair = (await locklift.keystore.getSigner("0"))!;

  // User
  // - Deploy user account
  const { account: user } = await locklift.factory.accounts.addNewAccount({
    type: WalletTypes.EverWallet,
    value: toNano(30),
    publicKey: keyPair.publicKey,
  });

  logger.log(`User address: ${user.address.toString()}`);

  // Wrapped EVER token
  // - Deploy wEVER root
  // const RootToken = await locklift.factory.getContract("TokenRoot", TOKEN_PATH);
  // const TokenWallet = await locklift.factory.getContract("TokenWallet", TOKEN_PATH);
  //
  // const root = await locklift.giver.deployContract({
  //   contract: RootToken,
  //   constructorParams: {
  //     initialSupplyTo: user.address,
  //     initialSupply: 0,
  //     deployWalletValue: locklift.utils.convertCrystal("0.1", "nano"),
  //     mintDisabled: false,
  //     burnByRootDisabled: true,
  //     burnPaused: false,
  //     remainingGasTo: locklift.utils.zeroAddress,
  //   },
  //   initParams: {
  //     deployer_: locklift.utils.zeroAddress,
  //     randomNonce_: locklift.utils.getRandomNonce(),
  //     rootOwner_: user.address,
  //     name_: "Wrapped EVER",
  //     symbol_: "WEVER",
  //     decimals_: 9,
  //     walletCode_: TokenWallet.code,
  //   },
  //   keyPair,
  // });
  const { code: tokenWalletCode } = locklift.factory.getContractArtifacts("TokenWallet");
  const { contract: root } = await locklift.factory.deployContract({
    contract: "TokenRoot",
    constructorParams: {
      initialSupplyTo: user.address,
      initialSupply: 0,
      deployWalletValue: toNano(0.1),
      mintDisabled: false,
      burnByRootDisabled: true,
      burnPaused: false,
      remainingGasTo: zeroAddress,
    },
    initParams: {
      deployer_: zeroAddress,
      randomNonce_: getRandomNonce(),
      rootOwner_: user.address,
      name_: "Wrapped EVER",
      symbol_: "WEVER",
      decimals_: 9,
      walletCode_: tokenWalletCode,
    },
    value: toNano(10),
    publicKey: keyPair.publicKey,
  });

  logger.log(`Root address: ${root.address}`);

  // - Deploy user token wallet
  // const tx = await user.runTarget({
  //   contract: root,
  //   method: "deployWallet",
  //   params: {
  //     walletOwner: user.address,
  //     deployWalletValue: locklift.utils.convertCrystal(2, "nano"),
  //   },
  //   value: locklift.utils.convertCrystal(5, "nano"),
  // });
  await root.methods
    .deployWallet({
      walletOwner: user.address,
      deployWalletValue: toNano(2),
      answerId: 0,
    })
    .send({
      from: user.address,
      amount: toNano(5),
    });

  const userTokenWalletAddress = await getTokenWalletAddress(root, user.address);

  // // Wait until user token wallet is presented into the GraphQL
  // await waitForAddressToBeActive(userTokenWalletAddress.address);

  logger.log(`User token wallet: ${userTokenWalletAddress.toString()}`);

  const userTokenWallet = await locklift.factory.getDeployedContract("TokenWallet", userTokenWalletAddress);

  // Tunnel
  // - Deploy tunnel
  // const Tunnel = await locklift.factory.getContract("Tunnel");
  //
  // const tunnel = await locklift.giver.deployContract({
  //   contract: Tunnel,
  //   constructorParams: {
  //     sources: [],
  //     destinations: [],
  //     owner_: user.address,
  //   },
  //   initParams: {
  //     _randomNonce,
  //   },
  //   keyPair,
  // });
  const { contract: tunnel } = await locklift.factory.deployContract({
    contract: "Tunnel",
    publicKey: keyPair.publicKey,
    value: toNano(2),
    initParams: {
      _randomNonce: getRandomNonce(),
    },
    constructorParams: {
      sources: [],
      destinations: [],
      owner_: user.address,
    },
  });

  logger.log(`Tunnel address: ${tunnel.address}`);

  // Vault
  // - Deploy vault
  // const Vault = await locklift.factory.getContract("Vault");
  //
  // const vault = await locklift.giver.deployContract({
  //   contract: Vault,
  //   constructorParams: {
  //     owner_: user.address,
  //     root_tunnel: tunnel.address,
  //     root: root.address,
  //     receive_safe_fee: locklift.utils.convertCrystal(1, "nano"),
  //     settings_deploy_wallet_grams: locklift.utils.convertCrystal(0.05, "nano"),
  //     initial_balance: locklift.utils.convertCrystal(1, "nano"),
  //   },
  //   initParams: {
  //     _randomNonce,
  //   },
  //   keyPair,
  // });
  const { contract: vault } = await locklift.transactions.waitFinalized(
    locklift.factory.deployContract({
      contract: "Vault",
      constructorParams: {
        owner_: user.address,
        root_tunnel: tunnel.address,
        root: root.address,
        receive_safe_fee: toNano(1),
        settings_deploy_wallet_grams: toNano(0.05),
        initial_balance: toNano(1),
      },
      value: toNano(2),
      initParams: {
        _randomNonce: getRandomNonce(),
      },
      publicKey: keyPair.publicKey,
    }),
  );

  logger.log(`Vault address: ${vault.address}`);

  // Wait until user token wallet is presented into the GraphQL

  // - Setup vault token wallet
  const vaultTokenWalletAddress = await vault.methods
    .token_wallet()
    .call()
    .then(res => res.token_wallet);

  // const vaultTokenWallet = await locklift.factory.getContract("TokenWallet", TOKEN_PATH);
  // vaultTokenWallet.setAddress(vaultTokenWalletAddress);
  // vaultTokenWallet.name = "Vault token wallet";
  const vaultTokenWallet = await locklift.factory.getDeployedContract("TokenWallet", vaultTokenWalletAddress);
  logger.log(`Vault token wallet address: ${vaultTokenWallet.address}`);

  // Proxy token transfer
  // - Deploy proxy token transfer
  // const ProxyTokenTransfer = await locklift.factory.getContract("ProxyTokenTransfer");
  // const proxyTokenTransfer = await locklift.giver.deployContract({
  //   contract: ProxyTokenTransfer,
  //   constructorParams: {
  //     owner_: user.address,
  //   },
  //   initParams: {
  //     _randomNonce,
  //   },
  //   keyPair,
  // });
  const { contract: proxyTokenTransfer } = await locklift.transactions.waitFinalized(
    locklift.factory.deployContract({
      contract: "ProxyTokenTransfer",
      constructorParams: {
        owner_: user.address,
      },
      initParams: {
        _randomNonce: getRandomNonce(),
      },
      publicKey: keyPair.publicKey,
      value: toNano(2),
    }),
  );

  logger.log(`Proxy token transfer: ${proxyTokenTransfer.address}`);

  // - Set configuration (use user as ethereum configuration to emulate callbacks)
  // await user.runTarget({
  //   contract: proxyTokenTransfer,
  //   method: "setConfiguration",
  //   params: {
  //     _config: {
  //       tonConfiguration: user.address,
  //       ethereumConfigurations: [user.address],
  //       root: root.address,
  //       settingsDeployWalletGrams: locklift.utils.convertCrystal(0.5, "nano"),
  //       settingsTransferGrams: locklift.utils.convertCrystal(0.5, "nano"),
  //     },
  //   },
  // });
  await locklift.transactions.waitFinalized(
    proxyTokenTransfer.methods
      .setConfiguration({
        _config: {
          tonConfiguration: user.address,
          ethereumConfigurations: [user.address],
          root: root.address,
          settingsDeployWalletGrams: toNano(0.5),
          settingsTransferGrams: toNano(0.5),
        },
      })
      .send({
        from: user.address,
        amount: toNano(3),
      }),
  );
  // - Setup proxy token transfer token wallet
  const proxyTokenWalletAddress = await proxyTokenTransfer.methods
    .token_wallet()
    .call()
    .then(res => res.token_wallet);

  const proxyTokenWallet = await locklift.factory.getDeployedContract("TokenWallet", proxyTokenWalletAddress);

  logger.log(`Proxy token wallet address: ${proxyTokenWallet.address}`);

  // await waitForAddressToBeActive(proxyTokenWallet.address);

  // Finish setup
  // - Transfer root ownership to tunnel
  // await user.runTarget({
  //   contract: root,
  //   method: "transferOwnership",
  //   params: {
  //     newOwner: tunnel.address,
  //     remainingGasTo: user.address,
  //     callbacks: {},
  //   },
  // });
  await root.methods
    .transferOwnership({
      newOwner: tunnel.address,
      remainingGasTo: user.address,
      callbacks: [],
    })
    .send({
      from: user.address,
      amount: toNano(2),
    });
  // - Add vault to tunnel sources
  // await user.runTarget({
  //   contract: tunnel,
  //   method: "__updateTunnel",
  //   params: {
  //     source: vault.address,
  //     destination: root.address,
  //   },
  // });
  await tunnel.methods
    .__updateTunnel({
      source: vault.address,
      destination: root.address,
    })
    .send({
      from: user.address,
      amount: toNano(2),
    });

  // - Drain vault

  // await user.runTarget({
  //   contract: vault,
  //   method: "drain",
  //   params: {
  //     receiver: user.address,
  //   },
  // });
  await vault.methods
    .drain({
      receiver: user.address,
    })
    .send({
      from: user.address,
      amount: toNano(2),
    });
  return { vault, tunnel, user, root, userTokenWallet, vaultTokenWallet, proxyTokenTransfer, proxyTokenWallet };
};

export const getVaultMetrics = async function (
  userTokenWallet: Contract<TokenWalletAbi> | Contract<TokenWalletUpgradeableAbi>,
  user: Account,
  vaultTokenWallet: Contract<TokenWalletAbi>,
  vault: Contract<VaultAbi>,
  root: Contract<TokenRootAbi> | Contract<TokenRootUpgradeableAbi>,
) {
  return {
    userWEVERBalance: userTokenWallet
      ? await userTokenWallet.methods
          .balance({ answerId: 0 })
          .call()
          .then(res => res.value0)
      : 0,
    userEVERBalance: user ? await locklift.provider.getBalance(user.address) : 0,
    vaultWEVERBalance: vaultTokenWallet
      ? await vaultTokenWallet.methods
          .balance({ answerId: 0 })
          .call()
          .then(res => res.value0)
      : 0,
    vaultEVERBalance: vault ? await locklift.provider.getBalance(vault.address) : 0,
    vaultTotalWrapped: vault
      ? await vault.methods
          .total_wrapped()
          .call()
          .then(res => res.total_wrapped)
      : 0,
    WEVERTotalSupply: root
      ? await root.methods
          .totalSupply({ answerId: 0 })
          .call()
          .then(res => res.value0)
      : 0,
  };
};
type VaultMetrics = ReturnType<typeof getVaultMetrics> extends Promise<infer F> ? F : never;
const getBalanceDif = <T extends Record<string, string | number>>(initial: T, final: T): T => {
  return Object.entries(initial).reduce((acc, [key, initialValue]) => {
    return { ...acc, [key]: Number(fromNano(Number(final[key]) - Number(initialValue))) };
  }, {} as T);
};
export const getMetricsChange = function (initial: VaultMetrics, final: VaultMetrics): VaultMetrics {
  return getBalanceDif(initial, final);
};
export const logMetricsChange = function (change: VaultMetrics) {
  logger.log(`User wEVER balance change: ${change.userWEVERBalance}`);
  logger.log(`User EVER balance change: ${change.userEVERBalance}`);
  logger.log(`Vault wEVER balance change: ${change.vaultWEVERBalance}`);
  logger.log(`Vault EVER balance change: ${change.vaultEVERBalance}`);
  logger.log(`Vault total wrapped change: ${change.vaultTotalWrapped}`);
  logger.log(`wEVER total supply change: ${change.WEVERTotalSupply}`);
};

export const isValidTonAddress = (address: string) => /^(?:-1|0):[0-9a-fA-F]{64}$/.test(address);
