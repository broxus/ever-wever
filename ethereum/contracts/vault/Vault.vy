# @version 0.2.12
"""
@title Broxus Token Vault
@license GNU AGPLv3
@author https://tonbridge.io
@notice
    Broxus Token Vault is a fork of Yearn Token Vault v2.
    The Vault is used as an entry point for token transfers
    between EVM-compatible networks and FreeTON, by using Broxus bridge.

    Fork commit: https://github.com/yearn/yearn-vaults/tree/e20d7e61692e61b1583628f8f3f96b27f824fbb4

    The key differences are:

    - The Vault is no longer a share token. The ERC20 interface is not supported.
    No tokens are minted / burned on deposit / withdraw.
    - The share token equivalent is corresponding token in FreeTON network. So if you're
    depositing Dai in this Vault, you receives Dai in FreeTON.
    - When user deposits into Vault, he specifies his FreeTON address.
    In the end, the deposited amount of corresponding token will be transferred to this address.
    - To withdraw tokens from the Vault, user needs to provide "withdraw receipt"
    and corresponding set of relay's signatures.
    - If there're enough tokens on the Vault balance, the withdraw will be filled instantly
    - If not - the withdraw will be saved as a "pending withdraw". There're multiple ways to finalize
    pending withdrawal:
      1. User can specify so called `bounty` - how much tokens he wills to pay as a reward
      to anyone, who fills his pending withdrawal. Pending withdrawal can only be filled completely.
      2. User can use `withdraw` function, which works the same as original Yearn's withdraw.
      3. User can cancel his pending withdraw partially or entirely.
    - Since Vyper does not support dynamic size arrays and bytes-decoding, special contract `wrapper` is used
    for uploading withdraw receipts (`VaultWrapper.sol`).
    - Vault has emergency strategy withdraw
    - If total amount of pending withdrawals is more than `totalAssets()`, than strategies dont receive new
    debt
    - Vault may have deposit / withdraw fee

    ORIGINAL NOTE:

    Yearn Token Vault. Holds an underlying token, and allows users to interact
    with the Yearn ecosystem through Strategies connected to the Vault.
    Vaults are not limited to a single Strategy, they can have as many Strategies
    as can be designed (however the withdrawal queue is capped at 20.)

    Deposited funds are moved into the most impactful strategy that has not
    already reached its limit for assets under management, regardless of which
    Strategy a user's funds end up in, they receive their portion of yields
    generated across all Strategies.

    When a user withdraws, if there are no funds sitting undeployed in the
    Vault, the Vault withdraws funds from Strategies in the order of least
    impact. (Funds are taken from the Strategy that will disturb everyone's
    gains the least, then the next least, etc.) In order to achieve this, the
    withdrawal queue's order must be properly set and managed by the community
    (through governance).

    Vault Strategies are parameterized to pursue the highest risk-adjusted yield.

    There is an "Emergency Shutdown" mode. When the Vault is put into emergency
    shutdown, assets will be recalled from the Strategies as quickly as is
    practical (given on-chain conditions), minimizing loss. Deposits are
    halted, new Strategies may not be added, and each Strategy exits with the
    minimum possible damage to position, while opening up deposits to be
    withdrawn by users. There are no restrictions on withdrawals above what is
    expected under Normal Operation.

    For further details, please refer to the specification:
    https://github.com/iearn-finance/yearn-vaults/blob/main/SPECIFICATION.md
"""

API_VERSION: constant(String[28]) = "0.1.0"

from vyper.interfaces import ERC20


interface Strategy:
    def want() -> address: view
    def vault() -> address: view
    def isActive() -> bool: view
    def delegatedAssets() -> uint256: view
    def estimatedTotalAssets() -> uint256: view
    def withdraw(_amount: uint256) -> uint256: nonpayable
    def migrate(_newStrategy: address): nonpayable

interface ExtendedERC20:
    def decimals() -> uint256: view
    def mint(user: address, amount: uint256): nonpayable
    def burn(user: address, amount: uint256): nonpayable

token: public(ERC20)
governance: public(address)
management: public(address)
guardian: public(address)
pendingGovernance: address


# ================= Broxus bridge structures =================

struct TONEvent:
    eventTransactionLt: uint256
    eventTimestamp: uint256
    eventData: Bytes[10000]
    configurationWid: int128
    configurationAddress: uint256
    proxy: address
    round: uint256

