<p align="center">
  <a href="https://github.com/venom-blockchain/developer-program">
    <img src="https://raw.githubusercontent.com/venom-blockchain/developer-program/main/vf-dev-program.png" alt="Logo" width="366.8" height="146.4">
  </a>
</p>

# Wrapped EVER

The Wrapped EVER project allows you to use the [Everscale](https://everscale.network/) native EVER token in a form of [TIP3](https://github.com/everscale-org/docs/blob/main/src/Standard/TIP-3/1.md) compatible token.

Wrapped EVER works pretty much the same as Wrapped Ether. Minting and burning happens on the Everscale network. Anyone can mint wEVERs by locking EVERs in the `Vault` contract. Also, wEVERs can be burned in order to receive EVERs.

# Architecture

1. Vault functionality implemented in the Root contract

## Mint WEVERs by sending EVERs to the Root

```mermaid
sequenceDiagram
    Sender->>Root: receive(N EVER)
    Note over Sender,Root: M = N - RECEIVE_SAFE_FEE (= 1 EVER)
    par
        Root ->> Recipient Token Wallet: deploy
        Note over Root, Recipient Token Wallet: WRAP_DEPLOY_WALLET_VALUE = 0.05 EVER
        Recipient Token Wallet ->> Remaining gas to: receive
    and
        Root ->> Recipient Token Wallet: acceptMint(M WEVER)
        Recipient Token Wallet ->> Recipient: onAcceptTokensTransfer
        Note right of Recipient: In previous version, `onAcceptTokensMint` <br/>callback was used
    end
```

## Release EVERs by transferring WEVERs to the Root

```mermaid
sequenceDiagram
    Sender ->> Sender Token Wallet: transfer(N WEVER)
    Sender Token Wallet ->> Root Token Wallet: acceptTransfer
    Root Token Wallet ->> Root: onAcceptTokensTransfer
    Root ->> Recipient: onAcceptTokensBurn
```

## Transfer more WEVERs by silently minting them

```mermaid
sequenceDiagram
    Sender ->> Sender Token Wallet: wrapAndTransfer(N EVER)
    Note right of Sender: Transfers all Sender's WEVER balance <br> plus N EVER. Sender must attach more<br>than N EVER to the message.
    par
        Sender Token Wallet ->> Root: acceptWrap(N EVER)
        Note right of Root: Root increases total supply <br> in asyncronous favour
    and
        Sender Token Wallet ->> Recipient Token Wallet: acceptTransfer(Sender's balance + N)
        Recipient Token Wallet ->> Recipient: onAcceptTokensTransfer
    end
```

## Burn WEVERs

```mermaid
sequenceDiagram
    Sender ->> Sender Token Wallet: burn(N WEVER)
    Sender Token Wallet ->> Root: acceptBurn()
    Root ->> Recipient: onAcceptTokensBurn
```
