pragma ton-solidity >= 0.39.0;


interface IVault {
    struct Configuration {
        address root;
        address tokenWallet;
        uint128 receiveSafeFeeGrams;
        uint128 deployWalletGrams;
        uint128 initialBalanceGrams;
    }

    function getDetails() external view responsible returns(Configuration _configuration, uint128 _totalWrapped);
}