struct TONAddress:
    wid: int128
    addr: uint256

struct PendingWithdrawalId:
    recipient: address
    id: uint256

# NOTE: Vault may have non-zero deposit / withdraw fee.
struct Fee:
    step: uint256 # The fee is charged only on amounts exceeding this value
    size: uint256 # Size in BPS

# ================= Broxus bridge structures =================


# ================= Broxus bridge events =================

# NOTE: this relay is monitored by the Broxus bridge relays.
# Allows to mint corresponding tokens in the FreeTON network
event Deposit:
    amount: uint256 # Amount of tokens to be minted
    wid: int128 # Recipient in TON, see note on `TONAddress`
    addr: uint256

event NewDeposit:
    sender: address
    recipientWid: int128
    recipientAddr: uint256
    amount: uint256
    pendingWithdrawalRecipient: address
    pendingWithdrawalId: uint256
    sendTransferToTon: bool

event InstantWithdrawal:
    recipient: address
    payloadId: bytes32
    amount: uint256

event UpdateBridge:
    bridge: address

event UpdateWrapper:
    wrapper: address

event UpdateConfiguration:
    wid: int128
    addr: uint256

event UpdateTargetDecimals:
    targetDecimals: uint256

event ForceWithdraw:
    recipient: address
    id: uint256

# NOTE: unlike the original Yearn Vault,
# fees are paid in corresponding token on the FreeTON side
# See note on `_assessFees`
event UpdateRewards:
    wid: int128
    addr: uint256

event UpdateStrategyRewards:
    strategy: address
    wid: int128
    addr: uint256

event UpdateDepositFee:
    step: uint256
    size: uint256

event UpdateWithdrawFee:
    step: uint256
    size: uint256

# ================= Broxus bridge events =================

event UpdateGovernance:
    governance: address # New active governance

event NewPendingGovernance:
    governance: address # New pending governance


event UpdateManagement:
    management: address # New active manager


event UpdateDepositLimit:
    depositLimit: uint256 # New active deposit limit

event UpdatePerformanceFee:
    performanceFee: uint256 # New active performance fee

event UpdateManagementFee:
    managementFee: uint256 # New active management fee


event UpdateGuardian:
    guardian: address # Address of the active guardian


event EmergencyShutdown:
    active: bool # New emergency shutdown state (if false, normal operation enabled)



# ================= Broxus bridge variables =================

# NOTE: Track already seen withdrawal receipts to prevent double-spending
withdrawIds: public(HashMap[bytes32, bool])

# NOTE: Wrapper contract, see VaultWrapper.sol
wrapper: public(address)

# NOTE: Broxus bridge contract address. Used for validating withdrawal signatures.
# See note on `saveWithdraw`
bridge: public(address)

# NOTE: withdraw receipts
configuration: public(TONAddress)

# NOTE: Gov rewards are sent on the FreeTON side
rewards: public(TONAddress)

# NOTE: Vault may have non-zero fee for deposit / withdraw
depositFee: public(Fee)
withdrawFee: public(Fee)

# ================= Broxus bridge variables =================

emergencyShutdown: public(bool)

depositLimit: public(uint256)  # Limit for totalAssets the Vault can hold
activation: public(uint256)  # block.timestamp of contract deployment

MAX_BPS: constant(uint256) = 10_000  # 100%, or 10k basis points

tokenDecimals: public(uint256)
targetDecimals: public(uint256)

