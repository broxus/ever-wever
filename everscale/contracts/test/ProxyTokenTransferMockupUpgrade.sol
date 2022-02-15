pragma ton-solidity >= 0.39.0;


import "./../interfaces/IProxy.sol";

import "../bridge-integration/ProxyTokenTransfer.sol";

import '@broxus/contracts/contracts/utils/RandomNonce.sol';
import "@broxus/contracts/contracts/libraries/MsgFlag.sol";
import '@broxus/contracts/contracts/access/InternalOwner.sol';


contract ProxyTokenTransferMockupUpgrade is RandomNonce, InternalOwner {
    IProxy.Configuration config;

    uint128 received_count;
    uint128 transferred_count;

    address public token_wallet;

    function getDetails() public view responsible returns (
        IProxy.Configuration _config,
        address _owner,
        uint128 _received_count,
        uint128 _transferred_count,
        address _token_wallet
    ) {
        return{value: 0, bounce: false, flag: MsgFlag.REMAINING_GAS} (config, owner, received_count, transferred_count, token_wallet);
    }

    function apiVersion() external pure returns(string API_VERSION) {
        return "0.2.0";
    }

    function onCodeUpgrade(TvmSlice upgrade_data) private {
        tvm.resetStorage();

        TvmSlice configSlice = upgrade_data.loadRefAsSlice();
        (config) = configSlice.decode(IProxy.Configuration);

        TvmSlice counterSlice = upgrade_data.loadRefAsSlice();
        (
            received_count,
            transferred_count
        ) = counterSlice.decode(uint128, uint128);

        TvmSlice ownerSlice = upgrade_data.loadRefAsSlice();
        (owner) = ownerSlice.decode(address);

        address send_gas_to;

        (
            _randomNonce,
            send_gas_to,
            token_wallet
        ) = upgrade_data.decode(uint, address, address);

//        send_gas_to.transfer({ value: 0, bounce: false, flag: MsgFlag.ALL_NOT_RESERVED });
    }
}