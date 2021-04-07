const logger = require('mocha-logger');
const { expect } = require('chai');
const BigNumber = require('bignumber.js');

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


const {
  convertCrystal
} = locklift.utils;


describe('Test wTON', async function() {
  this.timeout(200000);

  let vault;
  let tunnel;
  let user;

  let root;
  let userTokenWallet;
  let vaultTokenWallet;
  
  let tokenEventProxy;
  
  const getWTONMetrics = async function(
    userTokenWallet,
    user,
    vaultTokenWallet,
    vault,
    root,
  ) {
    return {
      userWTONBalance: userTokenWallet ? (await userTokenWallet.call({ method: 'balance' })) : 0,
      userTONBalance: user ? (await locklift.ton.getBalance(user.address)) : 0,
      vaultWTONBalance: vaultTokenWallet ? (await vaultTokenWallet.call({ method: 'balance' })) : 0,
      vaultTONBalance: vault ? (await locklift.ton.getBalance(vault.address)) : 0,
      vaultTotalWrapped: vault ? (await vault.call({ method: 'total_wrapped' })) : 0,
      wTONTotalSupply: root ? (await root.call({ method: 'total_supply' })) : 0,
    };
  };
  
  const getMetricsChange = function(initial, final) {
    return {
      userWTONBalance: convertCrystal(final.userWTONBalance - initial.userWTONBalance, 'ton').toNumber(),
      userTONBalance: convertCrystal(final.userTONBalance - initial.userTONBalance, 'ton').toNumber(),
      vaultWTONBalance: convertCrystal(final.vaultWTONBalance - initial.vaultWTONBalance, 'ton').toNumber(),
      vaultTONBalance: convertCrystal(final.vaultTONBalance - initial.vaultTONBalance, 'ton').toNumber(),
      vaultTotalWrapped: convertCrystal(final.vaultTotalWrapped - initial.vaultTotalWrapped, 'ton').toNumber(),
      wTONTotalSupply: convertCrystal(final.wTONTotalSupply - initial.wTONTotalSupply, 'ton').toNumber(),
    }
  };
  
  const logMetricsChange = function(change) {
    logger.log(`User wTON balance change: ${change.userWTONBalance}`);
    logger.log(`User TON balance change: ${change.userTONBalance}`);
    logger.log(`Vault wTON balance change: ${change.vaultWTONBalance}`);
    logger.log(`Vault TON balance change: ${change.vaultTONBalance}`);
    logger.log(`Vault total wrapped change: ${change.vaultTotalWrapped}`);
    logger.log(`wTON total supply change: ${change.wTONTotalSupply}`);
  };
  
  describe('Setup contracts', async function() {
    describe('Wrapped TON token', async function() {
      it('Deploy wTON root', async function() {
        const RootToken = await locklift.factory.getContract(
          'RootTokenContract',
          './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
        );
      
        const TokenWallet = await locklift.factory.getContract(
          'TONTokenWallet',
          './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
        );
      
        const [keyPair] = await locklift.keys.getKeyPairs();
        
        root = await locklift.giver.deployContract({
          contract: RootToken,
          constructorParams: {
            root_public_key_: `0x${keyPair.public}`,
            root_owner_address_: locklift.ton.zero_address
          },
          initParams: {
            name: stringToBytesArray('Wrapped TON'),
            symbol: stringToBytesArray('wTON'),
            decimals: 9,
            wallet_code: TokenWallet.code,
            _randomNonce: getRandomNonce(),
          },
          keyPair,
        });
        
        logger.log(`Root address: ${root.address}`);
      
        const name = await root.call({
          method: 'name',
          params: {}
        });
      
        expect(name.toString()).to.be.equal("Wrapped TON", 'Wrong root name');
        expect((await locklift.ton.getBalance(root.address)).toNumber())
          .to.be.above(0, 'Root balance empty');
      });
    });

    describe('User', async function() {
      it('Deploy user account', async function() {
        const Account = await locklift.factory.getAccount();
        const [keyPair] = await locklift.keys.getKeyPairs();
      
        user = await locklift.giver.deployContract({
          contract: Account,
          constructorParams: {},
          initParams: {
            _randomNonce: getRandomNonce(),
          },
          keyPair,
        }, convertCrystal(30, 'nano'));
      
        user.afterRun = afterRun;
        
        user.setKeyPair(keyPair);
      
        const userBalance = await locklift.ton.getBalance(user.address);
      
        expect(userBalance.toNumber()).to.be.above(0, 'Bad user balance');
      
        logger.log(`User address: ${user.address}`);
      
        const {
          acc_type_name
        } = await locklift.ton.getAccountType(user.address);
      
        expect(acc_type_name).to.be.equal('Active', 'User account not active');
      });
    
      it('Deploy user token wallet', async function() {
        await user.runTarget({
          contract: root,
          method: 'deployEmptyWallet',
          params: {
            deploy_grams: convertCrystal(1, 'nano'),
            wallet_public_key_: 0,
            owner_address_: user.address,
            gas_back_address: user.address,
          },
          value: convertCrystal(2, 'nano'),
        });
        
        const userTokenWalletAddress = await root.call({
          method: 'getWalletAddress',
          params: {
            wallet_public_key_: 0,
            owner_address_: user.address
          },
        });
  
        // Wait until user token wallet is presented into the GraphQL
        await locklift.ton.client.net.wait_for_collection({
          collection: 'accounts',
          filter: {
            id: { eq: userTokenWalletAddress },
            balance: { gt: `0x0` }
          },
          result: 'balance'
        });
  
        logger.log(`User token wallet: ${userTokenWalletAddress}`);
      
        userTokenWallet = await locklift.factory.getContract(
          'TONTokenWallet',
          './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
        );
      
        userTokenWallet.setAddress(userTokenWalletAddress);
      });
    
      it('Check user token wallet status', async function() {
        const {
          acc_type_name
        } = await locklift.ton.getAccountType(userTokenWallet.address);
      
        expect(acc_type_name).to.be.equal('Active', 'User token wallet not active');
      });
      
      it('Check user token wallet balance', async function() {
        const userTokenBalance = await userTokenWallet.call({
          method: 'balance'
        });
  
        expect(userTokenBalance.toNumber()).to.be.equal(0, 'Initial user token balance non zero');
      })
    });
  
    describe('Tunnel', async function() {
      it('Deploy tunnel', async function() {
        const Tunnel = await locklift.factory.getContract('Tunnel');
        const [keyPair] = await locklift.keys.getKeyPairs();
      
        tunnel = await locklift.giver.deployContract({
          contract: Tunnel,
          constructorParams: {
            sources: [],
            destinations: [],
            owner_: user.address,
          },
          initParams: {
            _randomNonce: getRandomNonce(),
          },
          keyPair,
        });
      
        logger.log(`Tunnel address: ${tunnel.address}`);
      });
    });
  
    describe('Vault', async function() {
      it('Deploy vault', async function() {
        const WrappedTONVault = await locklift.factory.getContract('WrappedTONVault');
  
        const [keyPair] = await locklift.keys.getKeyPairs();
        
        vault = await locklift.giver.deployContract({
          contract: WrappedTONVault,
          constructorParams: {
            owner_: user.address,
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
        
        vault.afterRun = afterRun;
  
        logger.log(`Vault address: ${vault.address}`);
      });
      
      it('Wait for vault to be deployed', async function() {
        // Wait until user token wallet is presented into the GraphQL
        await locklift.ton.client.net.wait_for_collection({
          collection: 'accounts',
          filter: {
            id: { eq: vault.address },
            balance: { gt: `0x0` }
          },
          result: 'balance'
        });
      });
      
      it('Check vault root', async function() {
        const {
          root: vaultRoot
        } = await vault.call({
          method: 'configuration',
        });
        
        expect(vaultRoot).to.equal(root.address, 'Wrong root address');
      });

      it('Check vault token wallet', async function() {
        await afterRun();
        
        const vaultTokenWalletAddress = await vault.call({
          method: 'token_wallet',
        });
        
        const vaultTokenWalletAddressExpected = await root.call({
          method: 'getWalletAddress',
          params: {
            wallet_public_key_: 0,
            owner_address_: vault.address
          },
        });
        
        vaultTokenWallet = await locklift.factory.getContract(
          'TONTokenWallet',
          './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
        );
        vaultTokenWallet.setAddress(vaultTokenWalletAddress);
  
        logger.log(`Vault token wallet address: ${vaultTokenWallet.address}`);
  
        expect(vaultTokenWalletAddressExpected)
          .to.be.equal(vaultTokenWalletAddress, 'Wrong vault token wallet');
      });
      
      it('Wait for vault token wallet deploy', async function() {
        await locklift.ton.client.net.wait_for_collection({
          collection: 'accounts',
          filter: {
            id: { eq: vaultTokenWallet.address },
            balance: { gt: `0x0` }
          },
          result: 'balance'
        });
      });
      
      it('Set vault token wallet receiver', async function() {
        const tx = await user.runTarget({
          contract: vault,
          method: 'setTokenWalletReceive',
          params: {},
        });
        
        logger.log(`Set vault token wallet receiver tx: ${tx.transaction.id}`);
      });
      
      it('Check vault token wallet receive callback', async function() {
        await afterRun();

        // Check receive callback address
        const {
          receive_callback
        } = (await vaultTokenWallet.call({
          method: 'getDetails',
        }));
        
        expect(receive_callback)
          .to.be.equal(vault.address, 'Wrong vault token wallet receive callback');
      });
    });
    
    describe('Finish setup', async function() {
      it('Transfer root ownership to tunnel', async function() {
        const [keyPair] = await locklift.keys.getKeyPairs();
        
        await root.run({
          method: 'transferOwner',
          params: {
            root_public_key_: 0,
            root_owner_address_: tunnel.address,
          },
          keyPair,
        });
        
        const {
          root_public_key,
          root_owner_address
        } = await root.call({
          method: 'getDetails',
        });
        
        expect(root_public_key.toNumber()).to.be.equal(0, 'Wrong root public key');
        expect(root_owner_address).to.be.equal(tunnel.address, 'Root owner should be tunnel');
      });
      
      it('Add vault to tunnel sources', async function() {
        await user.runTarget({
          contract: tunnel,
          method: '__updateTunnel',
          params: {
            source: vault.address,
            destination: root.address,
          }
        });
      });
      
      it('Check tunnel sources', async function() {
        const {
          sources,
          destinations,
        } = await tunnel.call({ method: '__getTunnels' });
  
        expect(sources)
          .to.have.lengthOf(1, 'Wrong amount of tunnel sources');
        expect(destinations)
          .to.have.lengthOf(1, 'Wrong amount of tunnel destinations');
        
        expect(sources[0]).to.be.equal(vault.address, 'Tunnel source differs from vault');
        expect(destinations[0]).to.be.equal(root.address, 'Tunnel destination differs from root');
      });
      
      it('Drain vault', async function() {
        if (locklift.network === 'dev') await sleep(40000);
    
        await user.runTarget({
          contract: vault,
          method: 'drain',
          params: {
            receiver: user.address,
          },
        });
    
        const {
          initial_balance,
        } = await vault.call({
          method: 'configuration'
        });
    
        const vaultTONBalance = await locklift.ton.getBalance(vault.address);
        logger.log(`Vault TON balance: ${convertCrystal(vaultTONBalance, 'ton')}`);
    
        expect(vaultTONBalance.toNumber())
          .to.be.equal(initial_balance.toNumber(), 'Wrong vault initial balance');
      });
    });
  });
  
  describe('Test wrapping', async function() {
    describe('Wrap TON to wTONs by sending TONs to vault', async function() {
      it('Send TONs to vault', async function() {
        const initialMetrics = await getWTONMetrics(
          userTokenWallet,
          user,
          vaultTokenWallet,
          vault,
          root,
        );

        await user.runTarget({
          contract: vault,
          value: convertCrystal(5, 'nano')
        });

        const finalMetrics = await getWTONMetrics(
          userTokenWallet,
          user,
          vaultTokenWallet,
          vault,
          root,
        );

        const metricsChange = getMetricsChange(initialMetrics, finalMetrics);

        logMetricsChange(metricsChange);

        expect(metricsChange.userWTONBalance)
          .to.be.above(3.5, 'Too low user wTON balance change')
          .and.to.be.below(4, 'Too high user wTON balance change');

        expect(metricsChange.userTONBalance)
          .to.be.below(-4, 'Too low user TON balance change')
          .to.be.above(-4.5, 'Too high user TON balance change');

        expect(metricsChange.vaultWTONBalance)
          .to.be.equal(0, 'Wrong vault wTON balance change');

        expect(metricsChange.vaultTONBalance)
          .to.be.equal(
            metricsChange.userWTONBalance,
            'Vault TON balance change differs from user wTON balance change'
          );

        expect(metricsChange.vaultTotalWrapped)
          .to.be.equal(
            metricsChange.userWTONBalance,
            'Vault total wrapped change differs from user wTON balance change'
          );

        expect(metricsChange.wTONTotalSupply)
          .to.be.equal(
            metricsChange.userWTONBalance,
            'wTON total supply change differs from user wTON balance change'
          );
      });
    });

    describe('Wrap TON to wTONs by calling wrap', function () {
      it('Call wrap', async function() {
        const initialMetrics = await getWTONMetrics(
          userTokenWallet,
          user,
          vaultTokenWallet,
          vault,
          root,
        );

        await user.runTarget({
          contract: vault,
          method: 'wrap',
          value: convertCrystal(2.5, 'nano'),
          params: {
            tokens: convertCrystal(1, 'nano'),
            wallet_public_key: 0,
            owner_address: user.address,
            gas_back_address: user.address,
          },
        });

        const finalMetrics = await getWTONMetrics(
          userTokenWallet,
          user,
          vaultTokenWallet,
          vault,
          root,
        );

        const metricsChange = getMetricsChange(initialMetrics, finalMetrics);

        logMetricsChange(metricsChange);

        expect(metricsChange.userWTONBalance)
          .to.be.equal(1, 'Wrong user wTON balance change');

        expect(metricsChange.userTONBalance)
          .to.be.below(-1, 'Too low user TON balance change')
          .to.be.above(-1.5, 'Too high user TON balance change');

        expect(metricsChange.vaultWTONBalance)
          .to.be.equal(0, 'Wrong vault wTON balance change');

        expect(metricsChange.vaultTONBalance)
          .to.be.equal(
            metricsChange.userWTONBalance,
            'Vault TON balance change differs from user wTON balance change'
          );

        expect(metricsChange.vaultTotalWrapped)
          .to.be.equal(
            metricsChange.userWTONBalance,
            'Vault total wrapped change differs from user wTON balance change'
          );

        expect(metricsChange.wTONTotalSupply)
          .to.be.equal(
            metricsChange.userWTONBalance,
            'wTON total supply change differs from user wTON balance change'
          );
      });
    });

    describe('Unwrap wTON to TON by sending wTONs to vault token wallet', async function() {
      it('Send wTONs to vault token wallet', async function() {
        const initialMetrics = await getWTONMetrics(
          userTokenWallet,
          user,
          vaultTokenWallet,
          vault,
          root,
        );

        await user.runTarget({
          contract: userTokenWallet,
          method: 'transferToRecipient',
          params: {
            recipient_public_key: 0,
            recipient_address: vault.address,
            tokens: convertCrystal(2.5, 'nano'),
            deploy_grams: 0,
            transfer_grams: 0,
            send_gas_to: user.address,
            notify_receiver: true, // TODO: what if notify false?
            payload: stringToBytesArray(''),
          },
          value: convertCrystal('4', 'nano'),
        });

        const finalMetrics = await getWTONMetrics(
          userTokenWallet,
          user,
          vaultTokenWallet,
          vault,
          root,
        );

        const metricsChange = getMetricsChange(initialMetrics, finalMetrics);

        logMetricsChange(metricsChange);

        expect(metricsChange.userWTONBalance)
          .to.be.equal(-2.5, 'Wrong user wTON balance change');

        expect(metricsChange.userTONBalance)
          .to.be.above(2, 'Too low user TON balance change')
          .to.be.below(2.5, 'Too high user TON balance change');

        expect(metricsChange.vaultWTONBalance)
          .to.be.equal(0, 'Wrong vault wTON balance change');

        expect(metricsChange.vaultTONBalance)
          .to.be.equal(
            metricsChange.userWTONBalance,
            'Vault TON balance change differs from user wTON balance change'
          );

        expect(metricsChange.vaultTotalWrapped)
          .to.be.equal(
            metricsChange.userWTONBalance,
            'Vault total wrapped change differs from user wTON balance change'
          );

        expect(metricsChange.wTONTotalSupply)
          .to.be.equal(
            metricsChange.userWTONBalance,
            'wTON total supply change differs from user wTON balance change'
          );
      });
    });
  });
  
  describe('Test bridge integration', async function() {
    let ethereumEventConfiguration;
    let tonEventConfiguration;

    describe('Setup bridge', async function() {
      it('Deploy wTON event proxy', async function() {
        const TokenEventProxy = await locklift.factory.getContract('TokenEventProxy');
        
        const [keyPair] = await locklift.keys.getKeyPairs();
  
        tokenEventProxy = await locklift.giver.deployContract({
          contract: TokenEventProxy,
          constructorParams: {
            external_owner_pubkey_: 0,
            internal_owner_address_: user.address,
          },
          initParams: {
            _randomNonce: getRandomNonce(),
          },
          keyPair
        });
        
        logger.log(`Token event proxy: ${tokenEventProxy.address}`);
      });
      
      it('Deploy Ethereum event configuration', async function() {
        const EthereumEventConfiguration = await locklift.factory.getContract(
          'EthereumEventConfiguration',
          './../node_modules/ethereum-freeton-bridge-contracts/free-ton/build'
        );
  
        const EthereumEvent = await locklift.factory.getContract('EthereumEvent');
  
        const [keyPair] = await locklift.keys.getKeyPairs();

        ethereumEventConfiguration = await locklift.giver.deployContract({
          contract: EthereumEventConfiguration,
          constructorParams: {},
          initParams: {
            basicInitData: {
              eventABI: stringToBytesArray(''),
              eventRequiredConfirmations: 1,
              eventRequiredRejects: 2,
              eventCode: EthereumEvent.code,
              bridgeAddress: user.address,
              eventInitialBalance: convertCrystal('10', 'nano'),
              meta: 'te6ccgEBAQEAJAAAQ4AQSq26pEykMQ45eiVmipykjjYFpFdkIg5R8GZndAsvW/A='
            },
            initData: {
              eventAddress: 0,
              eventBlocksToConfirm: 1,
              proxyAddress: tokenEventProxy.address,
              startBlockNumber: 0,
            }
          },
          keyPair,
        }, convertCrystal(100, 'nano'));
        
        logger.log(`Ethereum event configuration: ${ethereumEventConfiguration.address}`);
        
        // console.log((await ethereumEventConfiguration.call({ method: 'getDetails' })));
      });
      
      it('Deploy TON event configuration', async function() {
        const TonEventConfiguration = await locklift.factory.getContract(
          'TonEventConfiguration',
          './../node_modules/ethereum-freeton-bridge-contracts/free-ton/build'
        );
  
        const TonEvent = await locklift.factory.getContract('TonEvent');
  
        const [keyPair] = await locklift.keys.getKeyPairs();
  
        tonEventConfiguration = await locklift.giver.deployContract({
          contract: TonEventConfiguration,
          constructorParams: {},
          initParams: {
            basicInitData: {
              eventABI: stringToBytesArray(''),
              eventRequiredConfirmations: 1,
              eventRequiredRejects: 2,
              eventCode: TonEvent.code,
              bridgeAddress: user.address,
              eventInitialBalance: convertCrystal('10', 'nano'),
              meta: 'te6ccgEBAQEAJAAAQ4AQSq26pEykMQ45eiVmipykjjYFpFdkIg5R8GZndAsvW/A='
            },
            initData: {
              eventAddress: tokenEventProxy.address,
              proxyAddress: 0,
              startTimestamp: 0,
            }
          },
          keyPair,
        }, convertCrystal(100, 'nano'));
  
        logger.log(`TON event configuration: ${tonEventConfiguration.address}`);
      });
  
      it('Setup event proxy', async function() {
        const EthereumEvent = await locklift.factory.getContract('EthereumEvent');
  
        const [keyPair] = await locklift.keys.getKeyPairs();
        
        await user.runTarget({
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
      });
    });
    
    describe('Setup tunnels', async function() {
      // it('Add (root, event proxy) tunnel', async function() {
      //   await user.runTarget({
      //     contract: tunnel,
      //     method: '__updateTunnel',
      //     params: {
      //       source: root.address,
      //       destination: tokenEventProxy.address
      //     }
      //   });
      // });
      
      it('Add (event proxy, root) tunnel', async function() {
        await user.runTarget({
          contract: tunnel,
          method: '__updateTunnel',
          params: {
            source: tokenEventProxy.address,
            destination: root.address,
          }
        });
      });
    });
    
    describe('Test Ethereum-TON wTON transfer', async function() {
      let ethereumEvent;
      let receiverTokenWallet;
      let metricsBeforeEventExecuted;

      it('Confirm event', async function() {
        await user.runTarget({
          contract: ethereumEventConfiguration,
          method: 'confirmEvent',
          params: {
            eventVoteData: {
              eventTransaction: 0,
              eventIndex: 0,
              eventData: 'te6ccgEBAQEAUwAAogAAAAAAAAAAAAAAAAAAAHsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZUQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
              eventBlockNumber: 0,
              eventBlock: 0
            },
            relay: user.address
          }
        });
        
        const {
          value: {
            addr: ethereumEventAddress,
          }
        } = (await ethereumEventConfiguration.getEvents('EventConfirmation')).pop();
  
        ethereumEvent = await locklift.factory.getContract('EthereumEvent');
        
        ethereumEvent.setAddress(ethereumEventAddress);
        
        logger.log(`Ethereum event: ${ethereumEvent.address}`);
      });
      
      it('Check ethereum event status', async function() {
        const {
          acc_type_name
        } = await locklift.ton.getAccountType(ethereumEvent.address);
  
        // console.log('ethereum event', acc_type_name, (await locklift.ton.getBalance(ethereumEvent.address)).toNumber());
        
        expect(acc_type_name)
          .to.be.equal('Active', 'Ethereum event not active');
      });
      
      it('Setup receiver token wallet', async function() {
        const {
          owner_pubkey,
          owner_address,
        } = await ethereumEvent.call({ method: 'getDecodedData' });
  
        // console.log(owner_pubkey, owner_address);
        
        // Deploy receiver token wallet so it's possible to calculate all before / after metrics
        await user.runTarget({
          contract: root,
          method: 'deployEmptyWallet',
          params: {
            deploy_grams: convertCrystal(1, 'nano'),
            wallet_public_key_: owner_pubkey,
            owner_address_: owner_address,
            gas_back_address: user.address,
          },
          value: convertCrystal(2, 'nano'),
        });
        
        // console.log(123);
  
        const receiverTokenWalletAddress = await root.call({
          method: 'getWalletAddress',
          params: {
            wallet_public_key_: owner_pubkey,
            owner_address_: owner_address
          }
        });
        
        // console.log(receiverTokenWalletAddress);
  
        receiverTokenWallet = await locklift.factory.getContract(
          'TONTokenWallet',
          './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
        );
  
        receiverTokenWallet.setAddress(receiverTokenWalletAddress);
      });
      
      it('Check ethereum event address matches expected on event proxy', async function() {
        const {
          _initData
        } = await ethereumEvent.call({ method: 'getDetails' });
        
        const expectedEthereumEventAddress = await tokenEventProxy.call({
          method: 'getExpectedEventAddress',
          params: {
            initData: _initData
          }
        });

        expect(ethereumEvent.address)
          .to.be.equal(
            expectedEthereumEventAddress,
            'Ethereum event address differs from expected'
          );
      });
      
      it('Check event confirmed', async function() {
        const {
          _status,
        } = await ethereumEvent.call({ method: 'getDetails' });
        
        expect(_status.toNumber())
          .to.be.equal(1, 'Event not confirmed');
  
        const ethereumEventBalance = convertCrystal(
          (await locklift.ton.getBalance(ethereumEvent.address)),
          'ton'
        );
  
        logger.log(`Ethereum event balance after confirmation: ${ethereumEventBalance}`);
  
        expect(ethereumEventBalance.toNumber())
          .to.be.below(0.01, 'Ethereum event balance too high after confirmation');
      });
      
      it('Execute event', async function() {
        metricsBeforeEventExecuted = await getWTONMetrics(
          receiverTokenWallet,
          null,
          vaultTokenWallet,
          vault,
          root,
        );
        
        const tx = await user.runTarget({
          contract: ethereumEvent,
          method: 'executeProxyCallback',
          params: {},
          value: convertCrystal(5, 'nano'),
        });
        
        logger.log(`Execute event tx: ${tx.transaction.id}`);
      });
      
      it('Check ethereum event active', async function() {
        const {
          acc_type_name
        } = await locklift.ton.getAccountType(ethereumEvent.address);
  
        expect(acc_type_name)
          .to.be.equal('Active', 'Ethereum event not active after execution');
      });
      
      it('Check event executed', async function() {
        const {
          _status,
        } = await ethereumEvent.call({ method: 'getDetails' });
  
        expect(_status.toNumber())
          .to.be.equal(2, 'Event not executed');
  
        const ethereumEventBalance = convertCrystal(
          (await locklift.ton.getBalance(ethereumEvent.address)),
          'ton'
        );
  
        logger.log(`Ethereum event balance after execution: ${ethereumEventBalance}`);
  
        expect(ethereumEventBalance.toNumber())
          .to.be.below(0.01, 'Ethereum event balance too high after execution');
      });
      
      it('Check receiver token wallet deployed', async function() {
        logger.log(`Receiver token wallet: ${receiverTokenWallet.address}`);
  
        const {
          acc_type_name
        } = await locklift.ton.getAccountType(receiverTokenWallet.address);
  
        expect(acc_type_name).to.be.equal('Active', 'Receiver token wallet not active');
      });
      
      it('Check wTON metrics after Ethereum-TON event', async function() {
        const metricsAfterEventExecuted = await getWTONMetrics(
          receiverTokenWallet,
          null,
          vaultTokenWallet,
          vault,
          root,
        );
  
        const metricsChange = getMetricsChange(metricsBeforeEventExecuted, metricsAfterEventExecuted);
  
        logMetricsChange(metricsChange);
  
        expect(metricsChange.userWTONBalance)
          .to.be.equal(
            convertCrystal(123, 'ton').toNumber(),
          'Wrong receiver wTON balance change'
          );
  
        expect(metricsChange.userTONBalance)
          .to.be.equal(0, 'Wrong receiver TON balance change');
  
        expect(metricsChange.vaultWTONBalance)
          .to.be.equal(0, 'Wrong vault wTON balance change');
  
        expect(metricsChange.vaultTONBalance)
          .to.be.equal(
            0,
            'Vault TON balance change should be 0 after event execution'
          );
  
        expect(metricsChange.vaultTotalWrapped)
          .to.be.equal(
            0,
            'Vault total wrapped change should be 0 after event execution'
          );
  
        expect(metricsChange.wTONTotalSupply)
          .to.be.equal(
          metricsChange.userWTONBalance,
          'wTON total supply change differs from user wTON balance change'
        );
      });
    });
  
    describe('Test TON-Ethereum wTON transfer', async function() {
      let tonEvent;

      it('Burn tokens', async function() {
        const {
          root_owner_address,
          root_public_key,
        } = await root.call({ method: 'getDetails' });
      
        expect(root_owner_address)
          .to.be.equal(tunnel.address, 'Root owner should be tunnel');
        expect(root_public_key.toNumber())
          .to.be.equal(0, 'Root owner public key should be 0');
        
        const metricsBeforeBurn = await getWTONMetrics(
          userTokenWallet,
          user,
          vaultTokenWallet,
          vault,
          root,
        );
      
        logger.log(`User WTON balance before burn: ${convertCrystal(metricsBeforeBurn.userWTONBalance, 'ton')}`);
      
        const tx = await user.runTarget({
          contract: userTokenWallet,
          method: 'burnByOwner',
          params: {
            tokens: convertCrystal(1.23, 'nano'),
            grams: 0,
            send_gas_to: user.address,
            callback_address: tokenEventProxy.address,
            callback_payload: 'te6ccgEBAgEAgAABzRBHyQQAAAAAAAAAAAAAAAAAmJaAAAAAAAAAAAAAAAAAAAAAAIAVJCimjkbNb/3dgqZHUta7ni4y+RG4Gorxv0pSAXFGeXABfSkUJM47YApzoGYJpdL7tZ1zGJXI3RZAYt2y+Vk9K+IBAChix9vQFB+WlB6ZgiEi1NlOYCWAuw=='
          }
        });
        
        logger.log(`Burn wTON transaction: ${tx.transaction.id}`);
      
        const metricsAfterBurn = await getWTONMetrics(
          userTokenWallet,
          user,
          vaultTokenWallet,
          vault,
          root,
        );
      
        const metricsChange = getMetricsChange(metricsBeforeBurn, metricsAfterBurn);
      
        logger.success('Metrics after user burn tokens in favor of token event');
        logMetricsChange(metricsChange);
      
        expect(metricsChange.userWTONBalance)
          .to.be.equal(-1.23, 'Wrong user WTON balance change after burn');
      
        expect(metricsChange.userTONBalance)
          .to.be.above(-1, 'Too high user TON balance change after burn')
          .to.be.below(0, 'Too low user TON balance change after burn');
      
        expect(metricsChange.vaultWTONBalance)
          .to.be.equal(0, 'Wrong vault wTON balance change');
      
        expect(metricsChange.vaultTONBalance)
          .to.be.equal(
          0,
          'Vault TON balance change should be 0 after user burns tokens'
        );
      
        expect(metricsChange.vaultTotalWrapped)
          .to.be.equal(
          0,
          'Vault total wrapped change should be 0 after user burns tokens'
        );
      
        expect(metricsChange.wTONTotalSupply)
          .to.be.equal(
          metricsChange.userWTONBalance,
          'wTON total supply change differs from user wTON balance change after burn'
        );
      });
    
      it('Check event proxy emitted event', async function() {
        const events = (await tokenEventProxy.getEvents('TokenBurn'));
        
        expect(events)
          .to.have.lengthOf(1, 'Token proxy should emit TokenBurn event after burn');
      });
    
      it('Confirm TON event', async function() {
        const tx = await user.runTarget({
          contract: tonEventConfiguration,
          method: 'confirmEvent',
          params: {
            eventVoteData: {
              eventTransaction: 0,
              eventTransactionLt: 0,
              eventTimestamp: 0,
              eventIndex: 0,
              eventData: 'te6ccgEBAgEAgAABzRBHyQQAAAAAAAAAAAAAAAAAmJaAAAAAAAAAAAAAAAAAAAAAAIAVJCimjkbNb/3dgqZHUta7ni4y+RG4Gorxv0pSAXFGeXABfSkUJM47YApzoGYJpdL7tZ1zGJXI3RZAYt2y+Vk9K+IBAChix9vQFB+WlB6ZgiEi1NlOYCWAuw==',
            },
            eventDataSignature: stringToBytesArray(''),
            relay: user.address
          }
        });
        
        logger.log(`Ton event confirmation tx: ${tx.transaction.id}`);
  
        const {
          value: {
            addr: tonEventAddress,
          }
        } = (await tonEventConfiguration.getEvents('EventConfirmation')).pop();
  
        tonEvent = await locklift.factory.getContract('TonEvent');
  
        tonEvent.setAddress(tonEventAddress);
  
        logger.log(`TON event: ${tonEvent.address}`);
      });
      
      it('Check event confirmed', async function() {
        const {
          _confirmRelays,
          _status,
        } = await tonEvent.call({
          method: 'getDetails',
        });
        
        expect(_confirmRelays)
          .to.have.lengthOf(1, 'Wrong amount of confirmations');
        expect(_status.toNumber())
          .to.be.equal(1, 'Ton event should be confirmed ');
      });
      
      it('Check event balance after confirmation', async function() {
        const balance = convertCrystal(
          await locklift.ton.getBalance(tonEvent.address),
          'ton'
        );
        
        logger.log(`Ton event balance after confirmation: ${balance}`);
  
        expect(balance.toNumber())
          .to.be.below(0.01, 'Ethereum event balance too high after execution');
      });
    });
  });
  
  
  describe('Test vault update to new token', async function() {
    let root2;
    let userTokenWallet2;
    let vaultTokenWallet2;

    describe('Deploy new wTON', async function() {
      it('Deploy new root', async function() {
        const RootToken = await locklift.factory.getContract(
          'RootTokenContract',
          './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
        );

        const TokenWallet = await locklift.factory.getContract(
          'TONTokenWallet',
          './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
        );

        const [keyPair] = await locklift.keys.getKeyPairs();

        root2 = await locklift.giver.deployContract({
          contract: RootToken,
          constructorParams: {
            root_public_key_: `0x${keyPair.public}`,
            root_owner_address_: locklift.ton.zero_address
          },
          initParams: {
            name: stringToBytesArray('Wrapped TON'),
            symbol: stringToBytesArray('wTON'),
            decimals: 9,
            wallet_code: TokenWallet.code,
            _randomNonce: getRandomNonce(),
          },
          keyPair,
        });

        logger.log(`Root2 address: ${root2.address}`);
      });

      it('Deploy new user token wallet', async function() {
        await user.runTarget({
          contract: root2,
          method: 'deployEmptyWallet',
          params: {
            deploy_grams: convertCrystal(1, 'nano'),
            wallet_public_key_: 0,
            owner_address_: user.address,
            gas_back_address: user.address,
          },
          value: convertCrystal(2, 'nano'),
        });

        userTokenWallet2 = await locklift.factory.getContract(
          'TONTokenWallet',
          './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
        );

        const userTokenWalletAddress = await root2.call({
          method: 'getWalletAddress',
          params: {
            wallet_public_key_: 0,
            owner_address_: user.address
          },
        });

        userTokenWallet2.setAddress(userTokenWalletAddress);

        logger.log(`User token wallet2 address: ${userTokenWalletAddress}`);
      });

      it('Transfer root ownership to tunnel', async function() {
        const [keyPair] = await locklift.keys.getKeyPairs();

        await root2.run({
          method: 'transferOwner',
          params: {
            root_public_key_: 0,
            root_owner_address_: tunnel.address,
          },
          keyPair,
        });

        const {
          root_public_key,
          root_owner_address
        } = await root.call({
          method: 'getDetails',
        });

        expect(root_public_key.toNumber()).to.be.equal(0, 'Wrong root2 public key');
        expect(root_owner_address).to.be.equal(tunnel.address, 'Root2 owner should be tunnel');
      });
    });

    describe('Update vault target root', async function() {
      it('Update root in vault configuration', async function() {
        const configuration = await vault.call({ method: 'configuration' });

        const configurationNewRoot = {
          ...configuration,
          root: root2.address
        };

        await user.runTarget({
          contract: vault,
          method: 'setConfiguration',
          params: {
            _configuration: configurationNewRoot,
          }
        });
      });

      it('Check vault configuration root', async function() {
        const configuration = await vault.call({ method: 'configuration' });
        expect(configuration.root).to.be.equal(root2.address, 'New configuration should update root');
      });
  
      it('Set new vault token wallet receiver', async function() {
        const tx = await user.runTarget({
          contract: vault,
          method: 'setTokenWalletReceive',
          params: {},
        });
    
        logger.log(`Set vault token wallet receiver tx: ${tx.transaction.id}`);
      });
  
      it('Drain vault after update', async function() {
        await afterRun();

        await user.runTarget({
          contract: vault,
          method: 'drain',
          params: {
            receiver: user.address,
          },
        });
      });

      it('Check vault balance correct', async function() {
        const vaultBalance = await locklift.ton.getBalance(vault.address);
        const vaultTotalWrapped = await vault.call({ method: 'total_wrapped' });
        const vaultInitialBalance = (await vault.call({ method: 'configuration' })).initial_balance;

        expect(convertCrystal(vaultBalance, 'ton').toNumber())
          .to.be.equal(
            convertCrystal(vaultTotalWrapped.plus(vaultInitialBalance), 'ton').toNumber(),
            'Vault balance differs from total wrapped + initial balance'
          );
      });

      it('Check new vault token wallet', async function() {
        const vaultTokenWalletAddress = await vault.call({
          method: 'token_wallet',
        });

        const vaultTokenWalletAddressExpected = await root2.call({
          method: 'getWalletAddress',
          params: {
            wallet_public_key_: 0,
            owner_address_: user.address
          },
        });

        logger.log(`New Vault token wallet address: ${vaultTokenWalletAddressExpected}`);

        vaultTokenWallet2 = await locklift.factory.getContract(
          'TONTokenWallet',
          './../node_modules/broxus-ton-tokens-contracts/free-ton/build'
        );

        vaultTokenWallet2.setAddress(vaultTokenWalletAddress);
      });
    });

    describe('Update tunnel', async function() {
      it('Update tunnel vault destination', async function() {
        await user.runTarget({
          contract: tunnel,
          method: '__updateTunnel',
          params: {
            source: vault.address,
            destination: root2.address,
          }
        });
      });

      it('Check tunnel target', async function() {
        const {
          destinations
        } = await tunnel.call({ method: '__getTunnels' });

        expect(destinations)
          .to.include(root2.address, 'New tunnel destination should be root2');
      });
    });

    describe('Test new token', async function() {
      it('Wrap TONs to new wTONs', async function() {
        const initialMetrics = {
          v1: (await getWTONMetrics(
            userTokenWallet,
            user,
            vaultTokenWallet,
            vault,
            root,
          )),
          v2: (await getWTONMetrics(
            userTokenWallet2,
            user,
            vaultTokenWallet2,
            vault,
            root2,
          ))
        };

        await user.runTarget({
          contract: vault,
          method: 'wrap',
          value: convertCrystal(2.5, 'nano'),
          params: {
            tokens: convertCrystal(1, 'nano'),
            wallet_public_key: 0,
            owner_address: user.address,
            gas_back_address: user.address,
          },
        });

        const finalMetrics = {
          v1: (await getWTONMetrics(
            userTokenWallet,
            user,
            vaultTokenWallet,
            vault,
            root,
          )),
          v2: (await getWTONMetrics(
            userTokenWallet2,
            user,
            vaultTokenWallet2,
            vault,
            root2,
          ))
        };

        const metricsChange = {
          v1: getMetricsChange(initialMetrics.v1, finalMetrics.v1),
          v2: getMetricsChange(initialMetrics.v2, finalMetrics.v2),
        };

        logger.success('Old wTON metrics change');
        logMetricsChange(metricsChange.v1);

        logger.success('New wTON metrics change');
        logMetricsChange(metricsChange.v2);

        // Check metrics for old token
        expect(metricsChange.v1.userWTONBalance)
          .to.be.equal(0, 'Wrong user old wTON balance change');

        expect(metricsChange.v1.vaultWTONBalance)
          .to.be.equal(0, 'Wrong vault old wTON balance change');

        expect(metricsChange.v1.wTONTotalSupply)
          .to.be.equal(0, 'Wrong old wTON total supply change');

        // Check metrics for new token
        expect(metricsChange.v2.userWTONBalance)
          .to.be.equal(1, 'Wrong user new wTON balance change');

        expect(metricsChange.v2.userTONBalance)
          .to.be.below(-1, 'Too low user TON balance change')
          .to.be.above(-1.5, 'Too high user TON balance change');

        expect(metricsChange.v2.vaultWTONBalance)
          .to.be.equal(0, 'Wrong vault new wTON balance change');

        expect(metricsChange.v2.vaultTONBalance)
          .to.be.equal(
          metricsChange.v2.userWTONBalance,
          'Vault TON balance change differs from user new wTON balance change'
        );

        expect(metricsChange.v2.vaultTotalWrapped)
          .to.be.equal(
          metricsChange.v2.userWTONBalance,
          'Vault total wrapped change differs from user new wTON balance change'
        );

        expect(metricsChange.v2.wTONTotalSupply)
          .to.be.equal(
          metricsChange.v2.userWTONBalance,
          'wTON total supply change differs from user new wTON balance change'
        );
      });
      
      it('Unwrap new WTONs to TONs', async function() {
        const initialMetrics = {
          v1: (await getWTONMetrics(
            userTokenWallet,
            user,
            vaultTokenWallet,
            vault,
            root,
          )),
          v2: (await getWTONMetrics(
            userTokenWallet2,
            user,
            vaultTokenWallet2,
            vault,
            root2,
          ))
        };
  
        await user.runTarget({
          contract: userTokenWallet2,
          method: 'transferToRecipient',
          params: {
            recipient_public_key: 0,
            recipient_address: vault.address,
            tokens: convertCrystal(1, 'nano'),
            deploy_grams: 0,
            transfer_grams: 0,
            send_gas_to: user.address,
            notify_receiver: true,
            payload: stringToBytesArray(''),
          },
          value: convertCrystal('4', 'nano'),
        });
  
        const finalMetrics = {
          v1: (await getWTONMetrics(
            userTokenWallet,
            user,
            vaultTokenWallet,
            vault,
            root,
          )),
          v2: (await getWTONMetrics(
            userTokenWallet2,
            user,
            vaultTokenWallet2,
            vault,
            root2,
          ))
        };
  
        const metricsChange = {
          v1: getMetricsChange(initialMetrics.v1, finalMetrics.v1),
          v2: getMetricsChange(initialMetrics.v2, finalMetrics.v2),
        };
  
        logger.success('Old wTON metrics change');
        logMetricsChange(metricsChange.v1);
  
        logger.success('New wTON metrics change');
        logMetricsChange(metricsChange.v2);
  
        // Check metrics for old token
        expect(metricsChange.v1.userWTONBalance)
          .to.be.equal(0, 'Wrong user old wTON balance change');
  
        expect(metricsChange.v1.vaultWTONBalance)
          .to.be.equal(0, 'Wrong vault old wTON balance change');
  
        expect(metricsChange.v1.wTONTotalSupply)
          .to.be.equal(0, 'Wrong old wTON total supply change');
        
        // Check metrics for new token
        expect(metricsChange.v2.userWTONBalance)
          .to.be.equal(-1, 'Wrong user new wTON balance change');
  
        expect(metricsChange.v2.userTONBalance)
          .to.be.below(1, 'Too high user TON balance change')
          .to.be.above(0.7, 'Too low user TON balance change');
  
        expect(metricsChange.v2.vaultWTONBalance)
          .to.be.equal(0, 'Wrong vault new wTON balance change');
  
        expect(metricsChange.v2.vaultTONBalance)
          .to.be.equal(
          metricsChange.v2.userWTONBalance,
          'Vault TON balance change differs from user new wTON balance change'
        );
  
        expect(metricsChange.v2.vaultTotalWrapped)
          .to.be.equal(
          metricsChange.v2.userWTONBalance,
          'Vault total wrapped change differs from user new wTON balance change'
        );
  
        expect(metricsChange.v2.wTONTotalSupply)
          .to.be.equal(
          metricsChange.v2.userWTONBalance,
          'wTON total supply change differs from user new wTON balance change'
        );
      });
    });
  });
  let newOwner;
  
  describe('Test ownership transfer', async function() {
    describe('Setup', async function() {
      it('Deploy new owner account', async function() {
        const Account = await locklift.factory.getAccount();
        const [keyPair] = await locklift.keys.getKeyPairs();
  
        newOwner = await locklift.giver.deployContract({
          contract: Account,
          constructorParams: {},
          initParams: {
            _randomNonce: getRandomNonce(),
          },
          keyPair,
        }, convertCrystal(30, 'nano'));
  
        user.afterRun = afterRun;
        user.setKeyPair(keyPair);
        
        logger.log(`New owner: ${newOwner.address}`);
        
        expect(newOwner.address)
          .to.be.not.equal(user.address, 'New owner is same as previous');
      });
    });

    describe('Tunnel', async function() {
      it('Transfer ownership', async function() {
        const tx = await user.runTarget({
          contract: tunnel,
          method: 'transferOwnership',
          params: {
            owner_: newOwner.address
          }
        });
        
        logger.log(`Transfer tunnel ownership tx: ${tx.transaction.id}`);
      });

      it('Check new ownership', async function() {
        const owner = await tunnel.call({
          method: 'owner'
        });
        
        expect(owner)
          .to.be.equal(newOwner.address, 'Wrong tunnel owner');
      });
    });
  
    describe('Vault', async function() {
      it('Transfer ownership', async function() {
        const tx = await user.runTarget({
          contract: vault,
          method: 'transferOwnership',
          params: {
            owner_: newOwner.address
          }
        });
  
        logger.log(`Transfer vault ownership tx: ${tx.transaction.id}`);
      });

      it('Check new ownership', async function() {
        const owner = await vault.call({
          method: 'owner'
        });
  
        expect(owner)
          .to.be.equal(newOwner.address, 'Wrong vault owner');
      });
    });
    
    describe('Event proxy', async function() {
      it('Transfer ownership', async function() {
        const tx = await user.runTarget({
          contract: tokenEventProxy,
          method: 'transferOwner',
          params: {
            external_owner_pubkey_: 0,
            internal_owner_address_: newOwner.address,
          }
        });
        
        logger.log(`Transfer event proxy ownership tx: ${tx.transaction.id}`);
      });

      it('Check new ownership', async function() {
        const owner = await tokenEventProxy.call({
          method: 'internal_owner_address'
        });
  
        expect(owner)
          .to.be.equal(newOwner.address, 'Wrong event proxy owner');
      });
    });
  });
});
