pragma ton-solidity >= 0.39.0;
pragma AbiHeader time;
pragma AbiHeader expire;
pragma AbiHeader pubkey;

import "./../ErrorCodes.sol";
import "./../utils/TransferUtils.sol";
import "./../utils/CellEncoder.sol";

import "./../interfaces/IProxy.sol";
import './../interfaces/bridge/event-contracts/IEthereumEvent.sol';
import './../interfaces/bridge/event-contracts/IEverscaleEvent.sol';
import './../interfaces/bridge/IEverscaleEventConfiguration.sol';

import 'ton-eth-bridge-token-contracts/contracts/interfaces/IAcceptTokensTransferCallback.sol';
import 'ton-eth-bridge-token-contracts/contracts/interfaces/ITokenRoot.sol';
import 'ton-eth-bridge-token-contracts/contracts/interfaces/ITokenWallet.sol';

import '@broxus/contracts/contracts/access/InternalOwner.sol';
import '@broxus/contracts/contracts/utils/CheckPubKey.sol';
import '@broxus/contracts/contracts/utils/RandomNonce.sol';
import "@broxus/contracts/contracts/libraries/MsgFlag.sol";


/// @title Proxy for cross chain token transfers
/// @dev In case of ETH-TON token transfer, this proxy should receive
/// callback from the corresponding EthereumEventConfiguration. After that it transfers
/// the specified amount of tokens to the user.
/// In case of TON-ETH token transfer, this proxy should receive transfer callback from the token
/// and deploy EverscaleEvent with `Withdraw` data.
contract ProxyTokenTransfer is
    IProxy,
    IAcceptTokensTransferCallback,
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
        setUpTokenWallet();
    }

    function apiVersion() external pure returns(string API_VERSION) {
        return "0.1.0";
    }

    /**
        @notice Deploys proxy token wallet
    */
    function setUpTokenWallet() internal view {
        ITokenRoot(config.root).deployWallet{
            value: 1 ton,
            callback: ProxyTokenTransfer.receiveTokenWalletAddress
        }(
            address(this),
            config.settingsDeployWalletGrams
        );
    }

    /**
        @notice Saves proxy token wallet address
        @dev Only root can call with correct params
        @param wallet Proxy token wallet
    */
    function receiveTokenWalletAddress(
        address wallet
    ) external {
        require(msg.sender == config.root, ErrorCodes.WRONG_ROOT);

        token_wallet = wallet;
    }

    function onEventConfirmed(
        IEthereumEvent.EthereumEventInitData eventData,
        address gasBackAddress
    )
        external
        override
        onlyEthereumConfiguration
        reserveBalance
    {
        require(config.root.value != 0, ErrorCodes.PROXY_TOKEN_ROOT_IS_EMPTY);

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

        ITokenWallet(token_wallet).transfer{value: 0, flag: MsgFlag.ALL_NOT_RESERVED}(
            tokens,
            owner_address,
            config.settingsDeployWalletGrams,
            gasBackAddress,
            true,
            empty
        );
    }

    function onAcceptTokensTransfer(
        address tokenRoot,
        uint128 amount,
        address sender,
        address senderWallet,
        address remainingGasTo,
        TvmCell payload
    ) override external {
        require(tokenRoot == config.root, ErrorCodes.WRONG_TOKEN_ROOT);
        require(token_wallet == msg.sender, ErrorCodes.RECEIVED_WRONG_TOKEN);

        received_count += amount;

        (
            uint160 ethereumAddress,
            uint32 chainId
        ) = payload.toSlice().decode(uint160, uint32);

        TvmCell eventData = encodeEverscaleEventData(
            remainingGasTo.wid,
            remainingGasTo.value,
            amount,
            ethereumAddress,
            chainId
        );

        IEverscaleEvent.EverscaleEventVoteData eventVoteData = IEverscaleEvent.EverscaleEventVoteData(
            tx.timestamp,
            now,
            eventData
        );

        IEverscaleEventConfiguration(config.tonConfiguration).deployEvent{
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
        return{value: 0, bounce: false, flag: MsgFlag.REMAINING_GAS} (
            config,
            owner,
            received_count,
            transferred_count,
            token_wallet
        );
    }

    function getTokenRoot() public view responsible returns (address) {
        return{value: 0, bounce: false, flag: MsgFlag.REMAINING_GAS} config.root;
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

    function upgrade(TvmCell code, address send_gas_to) external onlyOwner {
        TvmBuilder main_builder;

        TvmBuilder config_builder;
        config_builder.store(config);

        TvmBuilder counter_builder;
        counter_builder.store(received_count); // 128
        counter_builder.store(transferred_count); // 128

        TvmBuilder owner_builder;
        owner_builder.store(owner); // 267

        main_builder.storeRef(config_builder);
        main_builder.storeRef(counter_builder);
        main_builder.storeRef(owner_builder);

        main_builder.store(_randomNonce); // 256
        main_builder.store(send_gas_to); // 267
        main_builder.store(token_wallet); // 267

        tvm.setcode(code);
        tvm.setCurrentCode(code);
        onCodeUpgrade(main_builder.toSlice());
    }

    function onCodeUpgrade(TvmSlice upgrade_data) private {}

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
}