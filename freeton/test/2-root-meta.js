const logger = require('mocha-logger');
const { expect } = require('chai');


const getRandomNonce = () => Math.random() * 64000 | 0;

const stringToBytesArray = (dataString) => {
  return Buffer.from(dataString).toString('hex')
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const afterRun = async (tx) => {
  if (locklift.network === 'dev') {
    await sleep(60000);
  }
};


describe('Test meta root contract', async function() {
  this.timeout(200000);

  let owner;
  let rootMeta;

  describe('Setup contract', async function() {
    it('Deploy owner', async function() {
      const Account = await locklift.factory.getAccount();
      const [keyPair] = await locklift.keys.getKeyPairs();
    
      owner = await locklift.giver.deployContract({
        contract: Account,
        constructorParams: {},
        initParams: {
          _randomNonce: getRandomNonce(),
        },
        keyPair,
      }, locklift.utils.convertCrystal(10, 'nano'));
    
      owner.setKeyPair(keyPair);
      owner.afterRun = afterRun;
  
      logger.log(`Owner: ${owner.address}`);
    });
  
    it('Deploy meta root', async function() {
      const RootMeta = await locklift.factory.getContract(
        'RootMeta',
      );
    
      const [keyPair] = await locklift.keys.getKeyPairs();
    
      rootMeta = await locklift.giver.deployContract({
        contract: RootMeta,
        constructorParams: {
          owner_: owner.address,
        },
        initParams: {
          root: owner.address, // Use root her
        },
        keyPair,
      });
    
      logger.log(`RootMeta address: ${rootMeta.address}`);
    });
  });
  
  describe('Test root meta', async function() {
    const metaValue = 'te6ccgEBAQEAUwAAogAAAAAAAAAAAAAAAAAAAHsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZUQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
    
    it('Set value', async function() {
      await owner.runTarget({
        contract: rootMeta,
        method: 'setValue',
        params: {
          key: 1,
          value: metaValue,
        },
      });
    });
    
    it('Get value by key', async function() {
      const value = await rootMeta.call({
        method: 'getMetaByKey',
        params: {
          key: 1
        }
      });
      
      expect(value).to.be.equal(metaValue, 'Wrong meta value');
    });
  });
});
