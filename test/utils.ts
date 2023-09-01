import {
    Address,
    Contract,
    fromNano,
} from "locklift";

import {
    TokenWalletUpgradeableAbi,
    VaultAbi, VaultTokenRoot_V1Abi, VaultTokenWallet_V1Abi, TunnelAbi
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
  root: Contract<VaultTokenRoot_V1Abi>,
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

export const getUser = async (name: string) => {
    const {
        account: user
    } = await locklift.deployments.getAccount(name);

    const userTokenWallet = await locklift.deployments.getContract<VaultTokenWallet_V1Abi>(`${name}TokenWallet`);

    return {
        user, userTokenWallet
    }
}

export const setupWever = async () => {
    const vault = await locklift.deployments.getContract<VaultTokenRoot_V1Abi>('Vault');

    const vaultTokenWallet = await locklift.deployments.getContract<VaultTokenWallet_V1Abi>('VaultTokenWallet');

    const { user: alice, userTokenWallet: aliceTokenWallet } = await getUser('Alice');
    const { user: bob, userTokenWallet: bobTokenWallet } = await getUser('Bob');
    const { user: owner, userTokenWallet: ownerTokenWallet } = await getUser('VaultOwner');

    return {
        vault, vaultTokenWallet,
        alice, aliceTokenWallet,
        bob, bobTokenWallet,
        owner, ownerTokenWallet,
    };
};

export const setupLegacyWever = async() => {
    const vault = await locklift.deployments.getContract<VaultAbi>('LegacyVault');

    const vaultTokenWallet = await locklift.deployments.getContract<VaultTokenWallet_V1Abi>('LegacyVaultTokenWallet');

    const { user: alice, userTokenWallet: aliceTokenWallet } = await getUser('Alice');
    const { user: bob, userTokenWallet: bobTokenWallet } = await getUser('Bob');
    const { user: owner, userTokenWallet: ownerTokenWallet } = await getUser('VaultOwner');

    return {
        vault, vaultTokenWallet,
        alice, aliceTokenWallet,
        bob, bobTokenWallet,
        owner, ownerTokenWallet,
    };
}

export const getVaultMetrics = async function (
  userTokenWallet: Contract<VaultTokenWallet_V1Abi>,
  user: Account,
  vaultTokenWallet: Contract<VaultTokenWallet_V1Abi>,
  vault: Contract<VaultAbi>,
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
    WEVERTotalSupply: vault
      ? await vault.methods
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
  logger.log(`wEVER total supply change: ${change.WEVERTotalSupply}`);
};

export const isValidTonAddress = (address: string) => /^(?:-1|0):[0-9a-fA-F]{64}$/.test(address);

export const ZERO_ADDRESS = '0:0000000000000000000000000000000000000000000000000000000000000000';
export const EMPTY_TVM_CELL = "te6ccgEBAQEAAgAAAA==";
