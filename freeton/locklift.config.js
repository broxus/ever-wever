module.exports = {
  compiler: {
    // Specify path to your TON-Solidity-Compiler
    path: '/usr/bin/solc-ton-broxus',
  },
  linker: {
    // Path to your TVM Linker
    path: '/usr/bin/tvm_linker',
  },
  networks: {
    // You can use TON labs graphql endpoints or local node
    local: {
      ton_client: {
        // See the TON client specification for all available options
        network: {
          server_address: 'http://localhost/',
        },
      },
      // This giver is default local-node giver
      giver: {
        address: '0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94',
        abi: { "ABI version": 1, "functions": [ { "name": "constructor", "inputs": [], "outputs": [] }, { "name": "sendGrams", "inputs": [ {"name":"dest","type":"address"}, {"name":"amount","type":"uint64"} ], "outputs": [] } ], "events": [], "data": [] },
        key: '',
      },
      // Use tonos-cli to generate your phrase
      // !!! Never commit it in your repos !!!
      keys: {
        phrase: '',
        amount: 20,
      }
    },
    dev: {
      ton_client: {
        network: {
          server_address: 'https://net.ton.dev'
        }
      },
      // This giver is default local-node giver
      giver: {
        address: '0:02594208fdfcb7e91e21f392dbcec75168f70808331a7acb4d716a953fe0626e',
        abi: { "ABI version": 2, "header": ["time", "expire"], "functions": [ { "name": "constructor", "inputs": [ ], "outputs": [ ] }, { "name": "sendGrams", "inputs": [ {"name":"dest","type":"address"}, {"name":"amount","type":"uint64"} ], "outputs": [ ] } ], "data": [ ], "events": [ ] },
        key: '',
      },
      // Use tonos-cli to generate your phrase
      // !!! Never commit it in your repos !!!
      keys: {
        phrase: '',
        amount: 20,
      }
    },
    main: {
      ton_client: {
        network: {
          server_address: 'https://main.ton.dev'
        }
      },
      // This giver is default local-node giver
      giver: {
        address: '0:02594208fdfcb7e91e21f392dbcec75168f70808331a7acb4d716a953fe0626e',
        abi: { "ABI version": 2, "header": ["time", "expire"], "functions": [ { "name": "constructor", "inputs": [ ], "outputs": [ ] }, { "name": "sendGrams", "inputs": [ {"name":"dest","type":"address"}, {"name":"amount","type":"uint64"} ], "outputs": [ ] } ], "data": [ ], "events": [ ] },
        key: '',
      },
      // Use tonos-cli to generate your phrase
      // !!! Never commit it in your repos !!!
      keys: {
        phrase: '',
        amount: 20,
      }
    },
  },
};
