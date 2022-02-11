pragma ton-solidity >= 0.39.0;


interface IEverscaleEvent {
    struct EverscaleEventVoteData {
        uint64 eventTransactionLt;
        uint32 eventTimestamp;
        TvmCell eventData;
    }

    struct EverscaleEventInitData {
        EverscaleEventVoteData voteData;
        address configuration;
        address staking;
    }
}
