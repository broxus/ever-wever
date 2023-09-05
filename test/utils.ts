import {
    Address,
    Contract,
    fromNano,
} from "locklift";

import {
    TokenWalletUpgradeableAbi,
    VaultAbi, VaultTokenRoot_V1Abi, VaultTokenWallet_V1Abi, TunnelAbi, TokenRootUpgradeableAbi
} from "../build/factorySource";

import { Account } from "everscale-standalone-client";

const logger = require("mocha-logger");

const chai = require("chai");
chai.use(require("chai-bignumber")());

export const {expect} = chai;

export const stringToBytesArray = (dataString: string) => {
  return Buffer.from(dataString).toString("hex");
};

export const getAddress = (id) => {
    const body = (id).toString(16).padStart(64, '0');

    return new Address(`0:${body}`);
}

export function splitToNChunks(array: any[], n: number) {
    let result = [];
    for (let i = n; i > 0; i--) {
        result.push(array.splice(0, Math.ceil(array.length / i)));
    }
    return result;
}

export function randomChoice(arr: any[]) {
    return arr[Math.floor(arr.length * Math.random())];
}


export const getTokenWalletAddress = async function (
  root: Contract<VaultTokenRoot_V1Abi> | Contract<TokenRootUpgradeableAbi>,
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

enum VaultType {
  Legacy = 'Legacy',
  Root = 'Root'
}


export const getUser = async (
  name: string,
  type: VaultType
): Promise<[Account, Contract<VaultTokenWallet_V1Abi> | Contract<TokenWalletUpgradeableAbi>]> => {
  const {
    account: user
  } = await locklift.deployments.getAccount(name);

  const userTokenWallet = await locklift.deployments.getContract(`Vault${type}${name}TokenWallet`);

  return [
    user,
    type === VaultType.Legacy ? 
      userTokenWallet as Contract<TokenWalletUpgradeableAbi> :
      userTokenWallet as Contract<VaultTokenWallet_V1Abi>
  ];
}

export const setupVaultRoot = async () => {
  const vault = await locklift.deployments.getContract<VaultTokenRoot_V1Abi>('VaultRoot');

  const vaultTokenWallet = await locklift.deployments.getContract<VaultTokenWallet_V1Abi>('VaultRootRootTokenWallet');

  const [alice, aliceTokenWallet] = await getUser('Alice', VaultType.Root);
  const [bob, bobTokenWallet] = await getUser('Bob', VaultType.Root);
  const [owner, ownerTokenWallet] = await getUser('Owner', VaultType.Root);

  return {
    vault, vaultTokenWallet,
    alice, aliceTokenWallet,
    bob, bobTokenWallet,
    owner, ownerTokenWallet,
  };
};

export const setupVaultLegacy = async () => {
  const tunnel = await locklift.deployments.getContract<TunnelAbi>('LegacyTunnel');
  const root = await locklift.deployments.getContract<TokenRootUpgradeableAbi>('LegacyRoot');
  const vault = await locklift.deployments.getContract<VaultAbi>('LegacyVault');

  const vaultTokenWallet = await locklift.deployments.getContract<TokenWalletUpgradeableAbi>('LegacyRootVaultTokenWallet');

  const [alice, aliceTokenWallet] = await getUser('Alice', VaultType.Legacy);
  const [bob, bobTokenWallet] = await getUser('Bob', VaultType.Legacy);
  const [owner, ownerTokenWallet] = await getUser('Owner', VaultType.Legacy);

  return {
    vault, vaultTokenWallet,
    alice, aliceTokenWallet,
    bob, bobTokenWallet,
    owner, ownerTokenWallet,
    tunnel, root
  };
}

export const getVaultMetrics = async function (
  userTokenWallet: Contract<VaultTokenWallet_V1Abi> | Contract<TokenWalletUpgradeableAbi>,
  user: Account,
  vaultTokenWallet: Contract<VaultTokenWallet_V1Abi> | Contract<TokenWalletUpgradeableAbi>,
  vault: Contract<VaultAbi> | Contract<VaultTokenRoot_V1Abi>,
  root_?: Contract<VaultTokenRoot_V1Abi> | Contract<TokenRootUpgradeableAbi> | null,
) {
  let root;

  if (root_) {
    root = root_;
  } else {
    root = await locklift.factory.getDeployedContract(
      'TokenRootUpgradeable',
      vault.address
    );
  }

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
    WEVERTotalSupply: vault
      ? await root.methods
          .totalSupply({ answerId: 0 })
          .call()
          .then(res => res.value0)
      : 0,
    rootWEVERBalance: await locklift.provider.getBalance(root.address),
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
  logger.log(`wEVER total supply change: ${change.WEVERTotalSupply}`);
  logger.log(`Root EVER balance change: ${change.rootWEVERBalance}`)
};

export const isValidTonAddress = (address: string) => /^(?:-1|0):[0-9a-fA-F]{64}$/.test(address);

export const ZERO_ADDRESS = '0:0000000000000000000000000000000000000000000000000000000000000000';
export const EMPTY_TVM_CELL = "te6ccgEBAQEAAgAAAA==";
