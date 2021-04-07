const logger = require('mocha-logger');
const getRandomNonce = () => Math.random() * 64000 | 0;


async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const afterRun = async (tx) => {
  if (locklift.network === 'dev' || locklift.network === 'main') {
    await sleep(60000);
  }
};


// TODO: check before run!
const data = {
  owner: '0:05ad67159b8e663e97fd4b812ff01e70505256297e26d1ef386abae00ceff4cf',
  meta: [
    // [root, token event proxy]
    [
      '0:ce7170dc3144b47c2a8217a0ab8506729f6310e1311017b20304ea0b973b160d',
      '0:5f4a4509338ed8029ce819826974beed675cc6257237459018b76cbe564f4af8'
    ],
    [
      '0:0bacf88b63b1a8b0811a23aa74e7ffe735047a1486229730c92d0d43a9660f8d',
      '0:988822229427fe84d222849b63d7af9a93c6c2b7055810e0bb075d5862b524f0'
    ],
    [
      '0:205be6579a2dde82833986f612c2f2d45d5bdb26bf5f46ebec1ec99e72118f9b',
      '0:5b3a535754e8b38dfa1d0b2b91c095166bcdd66bfdb41fd17da9577d02f7a30f'
    ],
    [
      '0:f6f7e95d07aef52007671cdcaccbee221839e7a20bc7125e7641f65b473efee5',
      '0:5980eeff7edb37c0d7f2c535120074007efdff82b33c8d79bfa9758d28f1acb7'
    ],
    [
      '0:8580ffd20c6da4cc2bb6f946cb08fbec85bbe67041962ad8ed71dd1a0b0fa0b0',
      '0:294c2e892ce55d4d3d573bb1e98c143f79f377e1578b54b744a5fa3b14dcd6dc'
    ],
    // TODO: add WTON [root, event proxy]
  ],
  multisig: '0:ad091843febdbaf72308bf9c45067817e254965c28a692b5c4187f8c7fab6c81',
};


async function main() {
  const [keyPair] = await locklift.keys.getKeyPairs();
  
  logger.log(`Owner keypair: ${JSON.stringify(keyPair)}`);
  logger.log(`Owner address: ${data.owner}`);
  
  const owner = await locklift.factory.getAccount();
  owner.setKeyPair(keyPair);
  owner.setAddress(data.owner);
  owner.afterRun = afterRun;
  
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
  });
  
  logger.success(`Cell encoder: ${cellEncoder.address}`);
  
  logger.log(`Deploying root meta factory`);
  
  const RootMetaFactory = await locklift.factory.getContract('RootMetaFactory');
  const rootMeta = await locklift.factory.getContract('RootMeta');
  
  const rootMetaFactory = await locklift.giver.deployContract({
    contract: RootMetaFactory,
    constructorParams: {
      code_: rootMeta.code,
    },
    initParams: {
      _randomNonce: getRandomNonce(),
    },
    keyPair,
  }, locklift.utils.convertCrystal(10, 'nano'));
  
  logger.success(`Root meta factory: ${rootMetaFactory.address}`);
  
  logger.log(`Setting up root metas`);
  
  console.log('');
  
  for (const [root, eventProxy] of data.meta) {
    logger.log(`Setting up root meta for ${root}`);
    
    const tx = await owner.runTarget({
      contract: rootMetaFactory,
      method: 'deploy',
      params: {
        owner: owner.address,
        root
      }
    });
    
    logger.log(`Deploy root meta tx: ${tx.transaction.id}`);
  
    const rootMetaAddress = await rootMetaFactory.call({
      method: 'deploy',
      params: {
        owner: owner.address,
        root
      }
    });
    
    logger.success(`Root meta address: ${rootMetaAddress}`);

    const encodedEventProxy = await cellEncoder.call({
      method: 'encodeConfigurationMeta',
      params: {
        rootToken: eventProxy,
      }
    });
    
    logger.log(`Encoded event proxy: ${encodedEventProxy}`);
    
    // Set meta
    rootMeta.setAddress(rootMetaAddress);
    
    await owner.runTarget({
      contract: rootMeta,
      method: 'setValue',
      params: {
        key: 0,
        value: encodedEventProxy,
      }
    });
    
    logger.log(`Transferring ownership`);
    
    // Transfer ownership
    const transferOwnershipTx = await owner.runTarget({
      contract: rootMeta,
      method: 'transferOwnership',
      params: {
        owner_: data.multisig
      }
    });
    
    logger.success(`Transfer root meta ownership tx: ${transferOwnershipTx.transaction.id}`);
  
    console.log('');
  }
}


main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
