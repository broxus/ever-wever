const airdropAbi = {"ABIversion":2,"version":"2.2","header":["time"],"functions":[{"name":"constructor","inputs":[{"name":"wallets_","type":"uint32"},{"name":"root_","type":"address"},{"name":"owner_","type":"address"},{"name":"airdrop_amount_","type":"uint128"}],"outputs":[]},{"name":"trigger","inputs":[],"outputs":[]},{"name":"destroy","inputs":[],"outputs":[]},{"name":"deployWalletCallback","inputs":[{"name":"value0","type":"address"}],"outputs":[]},{"name":"_randomNonce","inputs":[],"outputs":[{"name":"_randomNonce","type":"uint256"}]},{"name":"wallets","inputs":[],"outputs":[{"name":"wallets","type":"uint32"}]},{"name":"root","inputs":[],"outputs":[{"name":"root","type":"address"}]},{"name":"owner","inputs":[],"outputs":[{"name":"owner","type":"address"}]},{"name":"airdrop_amount","inputs":[],"outputs":[{"name":"airdrop_amount","type":"uint128"}]},{"name":"wallet_pointer","inputs":[],"outputs":[{"name":"wallet_pointer","type":"uint32"}]}],"data":[{"key":1,"name":"_randomNonce","type":"uint256"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"_randomNonce","type":"uint256"},{"name":"wallets","type":"uint32"},{"name":"root","type":"address"},{"name":"owner","type":"address"},{"name":"airdrop_amount","type":"uint128"},{"name":"wallet_pointer","type":"uint32"},{"name":"empty","type":"cell"}]} as const
const selectorAbi = {"ABIversion":2,"version":"2.2","header":["time"],"functions":[{"name":"constructor","inputs":[],"outputs":[]},{"name":"calculateAcceptTransferSelector","inputs":[],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"calculateAcceptMintSelector","inputs":[],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"calculateAcceptBurnSelector","inputs":[],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"calculateTIP3TokenRootInterfaceID","inputs":[],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"calculateTIP3TokenWalletInterfaceID","inputs":[],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"calculateSIDInterfaceID","inputs":[],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"calculateVersionedInterfaceID","inputs":[],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"calculateTokenRootInterfaceID","inputs":[],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"calculateTokenWalletInterfaceID","inputs":[],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"calculateBurnableTokenWalletInterfaceID","inputs":[],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"calculateBurnableByRootTokenRootInterfaceID","inputs":[],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"calculateBurnableByRootTokenWalletInterfaceID","inputs":[],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"calculateDestroyableInterfaceID","inputs":[],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"calculateDisableableMintTokenRootInterfaceID","inputs":[],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"calculateTransferableOwnershipInterfaceID","inputs":[],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"calculateBurnPausableTokenRootInterfaceID","inputs":[],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"calculateTokenWalletUpgradeableInterfaceID","inputs":[],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"calculateTokenRootUpgradeableInterfaceID","inputs":[],"outputs":[{"name":"value0","type":"uint32"}]}],"data":[{"key":1,"name":"_randomNonce","type":"uint256"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"_randomNonce","type":"uint256"}]} as const
const tokenRootAbi = {"ABIversion":2,"version":"2.2","header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[{"name":"initialSupplyTo","type":"address"},{"name":"initialSupply","type":"uint128"},{"name":"deployWalletValue","type":"uint128"},{"name":"mintDisabled","type":"bool"},{"name":"burnByRootDisabled","type":"bool"},{"name":"burnPaused","type":"bool"},{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"supportsInterface","inputs":[{"name":"answerId","type":"uint32"},{"name":"interfaceID","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"disableMint","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"mintDisabled","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"burnTokens","inputs":[{"name":"amount","type":"uint128"},{"name":"walletOwner","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"disableBurnByRoot","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"burnByRootDisabled","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"burnPaused","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"setBurnPaused","inputs":[{"name":"answerId","type":"uint32"},{"name":"paused","type":"bool"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"transferOwnership","inputs":[{"name":"newOwner","type":"address"},{"name":"remainingGasTo","type":"address"},{"components":[{"name":"value","type":"uint128"},{"name":"payload","type":"cell"}],"name":"callbacks","type":"map(address,tuple)"}],"outputs":[]},{"name":"name","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"string"}]},{"name":"symbol","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"string"}]},{"name":"decimals","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint8"}]},{"name":"totalSupply","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint128"}]},{"name":"walletCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"cell"}]},{"name":"rootOwner","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"walletOf","inputs":[{"name":"answerId","type":"uint32"},{"name":"walletOwner","type":"address"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"deployWallet","inputs":[{"name":"answerId","type":"uint32"},{"name":"walletOwner","type":"address"},{"name":"deployWalletValue","type":"uint128"}],"outputs":[{"name":"tokenWallet","type":"address"}]},{"name":"mint","inputs":[{"name":"amount","type":"uint128"},{"name":"recipient","type":"address"},{"name":"deployWalletValue","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"acceptBurn","id":"0x192B51B1","inputs":[{"name":"amount","type":"uint128"},{"name":"walletOwner","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"sendSurplusGas","inputs":[{"name":"to","type":"address"}],"outputs":[]}],"data":[{"key":1,"name":"name_","type":"string"},{"key":2,"name":"symbol_","type":"string"},{"key":3,"name":"decimals_","type":"uint8"},{"key":4,"name":"rootOwner_","type":"address"},{"key":5,"name":"walletCode_","type":"cell"},{"key":6,"name":"randomNonce_","type":"uint256"},{"key":7,"name":"deployer_","type":"address"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"name_","type":"string"},{"name":"symbol_","type":"string"},{"name":"decimals_","type":"uint8"},{"name":"rootOwner_","type":"address"},{"name":"walletCode_","type":"cell"},{"name":"totalSupply_","type":"uint128"},{"name":"burnPaused_","type":"bool"},{"name":"burnByRootDisabled_","type":"bool"},{"name":"mintDisabled_","type":"bool"},{"name":"randomNonce_","type":"uint256"},{"name":"deployer_","type":"address"}]} as const
const tokenRootUpgradeableAbi = {"ABIversion":2,"version":"2.2","header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[{"name":"initialSupplyTo","type":"address"},{"name":"initialSupply","type":"uint128"},{"name":"deployWalletValue","type":"uint128"},{"name":"mintDisabled","type":"bool"},{"name":"burnByRootDisabled","type":"bool"},{"name":"burnPaused","type":"bool"},{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"supportsInterface","inputs":[{"name":"answerId","type":"uint32"},{"name":"interfaceID","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"walletVersion","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"platformCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"cell"}]},{"name":"requestUpgradeWallet","inputs":[{"name":"currentVersion","type":"uint32"},{"name":"walletOwner","type":"address"},{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"setWalletCode","inputs":[{"name":"code","type":"cell"}],"outputs":[]},{"name":"upgrade","inputs":[{"name":"code","type":"cell"}],"outputs":[]},{"name":"disableMint","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"mintDisabled","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"burnTokens","inputs":[{"name":"amount","type":"uint128"},{"name":"walletOwner","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"disableBurnByRoot","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"burnByRootDisabled","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"burnPaused","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"setBurnPaused","inputs":[{"name":"answerId","type":"uint32"},{"name":"paused","type":"bool"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"transferOwnership","inputs":[{"name":"newOwner","type":"address"},{"name":"remainingGasTo","type":"address"},{"components":[{"name":"value","type":"uint128"},{"name":"payload","type":"cell"}],"name":"callbacks","type":"map(address,tuple)"}],"outputs":[]},{"name":"name","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"string"}]},{"name":"symbol","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"string"}]},{"name":"decimals","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint8"}]},{"name":"totalSupply","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint128"}]},{"name":"walletCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"cell"}]},{"name":"rootOwner","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"walletOf","inputs":[{"name":"answerId","type":"uint32"},{"name":"walletOwner","type":"address"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"deployWallet","inputs":[{"name":"answerId","type":"uint32"},{"name":"walletOwner","type":"address"},{"name":"deployWalletValue","type":"uint128"}],"outputs":[{"name":"tokenWallet","type":"address"}]},{"name":"mint","inputs":[{"name":"amount","type":"uint128"},{"name":"recipient","type":"address"},{"name":"deployWalletValue","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"acceptBurn","id":"0x192B51B1","inputs":[{"name":"amount","type":"uint128"},{"name":"walletOwner","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"sendSurplusGas","inputs":[{"name":"to","type":"address"}],"outputs":[]}],"data":[{"key":1,"name":"name_","type":"string"},{"key":2,"name":"symbol_","type":"string"},{"key":3,"name":"decimals_","type":"uint8"},{"key":4,"name":"rootOwner_","type":"address"},{"key":5,"name":"walletCode_","type":"cell"},{"key":6,"name":"randomNonce_","type":"uint256"},{"key":7,"name":"deployer_","type":"address"},{"key":8,"name":"platformCode_","type":"cell"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"name_","type":"string"},{"name":"symbol_","type":"string"},{"name":"decimals_","type":"uint8"},{"name":"rootOwner_","type":"address"},{"name":"walletCode_","type":"cell"},{"name":"totalSupply_","type":"uint128"},{"name":"burnPaused_","type":"bool"},{"name":"burnByRootDisabled_","type":"bool"},{"name":"mintDisabled_","type":"bool"},{"name":"randomNonce_","type":"uint256"},{"name":"deployer_","type":"address"},{"name":"platformCode_","type":"cell"},{"name":"walletVersion_","type":"uint32"}]} as const
const tokenWalletAbi = {"ABIversion":2,"version":"2.2","header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[],"outputs":[]},{"name":"supportsInterface","inputs":[{"name":"answerId","type":"uint32"},{"name":"interfaceID","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"destroy","inputs":[{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"burnByRoot","inputs":[{"name":"amount","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"burn","inputs":[{"name":"amount","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"balance","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint128"}]},{"name":"owner","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"root","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"walletCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"cell"}]},{"name":"transfer","inputs":[{"name":"amount","type":"uint128"},{"name":"recipient","type":"address"},{"name":"deployWalletValue","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"transferToWallet","inputs":[{"name":"amount","type":"uint128"},{"name":"recipientTokenWallet","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"acceptTransfer","id":"0x67A0B95F","inputs":[{"name":"amount","type":"uint128"},{"name":"sender","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"acceptMint","id":"0x4384F298","inputs":[{"name":"amount","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"sendSurplusGas","inputs":[{"name":"to","type":"address"}],"outputs":[]}],"data":[{"key":1,"name":"root_","type":"address"},{"key":2,"name":"owner_","type":"address"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"root_","type":"address"},{"name":"owner_","type":"address"},{"name":"balance_","type":"uint128"}]} as const
const tokenWalletDeployerAbi = {"ABIversion":2,"version":"2.2","header":["time"],"functions":[{"name":"constructor","inputs":[{"name":"wallets","type":"uint32"},{"name":"root","type":"address"},{"name":"remaining_gas_to","type":"address"}],"outputs":[]},{"name":"deployWalletCallback","inputs":[{"name":"value0","type":"address"}],"outputs":[]},{"name":"_randomNonce","inputs":[],"outputs":[{"name":"_randomNonce","type":"uint256"}]}],"data":[{"key":1,"name":"_randomNonce","type":"uint256"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"_randomNonce","type":"uint256"}]} as const
const tokenWalletPlatformAbi = {"ABIversion":2,"version":"2.2","header":["time"],"functions":[{"name":"constructor","id":"0x15A038FB","inputs":[{"name":"walletCode","type":"cell"},{"name":"walletVersion","type":"uint32"},{"name":"sender","type":"address"},{"name":"remainingGasTo","type":"address"}],"outputs":[]}],"data":[{"key":1,"name":"root","type":"address"},{"key":2,"name":"owner","type":"address"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"root","type":"address"},{"name":"owner","type":"address"}]} as const
const tokenWalletUpgradeableAbi = {"ABIversion":2,"version":"2.2","header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[],"outputs":[]},{"name":"supportsInterface","inputs":[{"name":"answerId","type":"uint32"},{"name":"interfaceID","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"platformCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"cell"}]},{"name":"onDeployRetry","id":"0x15A038FB","inputs":[{"name":"value0","type":"cell"},{"name":"value1","type":"uint32"},{"name":"sender","type":"address"},{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"version","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"upgrade","inputs":[{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"acceptUpgrade","inputs":[{"name":"newCode","type":"cell"},{"name":"newVersion","type":"uint32"},{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"burnByRoot","inputs":[{"name":"amount","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"destroy","inputs":[{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"burn","inputs":[{"name":"amount","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"balance","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint128"}]},{"name":"owner","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"root","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"walletCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"cell"}]},{"name":"transfer","inputs":[{"name":"amount","type":"uint128"},{"name":"recipient","type":"address"},{"name":"deployWalletValue","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"transferToWallet","inputs":[{"name":"amount","type":"uint128"},{"name":"recipientTokenWallet","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"acceptTransfer","id":"0x67A0B95F","inputs":[{"name":"amount","type":"uint128"},{"name":"sender","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"acceptMint","id":"0x4384F298","inputs":[{"name":"amount","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"sendSurplusGas","inputs":[{"name":"to","type":"address"}],"outputs":[]}],"data":[{"key":1,"name":"root_","type":"address"},{"key":2,"name":"owner_","type":"address"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"root_","type":"address"},{"name":"owner_","type":"address"},{"name":"balance_","type":"uint128"},{"name":"version_","type":"uint32"},{"name":"platformCode_","type":"cell"}]} as const
const transferUtilsAbi = {"ABIversion":2,"version":"2.2","header":["time"],"functions":[{"name":"constructor","inputs":[],"outputs":[]}],"data":[],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"}]} as const
const upgradeAssistantBatchAbi = {"ABIversion":2,"version":"2.2","header":["pubkey","time"],"functions":[{"name":"constructor","inputs":[{"name":"worker_","type":"uint256"},{"name":"owner_","type":"address"}],"outputs":[]},{"name":"addWallets","inputs":[{"name":"wallets_","type":"address[]"}],"outputs":[]},{"name":"upgrade","inputs":[],"outputs":[]},{"name":"continueUpgrade","inputs":[],"outputs":[]},{"name":"wallets","inputs":[],"outputs":[{"name":"wallets","type":"address[]"}]},{"name":"wallets_pointer","inputs":[],"outputs":[{"name":"wallets_pointer","type":"uint256"}]},{"name":"worker","inputs":[],"outputs":[{"name":"worker","type":"uint256"}]},{"name":"owner","inputs":[],"outputs":[{"name":"owner","type":"address"}]}],"data":[{"key":1,"name":"fabric","type":"address"},{"key":2,"name":"nonce","type":"uint32"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"fabric","type":"address"},{"name":"nonce","type":"uint32"},{"name":"wallets","type":"address[]"},{"name":"wallets_pointer","type":"uint256"},{"name":"worker","type":"uint256"},{"name":"owner","type":"address"}]} as const
const upgradeAssistantFabricAbi = {"ABIversion":2,"version":"2.2","header":["time"],"functions":[{"name":"constructor","inputs":[{"name":"owner_","type":"address"},{"name":"worker_","type":"uint256"},{"name":"root_","type":"address"},{"name":"upgrade_assistant_batch_code_","type":"cell"},{"name":"batches_","type":"uint32"}],"outputs":[]},{"name":"deployBatches","inputs":[],"outputs":[]},{"name":"deriveBatch","inputs":[{"name":"batch_id","type":"uint32"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"upgrade","inputs":[],"outputs":[]},{"name":"acceptUpgrade","inputs":[{"name":"nonce","type":"uint32"},{"name":"wallets","type":"address[]"}],"outputs":[]},{"name":"revokeOwnership","inputs":[],"outputs":[]},{"name":"transferOwnership","inputs":[{"name":"newOwner","type":"address"}],"outputs":[]},{"name":"renounceOwnership","inputs":[],"outputs":[]},{"name":"owner","inputs":[],"outputs":[{"name":"owner","type":"address"}]},{"name":"_randomNonce","inputs":[],"outputs":[{"name":"_randomNonce","type":"uint256"}]},{"name":"root","inputs":[],"outputs":[{"name":"root","type":"address"}]},{"name":"worker","inputs":[],"outputs":[{"name":"worker","type":"uint256"}]},{"name":"batches","inputs":[],"outputs":[{"name":"batches","type":"uint32"}]},{"name":"batches_deployed","inputs":[],"outputs":[{"name":"batches_deployed","type":"uint32"}]},{"name":"upgrade_assistant_batch_code","inputs":[],"outputs":[{"name":"upgrade_assistant_batch_code","type":"cell"}]}],"data":[{"key":1,"name":"_randomNonce","type":"uint256"}],"events":[{"name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address"},{"name":"newOwner","type":"address"}],"outputs":[]},{"name":"NewBatch","inputs":[{"name":"batch_id","type":"uint32"},{"name":"batch","type":"address"}],"outputs":[]}],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"owner","type":"address"},{"name":"_randomNonce","type":"uint256"},{"name":"root","type":"address"},{"name":"worker","type":"uint256"},{"name":"batches","type":"uint32"},{"name":"batches_deployed","type":"uint32"},{"name":"upgrade_assistant_batch_code","type":"cell"}]} as const
const upgradeDrainAbi = {"ABIversion":2,"version":"2.2","header":["time"],"functions":[{"name":"constructor","inputs":[],"outputs":[]}],"data":[],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"}]} as const
const vaultTokenRoot_V1Abi = {"ABIversion":2,"version":"2.2","header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[],"outputs":[]},{"name":"supportsInterface","inputs":[{"name":"answerId","type":"uint32"},{"name":"interfaceID","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"requestUpgradeWallet","inputs":[{"name":"currentVersion","type":"uint32"},{"name":"walletOwner","type":"address"},{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"setWalletCode","inputs":[{"name":"code","type":"cell"}],"outputs":[]},{"name":"walletVersion","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"platformCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"cell"}]},{"name":"acceptBurn","id":"0x192B51B1","inputs":[{"name":"amount","type":"uint128"},{"name":"walletOwner","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"getReserves","inputs":[],"outputs":[{"name":"value0","type":"uint128"}]},{"name":"acceptWrap","inputs":[{"name":"walletOwner","type":"address"},{"name":"amount","type":"uint128"},{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"grant","inputs":[],"outputs":[]},{"name":"wrap","inputs":[{"name":"tokens","type":"uint128"},{"name":"recipient","type":"address"},{"name":"deployWalletValue","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"onAcceptTokensTransfer","inputs":[{"name":"tokenRoot","type":"address"},{"name":"amount","type":"uint128"},{"name":"sender","type":"address"},{"name":"senderWallet","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"upgradeWallets","inputs":[{"name":"wallets","type":"address[]"},{"name":"accept_upgrade_value","type":"uint128"}],"outputs":[]},{"name":"upgrade","inputs":[{"name":"code","type":"cell"}],"outputs":[]},{"name":"disableMint","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"mintDisabled","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"burnTokens","inputs":[{"name":"amount","type":"uint128"},{"name":"walletOwner","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"disableBurnByRoot","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"burnByRootDisabled","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"burnPaused","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"setBurnPaused","inputs":[{"name":"answerId","type":"uint32"},{"name":"paused","type":"bool"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"transferOwnership","inputs":[{"name":"newOwner","type":"address"},{"name":"remainingGasTo","type":"address"},{"components":[{"name":"value","type":"uint128"},{"name":"payload","type":"cell"}],"name":"callbacks","type":"map(address,tuple)"}],"outputs":[]},{"name":"name","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"string"}]},{"name":"symbol","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"string"}]},{"name":"decimals","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint8"}]},{"name":"totalSupply","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint128"}]},{"name":"walletCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"cell"}]},{"name":"rootOwner","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"walletOf","inputs":[{"name":"answerId","type":"uint32"},{"name":"walletOwner","type":"address"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"deployWallet","inputs":[{"name":"answerId","type":"uint32"},{"name":"walletOwner","type":"address"},{"name":"deployWalletValue","type":"uint128"}],"outputs":[{"name":"tokenWallet","type":"address"}]},{"name":"mint","inputs":[{"name":"amount","type":"uint128"},{"name":"recipient","type":"address"},{"name":"deployWalletValue","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"sendSurplusGas","inputs":[{"name":"to","type":"address"}],"outputs":[]}],"data":[{"key":1,"name":"name_","type":"string"},{"key":2,"name":"symbol_","type":"string"},{"key":3,"name":"decimals_","type":"uint8"},{"key":4,"name":"rootOwner_","type":"address"},{"key":5,"name":"walletCode_","type":"cell"},{"key":6,"name":"randomNonce_","type":"uint256"},{"key":7,"name":"deployer_","type":"address"},{"key":8,"name":"platformCode_","type":"cell"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"name_","type":"string"},{"name":"symbol_","type":"string"},{"name":"decimals_","type":"uint8"},{"name":"rootOwner_","type":"address"},{"name":"walletCode_","type":"cell"},{"name":"totalSupply_","type":"uint128"},{"name":"burnPaused_","type":"bool"},{"name":"burnByRootDisabled_","type":"bool"},{"name":"mintDisabled_","type":"bool"},{"name":"randomNonce_","type":"uint256"},{"name":"deployer_","type":"address"},{"name":"platformCode_","type":"cell"},{"name":"walletVersion_","type":"uint32"}]} as const
const vaultTokenWallet_V1Abi = {"ABIversion":2,"version":"2.2","header":["pubkey","time","expire"],"functions":[{"name":"constructor","inputs":[],"outputs":[]},{"name":"supportsInterface","inputs":[{"name":"answerId","type":"uint32"},{"name":"interfaceID","type":"uint32"}],"outputs":[{"name":"value0","type":"bool"}]},{"name":"platformCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"cell"}]},{"name":"onDeployRetry","id":"0x15A038FB","inputs":[{"name":"value0","type":"cell"},{"name":"value1","type":"uint32"},{"name":"sender","type":"address"},{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"version","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint32"}]},{"name":"upgrade","inputs":[{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"acceptUpgrade","inputs":[{"name":"newCode","type":"cell"},{"name":"newVersion","type":"uint32"},{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"acceptMint","id":"0x4384F298","inputs":[{"name":"amount","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"transfer","inputs":[{"name":"amount","type":"uint128"},{"name":"recipient","type":"address"},{"name":"deployWalletValue","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"acceptTransfer","id":"0x67A0B95F","inputs":[{"name":"amount","type":"uint128"},{"name":"sender","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"burnByRoot","inputs":[{"name":"amount","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"destroy","inputs":[{"name":"remainingGasTo","type":"address"}],"outputs":[]},{"name":"burn","inputs":[{"name":"amount","type":"uint128"},{"name":"remainingGasTo","type":"address"},{"name":"callbackTo","type":"address"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"balance","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"uint128"}]},{"name":"owner","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"root","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"address"}]},{"name":"walletCode","inputs":[{"name":"answerId","type":"uint32"}],"outputs":[{"name":"value0","type":"cell"}]},{"name":"transferToWallet","inputs":[{"name":"amount","type":"uint128"},{"name":"recipientTokenWallet","type":"address"},{"name":"remainingGasTo","type":"address"},{"name":"notify","type":"bool"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"sendSurplusGas","inputs":[{"name":"to","type":"address"}],"outputs":[]}],"data":[{"key":1,"name":"root_","type":"address"},{"key":2,"name":"owner_","type":"address"}],"events":[],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"root_","type":"address"},{"name":"owner_","type":"address"},{"name":"balance_","type":"uint128"},{"name":"version_","type":"uint32"},{"name":"platformCode_","type":"cell"}]} as const
const walletAbi = {"ABIversion":2,"version":"2.2","header":["time"],"functions":[{"name":"sendTransaction","inputs":[{"name":"dest","type":"address"},{"name":"value","type":"uint128"},{"name":"bounce","type":"bool"},{"name":"flags","type":"uint8"},{"name":"payload","type":"cell"}],"outputs":[]},{"name":"transferOwnership","inputs":[{"name":"newOwner","type":"uint256"}],"outputs":[]},{"name":"constructor","inputs":[],"outputs":[]},{"name":"owner","inputs":[],"outputs":[{"name":"owner","type":"uint256"}]},{"name":"_randomNonce","inputs":[],"outputs":[{"name":"_randomNonce","type":"uint256"}]}],"data":[{"key":1,"name":"_randomNonce","type":"uint256"}],"events":[{"name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"uint256"},{"name":"newOwner","type":"uint256"}],"outputs":[]}],"fields":[{"name":"_pubkey","type":"uint256"},{"name":"_timestamp","type":"uint64"},{"name":"_constructorFlag","type":"bool"},{"name":"owner","type":"uint256"},{"name":"_randomNonce","type":"uint256"}]} as const

export const factorySource = {
    Airdrop: airdropAbi,
    Selector: selectorAbi,
    TokenRoot: tokenRootAbi,
    TokenRootUpgradeable: tokenRootUpgradeableAbi,
    TokenWallet: tokenWalletAbi,
    TokenWalletDeployer: tokenWalletDeployerAbi,
    TokenWalletPlatform: tokenWalletPlatformAbi,
    TokenWalletUpgradeable: tokenWalletUpgradeableAbi,
    TransferUtils: transferUtilsAbi,
    UpgradeAssistantBatch: upgradeAssistantBatchAbi,
    UpgradeAssistantFabric: upgradeAssistantFabricAbi,
    UpgradeDrain: upgradeDrainAbi,
    VaultTokenRoot_V1: vaultTokenRoot_V1Abi,
    VaultTokenWallet_V1: vaultTokenWallet_V1Abi,
    Wallet: walletAbi
} as const

export type FactorySource = typeof factorySource
export type AirdropAbi = typeof airdropAbi
export type SelectorAbi = typeof selectorAbi
export type TokenRootAbi = typeof tokenRootAbi
export type TokenRootUpgradeableAbi = typeof tokenRootUpgradeableAbi
export type TokenWalletAbi = typeof tokenWalletAbi
export type TokenWalletDeployerAbi = typeof tokenWalletDeployerAbi
export type TokenWalletPlatformAbi = typeof tokenWalletPlatformAbi
export type TokenWalletUpgradeableAbi = typeof tokenWalletUpgradeableAbi
export type TransferUtilsAbi = typeof transferUtilsAbi
export type UpgradeAssistantBatchAbi = typeof upgradeAssistantBatchAbi
export type UpgradeAssistantFabricAbi = typeof upgradeAssistantFabricAbi
export type UpgradeDrainAbi = typeof upgradeDrainAbi
export type VaultTokenRoot_V1Abi = typeof vaultTokenRoot_V1Abi
export type VaultTokenWallet_V1Abi = typeof vaultTokenWallet_V1Abi
export type WalletAbi = typeof walletAbi
