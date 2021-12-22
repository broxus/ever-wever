pragma ton-solidity >= 0.39.0;
pragma AbiHeader time;
pragma AbiHeader expire;
pragma AbiHeader pubkey;

import "./../ErrorCodes.sol";

import "./../interfaces/IProxy.sol";

import "./../../../node_modules/ethereum-freeton-bridge-contracts/free-ton/contracts/bridge/interfaces/event-configuration-contracts/ITonEventConfiguration.sol";
import "./../../../node_modules/ethereum-freeton-bridge-contracts/free-ton/contracts/bridge/interfaces/event-contracts/IEthereumEvent.sol";
import "./../../../node_modules/ethereum-freeton-bridge-contracts/free-ton/contracts/utils/cell-encoder/CellEncoder.sol";
import "./../../../node_modules/ethereum-freeton-bridge-contracts/free-ton/contracts/utils/TransferUtils.sol";

import './../../../node_modules/@broxus/contracts/contracts/access/InternalOwner.sol';
import './../../../node_modules/@broxus/contracts/contracts/utils/CheckPubKey.sol';
import './../../../node_modules/@broxus/contracts/contracts/utils/RandomNonce.sol';
import "./../../../node_modules/@broxus/contracts/contracts/libraries/MsgFlag.sol";

import "./../../../node_modules/broxus-ton-tokens-contracts/free-ton/contracts/interfaces/IRootTokenContract.sol";
import "./../../../node_modules/broxus-ton-tokens-contracts/free-ton/contracts/interfaces/ITONTokenWallet.sol";
import "./../../../node_modules/broxus-ton-tokens-contracts/free-ton/contracts/interfaces/ITokensReceivedCallback.sol";

