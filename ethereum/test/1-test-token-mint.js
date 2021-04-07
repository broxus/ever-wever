const { expect } = require('chai');
const BigNumber = require('bignumber.js');
const logger = require('mocha-logger');

const tokensToMint = 90000;
const tokensToBurn = 80000;


let accounts;
let receiver;
let bridge;
let proxyTokenMint;
let wton;

const signReceipt = async (web3, receipt, signer) => {
  const receiptHash = web3
    .utils
    .soliditySha3(receipt)
    .toString('hex');

  return await web3
    .eth
    .sign(receiptHash, signer);
};


describe('Test token mint proxy', async function() {
  before(async function() {
    accounts = await ethers.getSigners();
    receiver = accounts[0].address;

    const Bridge = await ethers.getContractFactory("Bridge");
    bridge = await upgrades.deployProxy(
      Bridge,
      [
        accounts.map(a => a.address),
        accounts[0].address,
        [1, 2]
      ]
    );

    logger.log(`Bridge: ${bridge.address}`);
    
    const ProxyTokenMint = await ethers.getContractFactory("ProxyTokenMint");
    proxyTokenMint = await upgrades.deployProxy(
      ProxyTokenMint,
      [
        [
          '0x0000000000000000000000000000000000000000',
          bridge.address,
          true,
          2,
          [0, 100]
        ],
        accounts[0].address
      ],
    );
  
    logger.log(`Proxy token mint: ${proxyTokenMint.address}`);
    
    const WrappedTON = await ethers.getContractFactory("WrappedTON");
    wton = WrappedTON.attach((await proxyTokenMint.configuration()).token);

    logger.log(`wTON token: ${wton.address}`);
  });
  
  describe('Check token mint', async function() {
    it('Check WTON owner is token mint', async function() {
      const wtonOwner = await wton.owner();
      
      expect(wtonOwner).to.be.equal(proxyTokenMint.address, 'Wrong WTON owner');
    });
  });
  
  describe('Test minting tokens', async function() {
    it('Mint tokens', async function() {
      const eventData = web3.eth.abi.encodeParameters(
        ['int8', 'uint256', 'uint128', 'uint160'],
        [0, 123, tokensToMint, BigNumber(accounts[0].address.toLowerCase())],
      );

      // Encode TONEvent structure
      const tonEvent = web3.eth.abi.encodeParameters(
        [{
          'TONEvent': {
            'eventTransaction': 'uint256',
            'eventTransactionLt': 'uint64',
            'eventTimestamp': 'uint32',
            'eventIndex': 'uint32',
            'eventData': 'bytes',
            'tonEventConfigurationWid': 'int8',
            'tonEventConfigurationAddress': 'uint',
            'requiredConfirmations': 'uint16',
            'requiredRejects': 'uint16',
            'proxy': 'address',
          }
        }],
        [{
          'eventTransaction': 0,
          'eventTransactionLt': 0,
          'eventTimestamp': 0,
          'eventIndex': 0,
          'eventData': eventData,
          'tonEventConfigurationWid': 0,
          'tonEventConfigurationAddress': 0,
          'requiredConfirmations': 1,
          'requiredRejects': 1,
          'proxy': proxyTokenMint.address
        }]
      );
  
      // Sign ton event
      const signatures = [
        (await signReceipt(web3, tonEvent, accounts[0].address)),
        (await signReceipt(web3, tonEvent, accounts[1].address))
      ];
      
      expect(
        (await wton.balanceOf(receiver)).toNumber()
      ).to.equal(
        0,
        'Receiver balance should be zero before unlock'
      );
  
      await proxyTokenMint.broxusBridgeCallback(
        tonEvent,
        signatures
      );
    });
    
    it('Check user wTON balance', async function() {
      const feeAmount = (await proxyTokenMint.getFeeAmount(tokensToMint)).toNumber();
  
      expect(
        (await wton.balanceOf(receiver)).toNumber()
      ).to.equal(
        tokensToMint - feeAmount,
        'Wrong receiver balance after mint'
      );
    });
    
    it('Check TokenMint WTON balance', async function() {
      expect(
        (await wton.balanceOf(proxyTokenMint.address)).toNumber()
      ).to.equal(
        0,
        'Wrong token mint WTON balance'
      );
    });
  });
  
  describe('Test burning tokens', async function() {
    let initialReceiverBalance;

    it('Burn tokens', async function() {
      initialReceiverBalance = (await wton.balanceOf(receiver)).toNumber();
      
      await proxyTokenMint.burnTokens(
        tokensToBurn,
        0,
        123,
        123
      );
    });
    
    it('Check receiver balance after token burn', async function() {
      const feeAmount = (await proxyTokenMint.getFeeAmount(tokensToBurn)).toNumber();
  
      expect(
        (await wton.balanceOf(receiver)).toNumber()
      ).to.equal(
        initialReceiverBalance - tokensToBurn - feeAmount,
        'Wrong receiver balance after burn'
      );
    });
  })
});
