pragma ton-solidity >= 0.39.0;


import "./event-contracts/IEverscaleEvent.sol";


interface IEverscaleEventConfiguration {
    function deployEvent(
        IEverscaleEvent.EverscaleEventVoteData eventVoteData
    ) external;
}