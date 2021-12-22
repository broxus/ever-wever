pragma ton-solidity >= 0.39.0;


interface ITunnel {
    fallback() external view;

    function __updateTunnel(
        address source,
        address destination
    ) external;

    function __removeTunnel(
        address source
    ) external;

    function __getTunnels() external view returns(
        address[] sources,
        address[] destinations
    );
}
