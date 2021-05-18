pragma ton-solidity ^0.39.0;
pragma AbiHeader expire;
pragma AbiHeader pubkey;


import '../../node_modules/broxus-ton-tokens-contracts/free-ton/contracts/interfaces/ITokensReceivedCallback.sol';
import '../../node_modules/broxus-ton-tokens-contracts/free-ton/contracts/interfaces/IRootTokenContract.sol';
import '../../node_modules/broxus-ton-tokens-contracts/free-ton/contracts/interfaces/IExpectedWalletAddressCallback.sol';
import '../../node_modules/broxus-ton-tokens-contracts/free-ton/contracts/interfaces/ITONTokenWallet.sol';
import '../../node_modules/broxus-ton-tokens-contracts/free-ton/contracts/interfaces/IBurnableByOwnerTokenWallet.sol';

import './ErrorCodes.sol';
import "./utils/Ownable.sol";

/*
    @title Wrapped TON vault.
    @notice TONs storage. Exchange TONs for wTONs 1:1 and backwards.
    @notice Receives TONs and mint wTONs
    @notice Receives wTONs, burn it and releases TONs
*/
contract WrappedTONVault is
    ErrorCodes,
    Ownable,
    ITokensReceivedCallback
{
    uint256 static _randomNonce;

    struct Configuration {
        address root_tunnel;
        address root;
        uint128 receive_safe_fee;
        uint128 settings_deploy_wallet_grams;
        uint128 initial_balance;
    }

    Configuration public configuration;

    // Fields bellow derives automatically
    address public token_wallet;
    uint128 public total_wrapped;

    constructor(
        address owner_,
        address root,
        address root_tunnel,
        uint128 receive_safe_fee,
        uint128 settings_deploy_wallet_grams,
        uint128 initial_balance
    ) public {
        require(tvm.pubkey() == msg.pubkey(), wrong_msg_key);
        tvm.accept();

        _transferOwnership(owner_);

        configuration.root = root;
        configuration.root_tunnel = root_tunnel;
        configuration.receive_safe_fee = receive_safe_fee;
        configuration.settings_deploy_wallet_grams = settings_deploy_wallet_grams;
        configuration.initial_balance = initial_balance;

        setUpTokenWallet();
    }

    /*
        @notice Creates vault token wallet according to the configuration root token
    */
    function setUpTokenWallet() internal view {
        // Deploy vault's token wallet
        IRootTokenContract(configuration.root).deployEmptyWallet{value: 1 ton}(
            configuration.settings_deploy_wallet_grams,
            0,
            address(this),
            address(this)
        );

        // Request for vault's token wallet address
        IRootTokenContract(configuration.root).getWalletAddress{
            value: 1 ton,
            callback: WrappedTONVault.receiveTokenWalletAddress
        }(
            0,
            address(this)
        );
    }

    /*
        @notice Drain odd TONs
        @dev Can be called only by owner
        @param receiver Address to send odd TONs to
    */
    function drain(address receiver) onlyOwner(msg.sender) public view {
        tvm.rawReserve(total_wrapped + configuration.initial_balance, 2);

        receiver.transfer({ value: 0, flag: 129 });
    }

    /*
        @notice Updates configuration
        @dev Can be called only by owner
        @param _configuration New configuration
    */
    function setConfiguration(
        Configuration _configuration
    ) external onlyOwner(msg.sender) {
        address previous_root = configuration.root;

        configuration = _configuration;

        if (configuration.root != previous_root) {
            setUpTokenWallet();
        }
    }

    /*
        @notice Withdraw TONs from the vault
        @dev Can be called only by owner
        @dev TONs are send to the owner wallet
        @param value How much TONs to withdraw
    */
    function withdraw(
        uint128 value
    ) external view onlyOwner(msg.sender) {
        owner.transfer({ value: value + msg.value });
    }

    /*
        @notice Send TONs to the vault without issuing TONs
        @dev Be careful! Since you don't have WTON tokens, you can't redeem granted TONs
    */
    function grant() external view {}

    /*
        @notice Store vault's token wallet address
        @dev Only root can call with correct params
        @param wallet Vault's token wallet
    */
    function receiveTokenWalletAddress(
        address wallet
    ) external {
        require(msg.sender == configuration.root, wrong_root);

        token_wallet = wallet;
    }

    /*
        @notice Set vault as a receiver for token wallet
        @dev Can be called only by owner
    */
    function setTokenWalletReceive() external view onlyOwner(msg.sender) {
        ITONTokenWallet(token_wallet)
            .setReceiveCallback(address(this), false);
    }

    /*
        @notice Receive TONs to wrap them into wTON.
        Allows to simply mint wTONs by sending them directly to vault.
        @dev msg.value should be > receive_safe_fee
        @dev Amount of minted tokens = msg.value - receive_safe_fee
        @dev Rest of the TONs will be sent back
    */
    receive() external {
        require(msg.value > configuration.receive_safe_fee, msg_value_too_low);

        uint128 tokens = msg.value - configuration.receive_safe_fee;

        updateTotalWrapped(tokens);

        tvm.rawReserve(total_wrapped + configuration.initial_balance, 2);

        IRootTokenContract(configuration.root_tunnel).deployWallet{ value: 0, flag: 128 }(
            tokens,
            configuration.settings_deploy_wallet_grams,
            0,
            msg.sender,
            msg.sender
        );
    }

    /*
        @notice Updates total wrapped amount
        @param change Change amount
    */
    function updateTotalWrapped(uint128 change) internal {
        total_wrapped += change;
    }

    /*
        @notice Internal function for minting wTONs
        @dev Works since Vault is authorized for minting tokens
        @param tokens How much tokens to mint
        @param wallet_public_key Token wallet owner public key
        @param owner_address Token wallet owner address
        @param gas_back_address Address to send change
    */

    function wrap(
        uint128 tokens,
        uint wallet_public_key,
        address owner_address,
        address gas_back_address
    ) external {
        require(
            msg.value >= tokens + configuration.receive_safe_fee,
            msg_value_too_low
        );

        updateTotalWrapped(tokens);

        tvm.rawReserve(total_wrapped + configuration.initial_balance, 2);

        IRootTokenContract(configuration.root_tunnel).deployWallet{ value: 0, flag: 128 }(
            tokens,
            configuration.settings_deploy_wallet_grams,
            wallet_public_key,
            owner_address,
            gas_back_address
        );
    }

    /*
        @notice Receive wTONs to burn them and release TONs
        @dev Callback function from vault token wallet
        @dev TONs will be sent to original_gas_to
    */
    function tokensReceivedCallback(
        address token_wallet_,
        address token_root_,
        uint128 tokens_amount,
        uint256 /*sender_public_key*/,
        address /*sender_address*/,
        address /*sender_wallet*/,
        address original_gas_to,
        uint128 /*updated_balance*/,
        TvmCell /*payload*/
    ) override external {
        // TODO: fix auth
        require(token_root_ == configuration.root, wrong_root);
        require(token_wallet == token_wallet_, wrong_token_wallet);
        require(msg.sender == token_wallet, wrong_token_wallet);

        updateTotalWrapped(-tokens_amount);

        tvm.rawReserve(total_wrapped + configuration.initial_balance, 2);

        TvmCell empty;

        // Burn wTONs
        IBurnableByOwnerTokenWallet(token_wallet).burnByOwner{value: 0, flag: 128}(
            tokens_amount,
            0,
            original_gas_to,
            address.makeAddrStd(0,0),
            empty
        );
    }
}
