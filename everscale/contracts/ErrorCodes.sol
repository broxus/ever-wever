pragma ton-solidity >= 0.39.0;


library ErrorCodes {
    uint16 constant MSG_VALUE_TOO_LOW = 101;
    uint16 constant WRONG_ROOT = 102;
    uint16 constant WRONG_CALLBACK = 103;
    uint16 constant WRONG_TOKEN_WALLET = 105;
    uint16 constant ALREADY_DRAINED = 106;

    // Proxy token transfer
    uint16 constant PROXY_TOKEN_ROOT_IS_EMPTY = 1001;
    uint16 constant WRONG_TOKENS_AMOUNT_IN_PAYLOAD = 1002;
    uint16 constant WRONG_OWNER_IN_PAYLOAD = 1003;
    uint16 constant RECEIVED_WRONG_TOKEN = 1004;
    uint16 constant WRONG_TOKEN_ROOT = 1005;

    uint16 constant NOT_ETHEREUM_CONFIG = 2701;
}