@external
def initialize(
    token: address,
    governance: address,
    bridge: address,
    wrapper: address,
    guardian: address,
    management: address,
    targetDecimals: uint256,
):
    """
    @notice
        Initializes the Vault, this is called only once, when the contract is
        deployed.
        The performance fee is set to 10% of yield, per Strategy.
        The management fee is set to 2%, per year.
        The initial deposit limit is set to 0 (deposits disabled); it must be
        updated after initialization.
        The rewards TON address and corresponding Bridge Configuration also should be set after initialization.
    @dev
        The token used by the vault should not change balances outside transfers and
        it must transfer the exact amount requested. Fee on transfer and rebasing are not supported.
    @param token The token that may be deposited into this Vault.
    @param governance The address authorized for governance interactions.
    @param bridge The address of the Bridge contract
    @param wrapper Helper contract, need for parsing withdraw receipts
    @param guardian The address authorized for guardian interactions. Defaults to caller.
    @param management The address of the vault manager.
    @param targetDecimals Amount of decimals in the corresponding FreeTON token
    """
    assert self.activation == 0  # dev: no devops199

    self.token = ERC20(token)
    self.tokenDecimals = ExtendedERC20(token).decimals()
    self.targetDecimals = targetDecimals

    self.governance = governance
    log UpdateGovernance(governance)

    self.management = management
    log UpdateManagement(management)

    self.bridge = bridge
    log UpdateBridge(bridge)

    self.wrapper = wrapper
    log UpdateWrapper(wrapper)

    self.guardian = guardian
    log UpdateGuardian(guardian)

    log UpdatePerformanceFee(convert(0, uint256))
    log UpdateManagementFee(convert(0, uint256))

    self.activation = block.timestamp

    self.depositLimit = MAX_UINT256
    log UpdateDepositLimit(self.depositLimit)


@pure
@external
def apiVersion() -> String[28]:
    """
    @notice
        Used to track the deployed version of this contract. In practice you
        can use this version number to compare with Broxus's GitHub and
        determine which version of the source matches this deployed contract.
    @dev
        All strategies must have an `apiVersion()` that matches the Vault's
        `API_VERSION`.
    @return API_VERSION which holds the current version of this contract.
    """
    return API_VERSION

@external
def setTargetDecimals(targetDecimals: uint256):
    """
    @notice
        Set FreeTON token decimals
    @dev May differ from the `token` decimals
    @param targetDecimals FreeTON token decimals
    """

    assert msg.sender == self.governance

    self.targetDecimals = targetDecimals

@external
def setDepositFee(fee: Fee):
    """
    @notice
        Set new value. Deposit fee is charged on `deposit`,
        fee is charged on the Ethereum side.
    @dev Use (0,0) to set zero fee.
    @param fee New deposit fee value
    """
    assert msg.sender in [self.management, self.governance]

    self.depositFee = fee

    log UpdateDepositFee(fee.step, fee.size)

@external
def setWithdrawFee(fee: Fee):
    """
    @notice
        Set new value. Withdrawal fee is charged on `saveWithdraw`.
    @dev Use (0,0) to set zero fee.
    @param fee New withdraw fee value
    """
    assert msg.sender in [self.management, self.governance]

    self.withdrawFee = fee

    log UpdateWithdrawFee(fee.step, fee.size)

@external
def setWrapper(wrapper: address):
    """
    @notice
        Used to decode raw bytes with withdrawal TONEvent and withdrawal event data.
        See note on `saveWithdraw`.
    @param wrapper New wrapper contract
    """

    assert msg.sender == self.governance
    log UpdateWrapper(wrapper)
    self.wrapper = wrapper

@external
def setConfiguration(configuration: TONAddress):
    assert msg.sender == self.governance

    log UpdateConfiguration(configuration.wid, configuration.addr)

    self.configuration = configuration

# 2-phase commit for a change in governance
@external
def setGovernance(governance: address):
    """
    @notice
        Nominate a new address to use as governance.

        The change does not go into effect immediately. This function sets a
        pending change, and the governance address is not updated until
        the proposed governance address has accepted the responsibility.

        This may only be called by the current governance address.
    @param governance The address requested to take over Vault governance.
    """
    assert msg.sender == self.governance
    log NewPendingGovernance(msg.sender)
    self.pendingGovernance = governance


@external
def acceptGovernance():
    """
    @notice
        Once a new governance address has been proposed using setGovernance(),
        this function may be called by the proposed address to accept the
        responsibility of taking over governance for this contract.

        This may only be called by the proposed governance address.
    @dev
        setGovernance() should be called by the existing governance address,
        prior to calling this function.
    """
    assert msg.sender == self.pendingGovernance
    self.governance = msg.sender
    log UpdateGovernance(msg.sender)


@external
def setManagement(management: address):
    """
    @notice
        Changes the management address.
        Management is able to make some investment decisions adjusting parameters.

        This may only be called by governance.
    @param management The address to use for managing.
    """
    assert msg.sender == self.governance
    self.management = management
    log UpdateManagement(management)


