const cellEncoderAbi = {"ABIversion":2,"version":"2.2","header":["time"],"functions":[{"name":"encodeEthereumEventData","inputs":[{"name":"tokens","type":"uint256"},{"name":"wid","type":"int128"},{"name":"owner_addr","type":"uint256"}],"outputs":[{"name":"data","type":"cell"}]},{"name":"decodeEthereumEventData","inputs":[{"name":"data","type":"cell"}],"outputs":[{"name":"tokens","type":"uint128"},{"name":"wid","type":"int8"},{"name":"owner_addr","type":"uint256"}]},{"name":"encodeEverscaleEventData","inputs":[{"name":"wid","type":"int8"},{"name":"addr","type":"uint256"},{"name":"tokens","type":"uint128"},{"name":"ethereum_address","type":"uint160"},{"name":"chainId","type":"uint32"}],"outputs":[{"name":"data","type":"cell"}]},{"name":"decodeEverscaleEventData","inputs":[{"name":"data","type":"cell"}],"outputs":[{"name":"wid","type":"int8"},{"name":"addr","type":"uint256"},{"name":"tokens","type":"uint128"},{"name":"ethereum_address","type":"uint160"},{"name":"chainId","type":"uint32"}]},{"name":"constructor","inputs":[],"outputs":[]}],"data":[],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"}]} as const
const ownableAbi = {"ABIversion":2,"version":"2.2","header":["time"],"functions":[{"name":"transferOwnership","inputs":[{"name":"owner_","type":"address"}],"outputs":[]},{"name":"renounceOwnership","inputs":[],"outputs":[]},{"name":"constructor","inputs":[],"outputs":[]},{"name":"owner","inputs":[],"outputs":[{"name":"owner","type":"address"}]}],"data":[],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"owner","type":"address"}]} as const
const pausableAbi = {"ABIversion":2,"version":"2.2","header":["time"],"functions":[{"name":"pause","inputs":[],"outputs":[]},{"name":"unpause","inputs":[],"outputs":[]},{"name":"transferOwnership","inputs":[{"name":"newOwner","type":"address"}],"outputs":[]},{"name":"renounceOwnership","inputs":[],"outputs":[]},{"name":"constructor","inputs":[],"outputs":[]},{"name":"owner","inputs":[],"outputs":[{"name":"owner","type":"address"}]},{"name":"paused","inputs":[],"outputs":[{"name":"paused","type":"bool"}]}],"data":[],"events":[{"name":"Pause","inputs":[],"outputs":[]},{"name":"Unpause","inputs":[],"outputs":[]},{"name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address"},{"name":"newOwner","type":"address"}],"outputs":[]}],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"owner","type":"address"},{"name":"paused","type":"bool"}]} as const
const proxyTokenTransferAbi = {"ABIversion":2,"version":"2.2","header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[{"name":"owner_","type":"address"}],"outputs":[]},{"name":"apiVersion","inputs":[],"outputs":[{"name":"API_VERSION","type":"string"}]},{"name":"receiveTokenWalletAddress","inputs":[{"name":"wallet","type":"address"}],"outputs":[]},{"name":"onEventConfirmed","inputs":[{"components":[{"components":[{"name":"eventTransaction","type":"uint256"},{"name":"eventIndex","type":"uint32"},{"name":"eventData","type":"cell"},{"name":"eventBlockNumber","type":"uint32"},{"name":"eventBlock","type":"uint256"}],"name":"voteData","type":"tuple"},{"name":"configuration","type":"address"},{"name":"staking","type":"address"},{"name":"chainId","type":"uint32"}],"name":"eventData","type":"tuple"},{"name":"gasBackAddress","type":"address"}],"outputs":[]},{"name":"onAcceptTokensTransfer","inputs":[{"name":"tokenRoot","type":"address"},{"name":"amount","type":"uint128"},{"name":"sender","type":"address"},{"name":"senderWallet","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"getDetails","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"components":[{"name":"tonConfiguration","type":"address"},{"name":"ethereumConfigurations","type":"address[]"},{"name":"root","type":"address"},{"name":"settingsDeployWalletGrams","type":"uint128"},{"name":"settingsTransferGrams","type":"uint128"}],"name":"_config","type":"tuple"},{"name":"_owner","type":"address"},{"name":"_received_count","type":"uint128"},{"name":"_transferred_count","type":"uint128"},{"name":"_token_wallet","type":"address"}]},{"name":"getTokenRoot","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"getConfiguration","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"components":[{"name":"tonConfiguration","type":"address"},{"name":"ethereumConfigurations","type":"address[]"},{"name":"root","type":"address"},{"name":"settingsDeployWalletGrams","type":"uint128"},{"name":"settingsTransferGrams","type":"uint128"}],"name":"value0","type":"tuple"}]},{"name":"setConfiguration","inputs":[{"components":[{"name":"tonConfiguration","type":"address"},{"name":"ethereumConfigurations","type":"address[]"},{"name":"root","type":"address"},{"name":"settingsDeployWalletGrams","type":"uint128"},{"name":"settingsTransferGrams","type":"uint128"}],"name":"_config","type":"tuple"}],"outputs":[]},{"name":"upgrade","inputs":[{"name":"code","type":"cell"},{"name":"send_gas_to","type":"address"}],"outputs":[]},{"name":"transferOwnership","inputs":[{"name":"newOwner","type":"address"}],"outputs":[]},{"name":"renounceOwnership","inputs":[],"outputs":[]},{"name":"encodeEthereumEventData","inputs":[{"name":"tokens","type":"uint256"},{"name":"wid","type":"int128"},{"name":"owner_addr","type":"uint256"}],"outputs":[{"name":"data","type":"cell"}]},{"name":"decodeEthereumEventData","inputs":[{"name":"data","type":"cell"}],"outputs":[{"name":"tokens","type":"uint128"},{"name":"wid","type":"int8"},{"name":"owner_addr","type":"uint256"}]},{"name":"encodeEverscaleEventData","inputs":[{"name":"wid","type":"int8"},{"name":"addr","type":"uint256"},{"name":"tokens","type":"uint128"},{"name":"ethereum_address","type":"uint160"},{"name":"chainId","type":"uint32"}],"outputs":[{"name":"data","type":"cell"}]},{"name":"decodeEverscaleEventData","inputs":[{"name":"data","type":"cell"}],"outputs":[{"name":"wid","type":"int8"},{"name":"addr","type":"uint256"},{"name":"tokens","type":"uint128"},{"name":"ethereum_address","type":"uint160"},{"name":"chainId","type":"uint32"}]},{"name":"_randomNonce","inputs":[],"outputs":[{"name":"_randomNonce","type":"uint256"}]},{"name":"owner","inputs":[],"outputs":[{"name":"owner","type":"address"}]},{"name":"token_wallet","inputs":[],"outputs":[{"name":"token_wallet","type":"address"}]}],"data":[{"key":1,"name":"_randomNonce","type":"uint256"}],"events":[{"name":"Withdraw","inputs":[{"name":"wid","type":"int8"},{"name":"addr","type":"uint256"},{"name":"tokens","type":"uint128"},{"name":"eth_addr","type":"uint160"},{"name":"chainId","type":"uint32"}],"outputs":[]},{"name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address"},{"name":"newOwner","type":"address"}],"outputs":[]}],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"_randomNonce","type":"uint256"},{"name":"owner","type":"address"},{"components":[{"name":"tonConfiguration","type":"address"},{"name":"ethereumConfigurations","type":"address[]"},{"name":"root","type":"address"},{"name":"settingsDeployWalletGrams","type":"uint128"},{"name":"settingsTransferGrams","type":"uint128"}],"name":"config","type":"tuple"},{"name":"received_count","type":"uint128"},{"name":"transferred_count","type":"uint128"},{"name":"token_wallet","type":"address"}]} as const
const proxyTokenTransferFactoryAbi = {"ABIversion":2,"version":"2.2","header":["time"],"functions":[{"name":"constructor","inputs":[{"name":"_proxyCode","type":"cell"}],"outputs":[]},{"name":"deploy","inputs":[{"name":"_owner","type":"address"},{"name":"_randomNonce","type":"uint256"}],"outputs":[]},{"name":"deriveProxyAddress","inputs":[{"name":"_randomNonce","type":"uint256"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"_randomNonce","inputs":[],"outputs":[{"name":"_randomNonce","type":"uint256"}]},{"name":"proxyCode","inputs":[],"outputs":[{"name":"proxyCode","type":"cell"}]}],"data":[{"key":1,"name":"_randomNonce","type":"uint256"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"_randomNonce","type":"uint256"},{"name":"proxyCode","type":"cell"}]} as const
const proxyTokenTransferMockupUpgradeAbi = {"ABIversion":2,"version":"2.2","header":["time"],"functions":[{"name":"getDetails","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"components":[{"name":"tonConfiguration","type":"address"},{"name":"ethereumConfigurations","type":"address[]"},{"name":"root","type":"address"},{"name":"settingsDeployWalletGrams","type":"uint128"},{"name":"settingsTransferGrams","type":"uint128"}],"name":"_config","type":"tuple"},{"name":"_owner","type":"address"},{"name":"_received_count","type":"uint128"},{"name":"_transferred_count","type":"uint128"},{"name":"_token_wallet","type":"address"}]},{"name":"apiVersion","inputs":[],"outputs":[{"name":"API_VERSION","type":"string"}]},{"name":"transferOwnership","inputs":[{"name":"newOwner","type":"address"}],"outputs":[]},{"name":"renounceOwnership","inputs":[],"outputs":[]},{"name":"constructor","inputs":[],"outputs":[]},{"name":"_randomNonce","inputs":[],"outputs":[{"name":"_randomNonce","type":"uint256"}]},{"name":"owner","inputs":[],"outputs":[{"name":"owner","type":"address"}]},{"name":"token_wallet","inputs":[],"outputs":[{"name":"token_wallet","type":"address"}]}],"data":[{"key":1,"name":"_randomNonce","type":"uint256"}],"events":[{"name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address"},{"name":"newOwner","type":"address"}],"outputs":[]}],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"_randomNonce","type":"uint256"},{"name":"owner","type":"address"},{"components":[{"name":"tonConfiguration","type":"address"},{"name":"ethereumConfigurations","type":"address[]"},{"name":"root","type":"address"},{"name":"settingsDeployWalletGrams","type":"uint128"},{"name":"settingsTransferGrams","type":"uint128"}],"name":"config","type":"tuple"},{"name":"received_count","type":"uint128"},{"name":"transferred_count","type":"uint128"},{"name":"token_wallet","type":"address"}]} as const
const tokenRootAbi = {"ABIversion":2,"version":"2.2","header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[{"name":"initialSupplyTo","type":"address"},{"name":"initialSupply","type":"uint128"},{"name":"deployWalletValue","type":"uint128"},{"name":"mintDisabled","type":"bool"},{"name":"burnByRootDisabled","type":"bool"},{"name":"burnPaused","type":"bool"},{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"supportsInterface","inputs":[{"name":"answerId","type":"uint32"},{"name":"interfaceID","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"disableMint","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"mintDisabled","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"burnTokens","inputs":[{"name":"amount","type":"uint128"},{"name":"walletOwner","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"disableBurnByRoot","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"burnByRootDisabled","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"burnPaused","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"setBurnPaused","inputs":[{"name":"answerId","type":"uint32"},{"name":"paused","type":"bool"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"transferOwnership","inputs":[{"name":"newOwner","type":"address"},{"name":"remainingGasTo","type":"address"},{"components":[{"name":"value","type":"uint128"},{"name":"payload","type":"cell"}],"name":"callbacks","type":"map(address,tuple)"}],"outputs":[]},{"name":"name","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"string"}]},{"name":"symbol","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"string"}]},{"name":"decimals","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint8"}]},{"name":"totalSupply","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint128"}]},{"name":"walletCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"cell"}]},{"name":"rootOwner","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"walletOf","inputs":[{"name":"answerId","type":"uint32"},{"name":"walletOwner","type":"address"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"deployWallet","inputs":[{"name":"answerId","type":"uint32"},{"name":"walletOwner","type":"address"},{"name":"deployWalletValue","type":"uint128"}],"outputs":[{"name":"tokenWallet","type":"address"}]},{"name":"mint","inputs":[{"name":"amount","type":"uint128"},{"name":"recipient","type":"address"},{"name":"deployWalletValue","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"acceptBurn","id":"0x192B51B1","inputs":[{"name":"amount","type":"uint128"},{"name":"walletOwner","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"sendSurplusGas","inputs":[{"name":"to","type":"address"}],"outputs":[]}],"data":[{"key":1,"name":"name_","type":"string"},{"key":2,"name":"symbol_","type":"string"},{"key":3,"name":"decimals_","type":"uint8"},{"key":4,"name":"rootOwner_","type":"address"},{"key":5,"name":"walletCode_","type":"cell"},{"key":6,"name":"randomNonce_","type":"uint256"},{"key":7,"name":"deployer_","type":"address"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"name_","type":"string"},{"name":"symbol_","type":"string"},{"name":"decimals_","type":"uint8"},{"name":"rootOwner_","type":"address"},{"name":"walletCode_","type":"cell"},{"name":"totalSupply_","type":"uint128"},{"name":"burnPaused_","type":"bool"},{"name":"burnByRootDisabled_","type":"bool"},{"name":"mintDisabled_","type":"bool"},{"name":"randomNonce_","type":"uint256"},{"name":"deployer_","type":"address"}]} as const
const tokenRootUpgradeableAbi = {"ABIversion":2,"version":"2.2","header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[{"name":"initialSupplyTo","type":"address"},{"name":"initialSupply","type":"uint128"},{"name":"deployWalletValue","type":"uint128"},{"name":"mintDisabled","type":"bool"},{"name":"burnByRootDisabled","type":"bool"},{"name":"burnPaused","type":"bool"},{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"supportsInterface","inputs":[{"name":"answerId","type":"uint32"},{"name":"interfaceID","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"walletVersion","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"platformCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"cell"}]},{"name":"requestUpgradeWallet","inputs":[{"name":"currentVersion","type":"uint32"},{"name":"walletOwner","type":"address"},{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"setWalletCode","inputs":[{"name":"code","type":"cell"}],"outputs":[]},{"name":"upgrade","inputs":[{"name":"code","type":"cell"}],"outputs":[]},{"name":"disableMint","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"mintDisabled","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"burnTokens","inputs":[{"name":"amount","type":"uint128"},{"name":"walletOwner","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"disableBurnByRoot","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"burnByRootDisabled","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"burnPaused","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"setBurnPaused","inputs":[{"name":"answerId","type":"uint32"},{"name":"paused","type":"bool"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"transferOwnership","inputs":[{"name":"newOwner","type":"address"},{"name":"remainingGasTo","type":"address"},{"components":[{"name":"value","type":"uint128"},{"name":"payload","type":"cell"}],"name":"callbacks","type":"map(address,tuple)"}],"outputs":[]},{"name":"name","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"string"}]},{"name":"symbol","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"string"}]},{"name":"decimals","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint8"}]},{"name":"totalSupply","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint128"}]},{"name":"walletCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"cell"}]},{"name":"rootOwner","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"walletOf","inputs":[{"name":"answerId","type":"uint32"},{"name":"walletOwner","type":"address"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"deployWallet","inputs":[{"name":"answerId","type":"uint32"},{"name":"walletOwner","type":"address"},{"name":"deployWalletValue","type":"uint128"}],"outputs":[{"name":"tokenWallet","type":"address"}]},{"name":"mint","inputs":[{"name":"amount","type":"uint128"},{"name":"recipient","type":"address"},{"name":"deployWalletValue","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"acceptBurn","id":"0x192B51B1","inputs":[{"name":"amount","type":"uint128"},{"name":"walletOwner","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"sendSurplusGas","inputs":[{"name":"to","type":"address"}],"outputs":[]}],"data":[{"key":1,"name":"name_","type":"string"},{"key":2,"name":"symbol_","type":"string"},{"key":3,"name":"decimals_","type":"uint8"},{"key":4,"name":"rootOwner_","type":"address"},{"key":5,"name":"walletCode_","type":"cell"},{"key":6,"name":"randomNonce_","type":"uint256"},{"key":7,"name":"deployer_","type":"address"},{"key":8,"name":"platformCode_","type":"cell"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"name_","type":"string"},{"name":"symbol_","type":"string"},{"name":"decimals_","type":"uint8"},{"name":"rootOwner_","type":"address"},{"name":"walletCode_","type":"cell"},{"name":"totalSupply_","type":"uint128"},{"name":"burnPaused_","type":"bool"},{"name":"burnByRootDisabled_","type":"bool"},{"name":"mintDisabled_","type":"bool"},{"name":"randomNonce_","type":"uint256"},{"name":"deployer_","type":"address"},{"name":"platformCode_","type":"cell"},{"name":"walletVersion_","type":"uint32"}]} as const
const tokenWalletAbi = {"ABIversion":2,"version":"2.2","header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[],"outputs":[]},{"name":"supportsInterface","inputs":[{"name":"answerId","type":"uint32"},{"name":"interfaceID","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"destroy","inputs":[{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"burnByRoot","inputs":[{"name":"amount","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"burn","inputs":[{"name":"amount","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"balance","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint128"}]},{"name":"owner","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"root","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"walletCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"cell"}]},{"name":"transfer","inputs":[{"name":"amount","type":"uint128"},{"name":"recipient","type":"address"},{"name":"deployWalletValue","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"transferToWallet","inputs":[{"name":"amount","type":"uint128"},{"name":"recipientTokenWallet","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"acceptTransfer","id":"0x67A0B95F","inputs":[{"name":"amount","type":"uint128"},{"name":"sender","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"acceptMint","id":"0x4384F298","inputs":[{"name":"amount","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"sendSurplusGas","inputs":[{"name":"to","type":"address"}],"outputs":[]}],"data":[{"key":1,"name":"root_","type":"address"},{"key":2,"name":"owner_","type":"address"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"root_","type":"address"},{"name":"owner_","type":"address"},{"name":"balance_","type":"uint128"}]} as const
const tokenWalletPlatformAbi = {"ABIversion":2,"version":"2.2","header":["time"],"functions":[{"name":"constructor","id":"0x15A038FB","inputs":[{"name":"walletCode","type":"cell"},{"name":"walletVersion","type":"uint32"},{"name":"sender","type":"address"},{"name":"remainingGasTo","type":"address"}],"outputs":[]}],"data":[{"key":1,"name":"root","type":"address"},{"key":2,"name":"owner","type":"address"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"root","type":"address"},{"name":"owner","type":"address"}]} as const
const tokenWalletUpgradeableAbi = {"ABIversion":2,"version":"2.2","header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[],"outputs":[]},{"name":"supportsInterface","inputs":[{"name":"answerId","type":"uint32"},{"name":"interfaceID","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"platformCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"cell"}]},{"name":"onDeployRetry","id":"0x15A038FB","inputs":[{"name":"value0","type":"cell"},{"name":"value1","type":"uint32"},{"name":"sender","type":"address"},{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"version","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"upgrade","inputs":[{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"acceptUpgrade","inputs":[{"name":"newCode","type":"cell"},{"name":"newVersion","type":"uint32"},{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"burnByRoot","inputs":[{"name":"amount","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"destroy","inputs":[{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"burn","inputs":[{"name":"amount","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"balance","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint128"}]},{"name":"owner","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"root","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"walletCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"cell"}]},{"name":"transfer","inputs":[{"name":"amount","type":"uint128"},{"name":"recipient","type":"address"},{"name":"deployWalletValue","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"transferToWallet","inputs":[{"name":"amount","type":"uint128"},{"name":"recipientTokenWallet","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"acceptTransfer","id":"0x67A0B95F","inputs":[{"name":"amount","type":"uint128"},{"name":"sender","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"acceptMint","id":"0x4384F298","inputs":[{"name":"amount","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"sendSurplusGas","inputs":[{"name":"to","type":"address"}],"outputs":[]}],"data":[{"key":1,"name":"root_","type":"address"},{"key":2,"name":"owner_","type":"address"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"root_","type":"address"},{"name":"owner_","type":"address"},{"name":"balance_","type":"uint128"},{"name":"version_","type":"uint32"},{"name":"platformCode_","type":"cell"}]} as const
const transferUtilsAbi = {"ABIversion":2,"version":"2.2","header":["time"],"functions":[{"name":"constructor","inputs":[],"outputs":[]}],"data":[],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"}]} as const
const tunnelAbi = {"ABIversion":2,"version":"2.2","header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[{"name":"sources","type":"address[]"},{"name":"destinations","type":"address[]"},{"name":"owner_","type":"address"}],"outputs":[]},{"name":"__getTunnels","inputs":[],"outputs":[{"name":"sources","type":"address[]"},{"name":"destinations","type":"address[]"}]},{"name":"__updateTunnel","inputs":[{"name":"source","type":"address"},{"name":"destination","type":"address"}],"outputs":[]},{"name":"__removeTunnel","inputs":[{"name":"source","type":"address"}],"outputs":[]},{"name":"pause","inputs":[],"outputs":[]},{"name":"unpause","inputs":[],"outputs":[]},{"name":"transferOwnership","inputs":[{"name":"newOwner","type":"address"}],"outputs":[]},{"name":"renounceOwnership","inputs":[],"outputs":[]},{"name":"owner","inputs":[],"outputs":[{"name":"owner","type":"address"}]},{"name":"paused","inputs":[],"outputs":[{"name":"paused","type":"bool"}]}],"data":[{"key":1,"name":"_randomNonce","type":"uint256"}],"events":[{"name":"Pause","inputs":[],"outputs":[]},{"name":"Unpause","inputs":[],"outputs":[]},{"name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address"},{"name":"newOwner","type":"address"}],"outputs":[]}],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"owner","type":"address"},{"name":"paused","type":"bool"},{"name":"_randomNonce","type":"uint256"},{"name":"tunnels","type":"map(address,address)"}]} as const
const vaultAbi = {"ABIversion":2,"version":"2.2","header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[{"name":"owner_","type":"address"},{"name":"root","type":"address"},{"name":"root_tunnel","type":"address"},{"name":"receive_safe_fee","type":"uint128"},{"name":"settings_deploy_wallet_grams","type":"uint128"},{"name":"initial_balance","type":"uint128"}],"outputs":[]},{"name":"receiveTokenWalletAddress","inputs":[{"name":"wallet","type":"address"}],"outputs":[]},{"name":"drain","inputs":[{"name":"receiver","type":"address"}],"outputs":[]},{"name":"setConfiguration","inputs":[{"components":[{"name":"root_tunnel","type":"address"},{"name":"root","type":"address"},{"name":"receive_safe_fee","type":"uint128"},{"name":"settings_deploy_wallet_grams","type":"uint128"},{"name":"initial_balance","type":"uint128"}],"name":"_configuration","type":"tuple"}],"outputs":[]},{"name":"withdraw","inputs":[{"name":"amount","type":"uint128"}],"outputs":[]},{"name":"grant","inputs":[{"name":"amount","type":"uint128"}],"outputs":[]},{"name":"wrap","inputs":[{"name":"tokens","type":"uint128"},{"name":"owner_address","type":"address"},{"name":"gas_back_address","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"onAcceptTokensTransfer","inputs":[{"name":"tokenRoot","type":"address"},{"name":"amount","type":"uint128"},{"name":"sender","type":"address"},{"name":"senderWallet","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"transferOwnership","inputs":[{"name":"newOwner","type":"address"}],"outputs":[]},{"name":"renounceOwnership","inputs":[],"outputs":[]},{"name":"_randomNonce","inputs":[],"outputs":[{"name":"_randomNonce","type":"uint256"}]},{"name":"owner","inputs":[],"outputs":[{"name":"owner","type":"address"}]},{"name":"configuration","inputs":[],"outputs":[{"components":[{"name":"root_tunnel","type":"address"},{"name":"root","type":"address"},{"name":"receive_safe_fee","type":"uint128"},{"name":"settings_deploy_wallet_grams","type":"uint128"},{"name":"initial_balance","type":"uint128"}],"name":"configuration","type":"tuple"}]},{"name":"token_wallet","inputs":[],"outputs":[{"name":"token_wallet","type":"address"}]},{"name":"total_wrapped","inputs":[],"outputs":[{"name":"total_wrapped","type":"uint128"}]}],"data":[{"key":1,"name":"_randomNonce","type":"uint256"}],"events":[{"name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address"},{"name":"newOwner","type":"address"}],"outputs":[]}],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"_randomNonce","type":"uint256"},{"name":"owner","type":"address"},{"components":[{"name":"root_tunnel","type":"address"},{"name":"root","type":"address"},{"name":"receive_safe_fee","type":"uint128"},{"name":"settings_deploy_wallet_grams","type":"uint128"},{"name":"initial_balance","type":"uint128"}],"name":"configuration","type":"tuple"},{"name":"token_wallet","type":"address"},{"name":"total_wrapped","type":"uint128"}]} as const
const walletAbi = {"ABIversion":2,"version":"2.2","header":["time"],"functions":[{"name":"sendTransaction","inputs":[{"name":"dest","type":"address"},{"name":"value","type":"uint128"},{"name":"bounce","type":"bool"},{"name":"flags","type":"uint8"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"transferOwnership","inputs":[{"name":"newOwner","type":"uint256"}],"outputs":[]},{"name":"constructor","inputs":[],"outputs":[]},{"name":"owner","inputs":[],"outputs":[{"name":"owner","type":"uint256"}]},{"name":"_randomNonce","inputs":[],"outputs":[{"name":"_randomNonce","type":"uint256"}]}],"data":[{"key":1,"name":"_randomNonce","type":"uint256"}],"events":[{"name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"uint256"},{"name":"newOwner","type":"uint256"}],"outputs":[]}],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"owner","type":"uint256"},{"name":"_randomNonce","type":"uint256"}]} as const

export const factorySource = {
    CellEncoder: cellEncoderAbi,
    Ownable: ownableAbi,
    Pausable: pausableAbi,
    ProxyTokenTransfer: proxyTokenTransferAbi,
    ProxyTokenTransferFactory: proxyTokenTransferFactoryAbi,
    ProxyTokenTransferMockupUpgrade: proxyTokenTransferMockupUpgradeAbi,
    TokenRoot: tokenRootAbi,
    TokenRootUpgradeable: tokenRootUpgradeableAbi,
    TokenWallet: tokenWalletAbi,
    TokenWalletPlatform: tokenWalletPlatformAbi,
    TokenWalletUpgradeable: tokenWalletUpgradeableAbi,
    TransferUtils: transferUtilsAbi,
    Tunnel: tunnelAbi,
    Vault: vaultAbi,
    Wallet: walletAbi
} as const

export type FactorySource = typeof factorySource
export type CellEncoderAbi = typeof cellEncoderAbi
export type OwnableAbi = typeof ownableAbi
export type PausableAbi = typeof pausableAbi
export type ProxyTokenTransferAbi = typeof proxyTokenTransferAbi
export type ProxyTokenTransferFactoryAbi = typeof proxyTokenTransferFactoryAbi
export type ProxyTokenTransferMockupUpgradeAbi = typeof proxyTokenTransferMockupUpgradeAbi
export type TokenRootAbi = typeof tokenRootAbi
export type TokenRootUpgradeableAbi = typeof tokenRootUpgradeableAbi
export type TokenWalletAbi = typeof tokenWalletAbi
export type TokenWalletPlatformAbi = typeof tokenWalletPlatformAbi
export type TokenWalletUpgradeableAbi = typeof tokenWalletUpgradeableAbi
export type TransferUtilsAbi = typeof transferUtilsAbi
export type TunnelAbi = typeof tunnelAbi
export type VaultAbi = typeof vaultAbi
export type WalletAbi = typeof walletAbi