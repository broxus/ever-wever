const logger = require('mocha-logger');
const fs = require('fs');
const BigNumber = require('bignumber.js');
BigNumber.config({ EXPONENTIAL_AT: 257 });


const stringToBytesArray = (dataString) => {
  return Buffer.from(dataString).toString('hex')
};


const getRandomNonce = () => Math.random() * 64000 | 0;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const afterRun = async (tx) => {
  if (locklift.network === 'dev' || locklift.network === 'main') {
    await sleep(60000);
  }
};


const {
  utils: {
    convertCrystal
  }
} = locklift;


const logTx = (tx) => logger.success(`Transaction: ${tx.transaction.id}`);


// TODO: check before run!
const data = {
  bridge: '0:5e3a8f4f1650718a536f5278fd8b200e3b01a32d2b546c6b009c9e9f3ef68438',
  rootMetaFactory: '0:48024844faae071f53ac7bba0e5eac2fe06a722e5fd8100392673581486455cc',
  ethereumEvent: {
    eventAddress: new BigNumber('0xdceeae4492732c04b5224841286bf7146aa299df'.toLowerCase()),
    eventBlocksToConfirm: 12,
    // May-18-2021 11:44:47 PM +UTC
    startBlockNumber: 12461417,
  },
  tonEvent: {
    proxyAddress: new BigNumber('0xdceeae4492732c04b5224841286bf7146aa299df'.toLowerCase()),
    startTimestamp: 1621381526,
  },
  multisig: '0:ad091843febdbaf72308bf9c45067817e254965c28a692b5c4187f8c7fab6c81',
};