@external
def setRewards(rewards: TONAddress):
    """
    @notice
        Rewards are distributed on the FreeTON side in corresponding token.

        This may only be called by governance.
    @param rewards The address to use for collecting rewards.
    """
    assert msg.sender == self.governance

    self.rewards = rewards

    log UpdateRewards(rewards.wid, rewards.addr)


@external
def setDepositLimit(limit: uint256):
    """
    @notice
        Changes the maximum amount of tokens that can be deposited in this Vault.

        Note, this is not how much may be deposited by a single depositor,
        but the maximum amount that may be deposited across all depositors.

        This may only be called by governance.
    @param limit The new deposit limit to use.
    """
    assert msg.sender == self.governance
    self.depositLimit = limit
    log UpdateDepositLimit(limit)


@external
def setGuardian(guardian: address):
    """
    @notice
        Used to change the address of `guardian`.

        This may only be called by governance or the existing guardian.
    @param guardian The new guardian address to use.
    """
    assert msg.sender in [self.guardian, self.governance]
    self.guardian = guardian
    log UpdateGuardian(guardian)


@external
def setEmergencyShutdown(active: bool):
    """
    @notice
        Activates or deactivates Vault mode where all Strategies go into full
        withdrawal.

        During Emergency Shutdown:
        1. No Users may deposit into the Vault (but may withdraw as usual.)
        2. Governance may not add new Strategies.
        3. Each Strategy must pay back their debt as quickly as reasonable to
            minimally affect their position.
        4. Only Governance may undo Emergency Shutdown.

        See contract level note for further details.

        This may only be called by governance or the guardian.
    @param active
        If true, the Vault goes into Emergency Shutdown. If false, the Vault
        goes back into Normal Operation.
    """
    if active:
        assert msg.sender in [self.guardian, self.governance]
    else:
        assert msg.sender == self.governance
    self.emergencyShutdown = active
    log EmergencyShutdown(active)

@internal
def erc20_safe_transfer(token: address, receiver: address, amount: uint256):
    # Used only to send tokens that are not the type managed by this Vault.
    # HACK: Used to handle non-compliant tokens like USDT
    response: Bytes[32] = raw_call(
        token,
        concat(
            method_id("transfer(address,uint256)"),
            convert(receiver, bytes32),
            convert(amount, bytes32),
        ),
        max_outsize=32,
    )
    if len(response) > 0:
        assert convert(response, bool), "Transfer failed!"

@view
@internal
def _totalAssets() -> uint256:
    return 0


@view
@external
def totalAssets() -> uint256:
    return self._totalAssets()

@view
@internal
def _convertToTargetDecimals(amount: uint256) -> uint256:
    if self.targetDecimals == self.tokenDecimals:
        return amount
    elif self.targetDecimals > self.tokenDecimals:
        return amount * 10 ** (self.targetDecimals - self.tokenDecimals)
    else:
        return amount / 10 ** (self.tokenDecimals - self.targetDecimals)


@view
@internal
def _convertFromTargetDecimals(amount: uint256) -> uint256:
    if self.targetDecimals == self.tokenDecimals:
        return amount
    elif self.targetDecimals > self.tokenDecimals:
        return amount / 10 ** (self.targetDecimals - self.tokenDecimals)
    else:
        return amount * 10 ** (self.tokenDecimals - self.targetDecimals)


@internal
def _transferToTon(
    _amount: uint256,
    recipient: TONAddress
):
    # Convert amount to the target decimals
    amount: uint256 = self._convertToTargetDecimals(_amount)

    log Deposit(
        amount,
        recipient.wid,
        recipient.addr,
    )

@internal
def _considerMovementFee(amount: uint256, fee: Fee) -> uint256:
    if fee.size == 0 or amount < fee.step:
        return amount

    feeAmount: uint256 = amount * fee.size / MAX_BPS

    self._transferToTon(feeAmount, self.rewards)

    return (amount - feeAmount)