/// @title Proxy for cross chain token transfers
/// @dev In case of ETH-TON token transfer, this proxy should receive
/// callback from the corresponding EthereumEventConfiguration. After that it transfers
/// the specified amount of tokens to the user.
/// In case of TON-ETH token transfer, this proxy should receive transfer callback from the token
/// and deploy TONEvent with `Withdraw` data.
contract ProxyTokenTransfer is
    IProxy,
    ITokensReceivedCallback,
    RandomNonce,
    TransferUtils,
    CellEncoder,
    InternalOwner,
    CheckPubKey
{
    event Withdraw(int8 wid, uint256 addr, uint128 tokens, uint160 eth_addr, uint32 chainId);

    Configuration config;

    uint128 received_count;
    uint128 transferred_count;

    address public token_wallet;

    modifier onlyEthereumConfiguration() {
        require(isArrayContainsAddress(config.ethereumConfigurations, msg.sender), ErrorCodes.NOT_ETHEREUM_CONFIG);
        _;
    }

    constructor(address owner_) public checkPubKey {
        tvm.accept();

        setOwnership(owner_);
    }

    /*
        @notice Creates vault token wallet according to the configuration root token
    */
    function setUpTokenWallet() internal view {
        // Deploy token wallet
        IRootTokenContract(config.tokenRoot).deployEmptyWallet{value: 1 ton}(
            config.settingsDeployWalletGrams,
            0,
            address(this),
            address(this)
        );

        // Request for token wallet address
        IRootTokenContract(config.tokenRoot).getWalletAddress{
            value: 1 ton,
            callback: ProxyTokenTransfer.receiveTokenWalletAddress
        }(
            0,
            address(this)
        );
    }

    /*
        @notice Store vault's token wallet address
        @dev Only root can call with correct params
        @param wallet Vault's token wallet
    */
    function receiveTokenWalletAddress(
        address wallet
    ) external {
        require(msg.sender == config.tokenRoot, ErrorCodes.WRONG_TOKEN_ROOT);

        token_wallet = wallet;

        ITONTokenWallet(token_wallet)
            .setReceiveCallback(address(this), false);
    }

    function broxusBridgeCallback(
        IEthereumEvent.EthereumEventInitData eventData,
        address gasBackAddress
    ) public override onlyEthereumConfiguration reserveBalance {
        require(config.tokenRoot.value != 0, ErrorCodes.PROXY_TOKEN_ROOT_IS_EMPTY);

        (
            uint128 tokens,
            int8 wid,
            uint256 owner_addr
        ) = decodeEthereumEventData(eventData.voteData.eventData);

        address owner_address = address.makeAddrStd(wid, owner_addr);

        require(tokens > 0, ErrorCodes.WRONG_TOKENS_AMOUNT_IN_PAYLOAD);
        require(owner_address.value != 0, ErrorCodes.WRONG_OWNER_IN_PAYLOAD);

        TvmCell empty;

        transferred_count += tokens;

        ITONTokenWallet(token_wallet).transferToRecipient{value: 0, flag: MsgFlag.ALL_NOT_RESERVED}(
            0,
            owner_address,
            tokens,
            config.settingsDeployWalletGrams,
            config.settingsTransferGrams,
            gasBackAddress,
            false,
            empty
        );
    }

    function tokensReceivedCallback(
        address token_wallet_,
        address token_root_,
        uint128 tokens_amount,
        uint256 /*sender_public_key*/,
        address /*sender_address*/,
        address /*sender_wallet*/,
        address original_gas_to,
        uint128 /*updated_balance*/,
        TvmCell payload
    ) override external {
        require(token_root_ == config.tokenRoot, ErrorCodes.WRONG_TOKEN_ROOT);
        require(token_wallet_ == msg.sender, ErrorCodes.RECEIVED_WRONG_TOKEN);

        received_count += tokens_amount;

        (
            uint160 ethereumAddress,
            uint32 chainId
        ) = payload.toSlice().decode(uint160, uint32);

        TvmCell eventData = encodeTonEventData(
            original_gas_to.wid,
            original_gas_to.value,
            tokens_amount,
            ethereumAddress,
            chainId
        );

        ITonEvent.TonEventVoteData eventVoteData = ITonEvent.TonEventVoteData(tx.timestamp, now, eventData);

        ITonEventConfiguration(config.tonConfiguration).deployEvent{
            value: 0,
            flag: MsgFlag.ALL_NOT_RESERVED
        }(eventVoteData);
    }

    function getDetails() public view responsible returns (
        Configuration _config,
        address _owner,
        uint128 _received_count,
        uint128 _transferred_count,
        address _token_wallet
    ) {
        return{value: 0, bounce: false, flag: MsgFlag.REMAINING_GAS} (config, owner, received_count, transferred_count, token_wallet);
    }

    function getTokenRoot() public view responsible returns (address) {
        return{value: 0, bounce: false, flag: MsgFlag.REMAINING_GAS} config.tokenRoot;
    }

    function getConfiguration() override public view responsible returns (Configuration) {
        return{value: 0, bounce: false, flag: MsgFlag.REMAINING_GAS} config;
    }

    function setConfiguration(
        Configuration _config
    ) override public onlyOwner {
        config = _config;

        setUpTokenWallet();
    }

    function isArrayContainsAddress(
        address[] array,
        address searchElement
    ) private pure returns (bool){
        for (address value: array) {
            if (searchElement == value) {
                return true;
            }
        }

        return false;
    }

    function upgrade(TvmCell code, address send_gas_to) external onlyOwner {
        TvmBuilder main_builder;

        TvmBuilder config_builder;
        config_builder.store(config);

        TvmBuilder counter_builder;
        counter_builder.store(received_count); // 128
        counter_builder.store(transferred_count); // 128

        main_builder.storeRef(config_builder);
        main_builder.storeRef(counter_builder);

        main_builder.store(_randomNonce); // 256
        main_builder.store(send_gas_to); // 267
        main_builder.store(token_wallet); // 267

        tvm.setcode(code);
        tvm.setCurrentCode(code);
        onCodeUpgrade(main_builder.toSlice());
    }

    function onCodeUpgrade(TvmSlice upgrade_data) private {}
}