async function main() {
  logger.log(`Giver balance: ${convertCrystal(await locklift.ton.getBalance(locklift.networkConfig.giver.address), 'ton')}`);
  
  const [keyPair] = await locklift.keys.getKeyPairs();

  logger.log(`Owner keypair: ${JSON.stringify(keyPair)}`);
  
  logger.log(`Deploying cell encoder`);
  
  const CellEncoder = await locklift.factory.getContract(
    'CellEncoder',
    './../node_modules/ethereum-freeton-bridge-contracts/free-ton/build'
  );
  
  const cellEncoder = await locklift.giver.deployContract({
    contract: CellEncoder,
    constructorParams: {},
    initParams: {
      _randomNonce: getRandomNonce(),
    },
    keyPair,
  }, convertCrystal(1, 'nano'));
  
  logger.success(`Cell encoder: ${cellEncoder.address}`);
  
  logger.log(`Deploying owner`);
  
  const Account = await locklift.factory.getAccount();
  
  const owner = await locklift.giver.deployContract({
    contract: Account,
    constructorParams: {},
    initParams: {
      _randomNonce: getRandomNonce(),
    },
    keyPair,
  }, locklift.utils.convertCrystal(30, 'nano'));
 
  owner.setKeyPair(keyPair);
  owner.afterRun = afterRun;
  
  logger.success(`Owner: ${owner.address}`);
  
  logger.log(`Deploying WTON`);
  
  const RootToken = await locklift.factory.getContract(
    'RootTokenContract',
    './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
  );
  
  const TokenWallet = await locklift.factory.getContract(
    'TONTokenWallet',
    './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
  );
  
  const root = await locklift.giver.deployContract({
    contract: RootToken,
    constructorParams: {
      root_public_key_: `0x${keyPair.public}`,
      root_owner_address_: locklift.ton.zero_address
    },
    initParams: {
      name: stringToBytesArray('Wrapped TON'),
      symbol: stringToBytesArray('WTON'),
      decimals: 9,
      wallet_code: TokenWallet.code,
      _randomNonce: getRandomNonce(),
    },
    keyPair,
  });
  
  root.afterRun = afterRun;
  
  logger.success(`WTON root: ${root.address}`);
  
  logger.log(`Deploying tunnel`);

  const Tunnel = await locklift.factory.getContract('Tunnel');
  
  const tunnel = await locklift.giver.deployContract({
    contract: Tunnel,
    constructorParams: {
      sources: [],
      destinations: [],
      owner_: owner.address,
    },
    initParams: {
      _randomNonce: getRandomNonce(),
    },
    keyPair,
  });
  
  logger.success(`Tunnel address: ${tunnel.address}`);
  
  logger.log(`Deploying vault`);
  
  const WrappedTONVault = await locklift.factory.getContract('WrappedTONVault');
  
  const vault = await locklift.giver.deployContract({
    contract: WrappedTONVault,
    constructorParams: {
      owner_: owner.address,
      root_tunnel: tunnel.address,
      root: root.address,
      receive_safe_fee: convertCrystal(1, 'nano'),
      settings_deploy_wallet_grams: convertCrystal(0.05, 'nano'),
      initial_balance: convertCrystal(1, 'nano')
    },
    initParams: {
      _randomNonce: getRandomNonce(),
    },
    keyPair,
  });

  logger.success(`Vault address: ${vault.address}`);

  logger.log(`Setting vault token wallet receive callback`);
  
  let tx = await owner.runTarget({
    contract: vault,
    method: 'setTokenWalletReceive',
    params: {},
  });
  
  logTx(tx);
  
  logger.log(`Transferring root ownership to tunnel`);
  
  tx = await root.run({
    method: 'transferOwner',
    params: {
      root_public_key_: 0,
      root_owner_address_: tunnel.address,
    },
    keyPair,
  });
  
  logTx(tx);
  
  logger.log(`Adding tunnel (vault, root)`);
  
  tx = await owner.runTarget({
    contract: tunnel,
    method: '__updateTunnel',
    params: {
      source: vault.address,
      destination: root.address,
    }
  });
  
  logTx(tx);
  
  logger.log(`Draining vault`);
  
  tx = await owner.runTarget({
    contract: vault,
    method: 'drain',
    params: {
      receiver: owner.address,
    },
  });
  
  logTx(tx);
  
  logger.log(`Deploying token event proxy`);
  
  const TokenEventProxy = await locklift.factory.getContract('TokenEventProxy');
  
  const tokenEventProxy = await locklift.giver.deployContract({
    contract: TokenEventProxy,
    constructorParams: {
      external_owner_pubkey_: 0,
      internal_owner_address_: owner.address,
    },
    initParams: {
      _randomNonce: getRandomNonce(),
    },
    keyPair
  });
  
  logger.success(`Token event proxy: ${tokenEventProxy.address}`);
  
  const eventMeta = await cellEncoder.call({
    method: 'encodeConfigurationMeta',
    params: {
      rootToken: root.address,
    }
  });
  
  logger.log(`Ethereum / TON event meta: ${eventMeta}`);
  
  logger.log(`Deploying ethereum event configuration`);

  const EthereumEventConfiguration = await locklift.factory.getContract(
    'EthereumEventConfiguration',
    './../node_modules/ethereum-freeton-bridge-contracts/free-ton/build'
  );
  
  const EthereumEvent = await locklift.factory.getContract('EthereumEvent');
  
  const [ethereumEventAbi] = JSON
    .parse(fs.readFileSync('./../ethereum/abi/ProxyTokenMint.json').toString())
    .filter(f => f.name === 'TokenBurn' && f.type === 'event');
  
  logger.log(`Ethereum event ABI: ${JSON.stringify(ethereumEventAbi)}`);
  
  const ethereumEventConfiguration = await locklift.giver.deployContract({
    contract: EthereumEventConfiguration,
    constructorParams: {},
    initParams: {
      basicInitData: {
        eventABI: stringToBytesArray(JSON.stringify(ethereumEventAbi)),
        eventRequiredConfirmations: 2,
        eventRequiredRejects: 2,
        eventCode: EthereumEvent.code,
        bridgeAddress: data.bridge,
        eventInitialBalance: convertCrystal('10', 'nano'),
        meta: eventMeta
      },
      initData: {
        proxyAddress: tokenEventProxy.address,
        ...data.ethereumEvent
      }
    },
    keyPair,
  }, convertCrystal(50, 'nano'));
  
  logger.success(`Ethereum event configuration: ${ethereumEventConfiguration.address}`);
  
  logger.log(`Deploying TON event configuration`);
  
  const TonEventConfiguration = await locklift.factory.getContract(
    'TonEventConfiguration',
    './../node_modules/ethereum-freeton-bridge-contracts/free-ton/build'
  );
  
  const TonEvent = await locklift.factory.getContract('TonEvent');
  
  const [tonEventABI] = JSON
    .parse(fs.readFileSync('./../freeton/build/TokenEventProxy.abi.json').toString())
    .events
    .filter(f => f.name === 'TokenBurn');
  
  logger.log(`TON event ABI: ${JSON.stringify(tonEventABI)}`);
  
  const tonEventConfiguration = await locklift.giver.deployContract({
    contract: TonEventConfiguration,
    constructorParams: {},
    initParams: {
      basicInitData: {
        eventABI: stringToBytesArray(JSON.stringify(tonEventABI)),
        eventRequiredConfirmations: 2,
        eventRequiredRejects: 2,
        eventCode: TonEvent.code,
        bridgeAddress: data.bridge,
        eventInitialBalance: convertCrystal('10', 'nano'),
        meta: eventMeta
      },
      initData: {
        eventAddress: tokenEventProxy.address,
        ...data.tonEvent,
      }
    },
    keyPair,
  }, convertCrystal(50, 'nano'));
  
  logger.success(`Ton event configuration: ${tonEventConfiguration.address}`);
  
  logger.log(`Setting up event proxy`);
  
  tx = await owner.runTarget({
    contract: tokenEventProxy,
    method: 'setConfiguration',
    params: {
      _config: {
        ethereum_event_code: EthereumEvent.code,
        outdated_token_roots: [],
        ethereum_event_deploy_pubkey: `0x${keyPair.public}`,
        ethereum_event_configuration_address: ethereumEventConfiguration.address,
        token_root_address: root.address,
        root_tunnel: tunnel.address,
        settings_burn_min_msg_value: convertCrystal(1, 'nano'),
        settings_deploy_wallet_grams: convertCrystal(0.05, 'nano')
      }
    }
  });
  
  logTx(tx);
  
  logger.log(`Adding tunnel (event proxy, root)`);
  
  tx = await owner.runTarget({
    contract: tunnel,
    method: '__updateTunnel',
    params: {
      source: tokenEventProxy.address,
      destination: root.address,
    }
  });
  
  logTx(tx);
  
  logger.log(`Deploy root meta`);
  
  const rootMetaFactory = await locklift.factory.getContract('RootMetaFactory');

  rootMetaFactory.setAddress(data.rootMetaFactory);
  
  tx = await owner.runTarget({
    contract: rootMetaFactory,
    method: 'deploy',
    params: {
      owner: owner.address,
      root: root.address,
    }
  });
  
  logTx(tx);
  
  const rootMetaAddress = await rootMetaFactory.call({
    method: 'deploy',
    params: {
      owner: owner.address,
      root: root.address
    }
  });
  
  logger.success(`Root meta: ${rootMetaAddress}`);
  
  logger.log(`Setup token event proxy in root meta`);
  
  const rootMeta = await locklift.factory.getContract('RootMeta');
  rootMeta.setAddress(rootMetaAddress);
  
  const encodedEventProxy = await cellEncoder.call({
    method: 'encodeConfigurationMeta',
    params: {
      rootToken: tokenEventProxy.address,
    }
  });
  
  logger.log(`Encoded token event proxy: ${encodedEventProxy}`);
  
  tx = await owner.runTarget({
    contract: rootMeta,
    method: 'setValue',
    params: {
      key: 0,
      value: encodedEventProxy,
    }
  });
  
  logTx(tx);
  
  logger.log(`Transferring root meta ownership to multisig`);
  
  tx = await owner.runTarget({
    contract: rootMeta,
    method: 'transferOwnership',
    params: {
      owner_: data.multisig
    }
  });
  
  logTx(tx);
  
  logger.log(`Transferring tunnel ownership to multisig`);
  
  tx = await owner.runTarget({
    contract: tunnel,
    method: 'transferOwnership',
    params: {
      owner_: data.multisig
    }
  });
  
  logTx(tx);
  
  logger.log(`Transferring vault ownership to multisig`);
  
  tx = await owner.runTarget({
    contract: vault,
    method: 'transferOwnership',
    params: {
      owner_: data.multisig
    }
  });
  
  logTx(tx);
  
  logger.log(`Transferring token event proxy ownership to multisig`);
  
  tx = await owner.runTarget({
    contract: tokenEventProxy,
    method: 'transferOwner',
    params: {
      external_owner_pubkey_: 0,
      internal_owner_address_: data.multisig,
    }
  });
  
  logTx(tx);
  
  logger.log(`Giver balance: ${convertCrystal(await locklift.ton.getBalance(locklift.networkConfig.giver.address), 'ton')}`);
}


main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
