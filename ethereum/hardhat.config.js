require('hardhat-deploy');
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require('hardhat-abi-exporter');
require("@nomiclabs/hardhat-web3");


const multisig = {
  main: '0xe29B04B9c6712080f79B2dAc5211B18B279D5DE0',
  polygon: '0xB8dD7223edc08A1681c81278D31d644576ECF0b4',
  bsc: '0xbF13DBbf86B6B1cc02a4169Dde38E16862C77a0a',
  fantom: '0x5B2329A2b2B5ec2f5F77afb6826F825dcec3A3Fd'
};


/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: '0.8.2',
    settings: {
      optimizer: {
        enabled: true
      }
    }
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    owner: {
      default: 1,
      main: multisig.main,
      polygon: multisig.polygon,
      bsc: multisig.bsc,
      fantom: multisig.fantom,
    },
    bridge: {
      default: '0x0000000000000000000000000000000000000000', // BridgeMockup will be used for tests
      main: '0x5889d26Ad270540E315B028Dd39Ae0ECB3De6179',
      polygon: '0x9f6898d5D36e2a4b9A0c6e58A0e86525475f58d7',
      bsc: '0xa3CbceE67325bCa03aCCcD06b9121955CCF224C3',
      fantom: '0x6dF42fdE8BC7AF2596a450b9af306EA2060Ec8dc'
    },
    alice: {
      default: 3,
    },
    bob: {
      default: 4,
    },
    eve: {
      default: 5,
    },
  },
  networks: {
    hardhat: {
      chainId: 1111,
    },
    main: {
      url: 'https://mainnet.infura.io/v3/f3ca4333bf4a41308d0a277ae1c09336',
      gasPrice: 100000000000, // 100 gwei
      gas: 3000000,
      timeout: 1000000,
      accounts: {
        mnemonic: process.env.ETH_MNEMONIC,
        count: 50
      },
    },
    polygon: {
      url: 'https://matic-mainnet.chainstacklabs.com',
      gasPrice: 1001000000, // 1.001 gwei
      gas: 3000000,
      timeout: 1000000,
      accounts: {
        mnemonic: process.env.ETH_MNEMONIC,
        count: 50
      },
    },
    bsc: {
      url: 'https://bsc-dataseed.binance.org/',
      gasPrice: 5000000000, // 5 gwei
      gas: 3000000,
      timeout: 1000000,
      accounts: {
        mnemonic: process.env.ETH_MNEMONIC,
        count: 50
      },
    },
    fantom: {
      url: 'https://rpc.ftm.tools/',
      gasPrice: 550000000000, // 550 gwei
      gas: 3000000,
      timeout: 1000000,
      accounts: {
        mnemonic: process.env.ETH_MNEMONIC,
        count: 50
      },
    },
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 100,
    enabled: true,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    outputFile: 'gas-report.txt',
    noColors: true,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY
  },
  abiExporter: {
    path: './abi',
    clear: true,
    flat: true,
    spacing: 2
  },
};
