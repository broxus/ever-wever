pragma ton-solidity >= 0.39.0;


import "./bridge/event-contracts/IEthereumEvent.sol";


interface IProxy {
    struct Configuration {
        address tonConfiguration;
        address[] ethereumConfigurations;

        address root;

        uint128 settingsDeployWalletGrams;
        uint128 settingsTransferGrams;
    }

    function getConfiguration() external view responsible returns (Configuration);
    function setConfiguration(Configuration _config) external;

    function onEventConfirmed(
        IEthereumEvent.EthereumEventInitData eventData,
        address gasBackAddress
    ) external;
}
