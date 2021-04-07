pragma ton-solidity ^0.39.0;

import "../utils/Ownable.sol";


/*
    @notice Helper contract for storing root meta information
    @dev Contract address is derived from the root token wallet
*/
contract RootMeta is Ownable {
    address public static root;

    mapping(uint16 => TvmCell) public meta;

    constructor(address owner_) public {
        require(tvm.pubkey() == msg.pubkey(), 101, "RootMeta: Wrong deploy key");

        tvm.accept();

        _transferOwnership(owner_);
    }

    function _setValue(uint16 key, TvmCell value) internal {
        meta[key] = value;
    }

    function setValue(uint16 key, TvmCell value) public onlyOwner(msg.sender) {
        tvm.rawReserve(address(this).balance - msg.value, 2);

        _setValue(key, value);

        msg.sender.transfer({ value: 0, flag: 129 });
    }

    function getMetaByKey(uint16 key) public view returns(TvmCell value) {
        return meta[key];
    }
}
