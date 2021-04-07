import "./RootMeta.sol";
pragma ton-solidity ^0.39.0;


contract RootMetaFactory {
    uint256 static _randomNonce;
    TvmCell public code;

    constructor(
        TvmCell code_
    ) public {
        tvm.accept();

        code = code_;
    }

    function deploy(
        address owner,
        address root
    )
        external
    returns(
        address rootMeta
    ) {
        tvm.rawReserve(address(this).balance - msg.value, 2);

        rootMeta = new RootMeta{
            value: 0.5 ton,
            pubkey: 0,
            code: code,
            varInit: {
                root: root
            }
        }(owner);

        msg.sender.transfer({ flag: 128, value: 0 });
    }
}
