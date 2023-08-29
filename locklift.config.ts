import { LockliftConfig } from "locklift";

import * as chai from "chai";

import { lockliftChai } from "locklift/chaiPlugin";
chai.use(lockliftChai);
import * as fs from "fs";
import path from "path";
import { FactorySource } from "./build/factorySource";

import "@broxus/locklift-deploy";
import { Deployments } from "@broxus/locklift-deploy";

declare global {
  const locklift: import("locklift").Locklift<FactorySource>;
}

import "@broxus/locklift-verifier";

declare module "locklift" {
  //@ts-ignore
  export interface Locklift {
    deployments: Deployments<FactorySource>;
  }
}

const LOCAL_NETWORK_ENDPOINT = process.env.NETWORK_ENDPOINT || "http://localhost/graphql";
const DEV_NET_NETWORK_ENDPOINT = process.env.DEV_NET_NETWORK_ENDPOINT || "https://devnet-sandbox.evercloud.dev/graphql";

// Create your own link on https://dashboard.evercloud.dev/
const MAIN_NET_NETWORK_ENDPOINT = process.env.MAIN_NET_NETWORK_ENDPOINT || "https://mainnet.evercloud.dev/XXX/graphql";

const VENOM_DEVNET_ENDPOINT = process.env.VENOM_DEVNET_ENDPOINT || "https://jrpc-devnet.venom.foundation/";
const VENOM_DEVNET_TRACE_ENDPOINT =
    process.env.VENOM_DEVNET_TRACE_ENDPOINT || "https://gql-devnet.venom.network/graphql";

const config: LockliftConfig = {
  verifier: {
    verifierVersion: "latest", // contract verifier binary, see https://github.com/broxus/everscan-verify/releases
    apiKey: "uwJlTyvauW",
    secretKey: "IEx2jg4hqE3V1YUqcVOY",
    // license: "AGPL-3.0-or-later", <- this is default value and can be overrided
  },
  compiler: {
    // Specify path to your TON-Solidity-Compiler
    // path: "/mnt/o/projects/broxus/TON-Solidity-Compiler/build/solc/solc",

    // Or specify version of compiler
    version: "0.57.1",
  },
  linker: {
    // Or specify version of linker
    version: "0.15.35",
  },
  networks: {
    local: {
      // Specify connection settings for https://github.com/broxus/everscale-standalone-client/
      connection: {
        id: 1,
        // group: "localnet",
        type: "graphql",
        data: {
          endpoints: [LOCAL_NETWORK_ENDPOINT],
          latencyDetectionInterval: 1000,
          local: true,
        },
      },
      // This giver is default local-node giverV2
      giver: {
        address: "0:ece57bcc6c530283becbbd8a3b24d3c5987cdddc3c8b7b33be6e4a6312490415",
        key: "172af540e43a524763dd53b26a066d472a97c4de37d5498170564510608250c3",
      },
      tracing: {
        endpoint: LOCAL_NETWORK_ENDPOINT,
      },
      keys: {
        // Use everdev to generate your phrase
        // !!! Never commit it in your repos !!!
        phrase: "expire caution sausage spot monkey prefer dad rib vicious pepper mimic armed",
        amount: 20,
      },
    },
    main: {
      // Specify connection settings for https://github.com/broxus/everscale-standalone-client/
      connection: "mainnetJrpc",
      giver: {
        address: "0:3bcef54ea5fe3e68ac31b17799cdea8b7cffd4da75b0b1a70b93a18b5c87f723",
        key: process.env.MAIN_GIVER_KEY ?? "",
      },
      tracing: {
        endpoint: MAIN_NET_NETWORK_ENDPOINT,
      },
      keys: {
        amount: 500,
      },
    },
    venom_testnet: {
      connection: {
        id: 1000,
        group: "group",
        type: "jrpc",
        data: {
          endpoint: "https://jrpc-testnet.venom.foundation"
        },
      },
      giver: {
        address: process.env.VENOM_GIVER_ADDRESS ?? "",
        phrase: process.env.VENOM_GIVER_PHRASE ?? "",
        accountId: 0,
      },
      keys: {
        phrase: process.env.VENOM_SEED ?? '',
        amount: 20
      }
    }
  },
  mocha: {
    timeout: 2000000,
    bail: true,
  },
};

export default config;
