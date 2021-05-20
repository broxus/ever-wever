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


const data = {
  meta: [
    {
      symbol: 'USDT',
      roots: [
        '0:751b6e22687891bdc1706c8d91bf77281237f7453d27dc3106c640ec165a2abf',
        '0:5b325f4f364366d9b3fe46cc77f622b013da7a7edf99a3d5d25e5510dca50d13',
        '0:ce7170dc3144b47c2a8217a0ab8506729f6310e1311017b20304ea0b973b160d',
        '0:12026fbe3efb3d079df43606f5ae2b0670db53862947712606163265af55b50c',
      ],
      proxy: '0:7e501c32e4301844ce0b158cc7195d660ef288da7f51a714a765fd57bdba8033',
    },
    {
      symbol: 'USDC',
      roots: [
        '0:1ad0575f0f98f87a07ec505c39839cb9766c70a11dadbfc171f59b2818759819',
        '0:4a2c894ef8780735ae52bf8caf82d214477ceea494ad547a6832bf695d230ed1',
        '0:0bacf88b63b1a8b0811a23aa74e7ffe735047a1486229730c92d0d43a9660f8d',
        '0:00756fc1b0c6ccb5ea92cc9988b01d8af14b20a952eaa0f8179b314c84e04d71',
      ],
      proxy: '0:d9b4c195f1e6cb32252489854e9eb37edf78a1a0522bcdfe920533874f589a87',
    },
    {
      symbol: 'DAI',
      roots: [
        '0:95934aa6a66cb3eb211a80e99234dfbba6329cfa31600ce3c2b070d8d9677cef',
        '0:31540aa0100da4b7f6cfb47ff987be4910b27ce1b5cf228fddce82cb4bf4f518',
        '0:205be6579a2dde82833986f612c2f2d45d5bdb26bf5f46ebec1ec99e72118f9b',
        '0:0e45756c8c3670c257d8e04450e7c386b7e85300826afa89d152e31add3fdf0f',
      ],
      proxy: '0:b512003442f6a59f4dac4c35c881009bc8978f226939376e393412df6442db65',
    },
    {
      symbol: 'WBTC',
      roots: [
        '0:6e76bccb41be2210dc9d7a4d0f3cbf0d5da592d0cb6b87662d5510f5b5efe497',
        '0:382c14808ed11f735410d67407802dff46b74f935b89b65649e1841ab09fd8b4',
        '0:f6f7e95d07aef52007671cdcaccbee221839e7a20bc7125e7641f65b473efee5',
        '0:59a8da835859d3a696682b272acb5a5dedc55ac3a4e2ed0c9fef7f2695eba2d2',
      ],
      proxy: '0:3e59d02db9902b7f67752d9e511e8da822279ff7d95da6707824eeaa5ffb5744',
    },
    {
      symbol: 'WETH',
      roots: [
        '0:45f682b7e783283caef3f268e10073cf08842bce20041d5224c38d87df9f2e90',
        '0:9ca758fb99002a61d22c594fa2db6f0e1d8934580815565057be47f94a8e7325',
        '0:8580ffd20c6da4cc2bb6f946cb08fbec85bbe67041962ad8ed71dd1a0b0fa0b0',
        '0:09702c5daf8ea6c5999ad3846c21c658d77b164f98bc49e9915763aaf2c7bb3c',
      ],
      proxy: '0:5159fd30a96bc5e852e8e2421dae6aaba2d523e5c1a9186fa42334a9992c11a0',
    },
    {
      symbol: 'WTON',
      roots: [
        '0:0ee39330eddb680ce731cd6a443c71d9069db06d149a9bec9569d1eb8d04eb37',
        '0:eed3f331634d49a5da2b546f4652dd4889487a187c2ef9dd2203cff17b584e3d'
      ],
      proxy: '0:200a6ea2ae9e25ae789c846a8d7c2d96bfd6c06dc16a55305d7f317e0f9bb79a',
    },
    {
      symbol: 'UNI LP',
      roots: [
        '0:53abe27ec16208973c9643911c35b5d033744fbb95b11b5672f71188db5a42dc',
        '0:72cad0c97cc8d84eef6837ee110f8f67c9d376cae57d684308fe30e831df734a',
      ],
      proxy: '0:8610899de4744b58750ef9b99e372332ec29e1acbd4f806c04e0a11ec8f52415',
    },
  ],
  multisig: '0:ad091843febdbaf72308bf9c45067817e254965c28a692b5c4187f8c7fab6c81',
};


async function main() {
  const [keyPair] = await locklift.keys.getKeyPairs();
  
  logger.log(`Owner address: ${data.owner}`);
  
  const Account = await locklift.factory.getAccount();
  const owner = await locklift.giver.deployContract({
    contract: Account,
    constructorParams: {},
    initParams: {
      _randomNonce: getRandomNonce(),
    },
    keyPair,
  }, locklift.utils.convertCrystal(40, 'nano'));
  
  logger.success(`Owner: ${owner.address}`);
  
  owner.setKeyPair(keyPair);
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
  }, locklift.utils.convertCrystal(0.5, 'nano'));
  
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
  }, locklift.utils.convertCrystal(20, 'nano'));
  
  logger.success(`Root meta factory: ${rootMetaFactory.address}`);
  
  logger.log(`Setting up root metas`);
  
  console.log('');
  
  for (const { roots, symbol, proxy } of data.meta) {
    logger.log(`Setting up ${roots.length} root metas for ${symbol}`);
    logger.log(`Proxy: ${proxy}`);
  
    console.log('');
  
    for (const root of roots) {
      logger.log(`Setting up meta for ${root}`);
  
      const tx = await owner.runTarget({
        contract: rootMetaFactory,
        method: 'deploy',
        params: {
          owner: owner.address,
          root
        },
        value: locklift.utils.convertCrystal('1.0', 'nano')
      });
  
      // Wait twice more time so root meta will be deployed 100% before calling it
      await afterRun();
      
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
          rootToken: proxy,
        }
      });
      
      logger.log(`Setting up meta (${encodedEventProxy})`);
      
      // Set meta
      rootMeta.setAddress(rootMetaAddress);
  
      const setMetaTx = await owner.runTarget({
        contract: rootMeta,
        method: 'setValue',
        params: {
          key: 0,
          value: encodedEventProxy,
        },
        value: locklift.utils.convertCrystal('0.5', 'nano')
      });
      
      logger.success(`Set meta tx: ${setMetaTx.transaction.id}`);
  
      logger.log(`Transferring ownership`);
  
      // Transfer ownership
      const transferOwnershipTx = await owner.runTarget({
        contract: rootMeta,
        method: 'transferOwnership',
        params: {
          owner_: data.multisig
        },
        value: locklift.utils.convertCrystal('0.5', 'nano')
      });
  
      logger.success(`Transfer root meta ownership tx: ${transferOwnershipTx.transaction.id}`);

      console.log('');
    }
    
    console.log('');
  }
}


main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
