pragma ton-solidity >= 0.39.0;

pragma AbiHeader expire;
pragma AbiHeader pubkey;


import "./interfaces/ITunnel.sol";

import "./utils/Pausable.sol";


/**
    @title Tunnels contract which receives and pass messages.
    Stores the set of (source, destination)
    Proxies every message from source to destination

    @dev Only sources are authorized to send messages to Tunnel
*/
contract Tunnels is ITunnel, Pausable {
    uint256 static _randomNonce;

    mapping(address => address) tunnels;

    modifier onlySource(address source) {
        require(tunnels.exists(source), 101, "Tunnel: Not source");
        _;
    }

    constructor(
        address[] sources,
        address[] destinations,
        address owner_
    ) public {
        require(tvm.pubkey() == msg.pubkey(), 101, "Tunnel: Wrong deploy key");
        require(sources.length == destinations.length, 101, "Tunnel: source and destinations size different");
        tvm.accept();

        setOwnership(owner_);

        for (uint i=0; i < sources.length; i++) {
            tunnels[sources[i]] = destinations[i];
        }
    }

    fallback() override onlySource(msg.sender) external view {
        tvm.rawReserve(address(this).balance - msg.value, 2);

        TvmBuilder payload;
        payload.store(msg.data);

        tunnels[msg.sender].transfer({ value: 0, flag: 128, body: payload.toCell() });
    }

    function __getTunnels() public override view returns(
        address[] sources,
        address[] destinations
    ) {
        for ((address source, address destination): tunnels) {
            sources.push(source);
            destinations.push(destination);
        }
    }

    function __updateTunnel(
        address source,
        address destination
    ) onlyOwner public override {
        tunnels[source] = destination;
    }

    function __removeTunnel(
        address source
    ) onlyOwner public override {
        delete tunnels[source];
    }
}
