pragma ton-solidity >= 0.39.0;


import "./../../../node_modules/ethereum-freeton-bridge-contracts/free-ton/contracts/bridge/interfaces/event-contracts/IEthereumEvent.sol";


interface IProxy {
    struct Configuration {
        address tonConfiguration;
        address[] ethereumConfigurations;

        address tokenRoot;

        uint128 settingsDeployWalletGrams;
        uint128 settingsTransferGrams;
    }

    function getConfiguration() external view responsible returns (Configuration);
    function setConfiguration(Configuration _config) external;

    function broxusBridgeCallback(
        IEthereumEvent.EthereumEventInitData eventData,
        address gasBackAddress
    ) external;
}