@external
@nonreentrant("withdraw")
def deposit(
    sender: address,
    recipient: TONAddress,
    _amount: uint256,
    pendingWithdrawalId: PendingWithdrawalId,
    sendTransferToTon: bool
):
    """
    @notice
        Deposits `_amount` `token` which leads to issuing token to `recipient` in the FreeTON network.

        If the Vault is in Emergency Shutdown, deposits will not be accepted and this call will fail.
    @dev
        In opposite to the original Yearn vaults, this one doesn't issue shares.
        In this case the role of share token is played by the corresponding token on the FreeTON side.
        To receive locked tokens back, user should withdraw tokens from the FreeTON side.
        See note on `saveWithdraw`

        This may only be called by wrapper.

    @param sender Sender Ethereum address
    @param recipient
        The FreeTON recipient to transfer tokens to.
    @param _amount The quantity of tokens to deposit, defaults to all.
    @param pendingWithdrawalId Pending withdrawal id
    @param sendTransferToTon Boolean, emit transfer to TON or not
    """
    assert not self.emergencyShutdown  # Deposits are locked out

    assert msg.sender == self.wrapper

    # Ensure deposit limit is respected
    assert self._totalAssets() + _amount <= self.depositLimit, "Vault: respect the deposit limit"

    # Consider deposit fee
    amount: uint256 = self._considerMovementFee(_amount, self.depositFee)

    # Ensure we are depositing something
    assert amount > 0

    # Tokens are burned from the original sender
    ExtendedERC20(self.token.address).burn(sender, amount)

    # Fill pending withdrawal if specified
    fillingAmount: uint256 = 0
    fillingBounty: uint256 = 0

    if sendTransferToTon:
        self._transferToTon(amount + fillingBounty, recipient)

    log NewDeposit(
        sender,
        recipient.wid,
        recipient.addr,
        amount,
        pendingWithdrawalId.recipient,
        pendingWithdrawalId.id,
        sendTransferToTon
    )

@internal
def _registerWithdraw(
    id: bytes32
):
    # Withdraw id should not be seen before
    # Id calculated in `wrapper` as `keccack256(bytes memory withdraw_payload)`
    assert not self.withdrawIds[id], "Vault: withdraw already seen"

    self.withdrawIds[id] = True


@external
def saveWithdraw(
    payloadId: bytes32,
    recipient: address,
    _amount: uint256,
    bounty: uint256
):
    """
        @notice
            Unlike the original Yearn Vault, withdrawing from the Broxus Vault may be splitted in a separate steps.

            Withdraw payload event data contents the following details:

            - Withdraw initializer TON address
            - Withdraw amount
            - Withdraw recipient in the Ethereum
            - Chain id (it is necessary, since Broxus Bridge supports multiple EVM networks)

            If there're enough free tokens on the vault, withdraw will be executed immediately.
            If not - withdraw details will be saved into the Vault and user can execute it later in the following ways:

            - Set non zero bounty. Anyone can make a deposit into the Vault and specify user's pending withdrawal,
            so deposited tokens will fill the withdrawal.
            - Same withdraw mechanism as original Yearn.

        @dev
            Anyone can save withdraw request, but only withdraw recipient can specify bounty. Ignores otherwise.

        @param recipient Withdraw recipient
        @param _amount Withdraw amount
        @param bounty Bounty amount
    """
    assert msg.sender == self.wrapper

    assert not self.emergencyShutdown

    self._registerWithdraw(payloadId)

    amount: uint256 = self._convertFromTargetDecimals(_amount)
    amount = self._considerMovementFee(amount, self.withdrawFee)

    ExtendedERC20(self.token.address).mint(recipient, amount)

    log InstantWithdrawal(recipient, payloadId, amount)

@view
@external
def availableDepositLimit() -> uint256:
    if self.depositLimit > self._totalAssets():
        return self.depositLimit - self._totalAssets()
    else:
        return 0

@external
def sweep(token: address, amount: uint256 = MAX_UINT256):
    """
    @notice
        Removes tokens from this Vault that are not the type of token managed
        by this Vault. This may be used in case of accidentally sending the
        wrong kind of token to this Vault.

        Tokens will be sent to `governance`.

        This will fail if an attempt is made to sweep the tokens that this
        Vault manages.

        This may only be called by governance.
    @param token The token to transfer out of this vault.
    @param amount The quantity or tokenId to transfer out.
    """
    assert msg.sender == self.governance
    # Can't be used to steal what this Vault is protecting
    assert token != self.token.address
    value: uint256 = amount
    if value == MAX_UINT256:
        value = ERC20(token).balanceOf(self)
    self.erc20_safe_transfer(token, self.governance, value)
