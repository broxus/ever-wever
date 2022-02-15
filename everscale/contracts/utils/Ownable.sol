pragma ton-solidity >= 0.39.0;


contract Ownable {
    address public owner;

    modifier onlyOwner(address addr) {
        require(owner == addr, 123, "Ownable: not owner");
        _;
    }

    function _transferOwnership(address owner_) internal {
        owner = owner_;
    }

    function transferOwnership(address owner_) external onlyOwner(msg.sender) {
        _transferOwnership(owner_);
    }

    function renounceOwnership() external onlyOwner(msg.sender) {
        _transferOwnership(address.makeAddrStd(0, 0));
    }
}
