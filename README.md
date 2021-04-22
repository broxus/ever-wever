# **Wrapped TON (WTON)**

The Wrapped TON project allows you to use the [FreeTON](http://freeton.org/) native Crystal token on Ethereum.

Wrapped TON works pretty much the same as Wrapped Ether. Minting and burning happens exclusively on the FreeTON network. Anyone can mint WTONs by locking TONs in a special Vault contract. Also anyone can burn WTONs and receive TONs. WTON is supported by the [FreeTON-Ethereum decentralized bridge](http://tonbridge.io/), which allows anyone to convert FreeTON WTONs into Ethereum WTONs at a 1:1 ratio and back.


## 
**How can I wrap my TONs into WTONs?**

It's simple! First of all, you should use the latest FreeTON Crystal wallet ([link](https://l1.broxus.com/freeton/wallet)). Make sure you have the latest version by clicking on the upper-right icon, then "Settings".



1. Open your Crystal wallet and click on the TON section
2. Send as many TONs as you want to the WTON Vault address - [0:136CC9FABCECFA251FAE61A0FA727E1B65FE68EDD2512BEB671582189367FAED](https://ton-explorer.com/accounts/0:136CC9FABCECFA251FAE61A0FA727E1B65FE68EDD2512BEB671582189367FAED).
3. In about a minute the WTON tokens will appear in your Crystal wallet in the quantity of `(amount - fee)`

### 
**Fee**


To wrap TONs into WTONs you have to send at least 1 TON. Otherwise, your TONs will be returned back to you. This 1 TON is used for paying network fees, like the minting tokens fee. Everything that remains unspent from the fee will automatically return to your wallet.


#### 
**Example**

As of 7 Apr 2021, by sending 10 TONs to the Vault, you receive



1. 9 WTON tokens
2. 0.84 TONs back (0.16 spent for fees)

## 
**How can I transfer WTONs from FreeTON to Ethereum?**

1. Open your Crystal wallet and click on the WTON token section
2. Click "Send" and specify the Ethereum address, to which you’d like to send ERC20 WTON tokens. Your Crystal wallet will automatically detect that the Ethereum address was used and create the cross-chain token transfer by using Bridge.
3. Claim the WTON tokens in Ethereum
    1. After a while, the "Execute" button will appear in your Crystal wallet
    2. Click on it - it will take you to the [https://tonbridge.io](https://tonbridge.io/) website. Follow the instructions to send the transaction and ERC20 WTON tokens will appear on your Ethereum address.

## 
**How can I transfer WTONs from Ethereum to FreeTON?**

1. Go to [https://tonbridge.io](https://tonbridge.io/)
2. Connect your Wallet
3. Choose the ETH-TON tab, specify the "Wrapped TON Crystal, WTON" token from the dropdown
4. Specify the amount of WTONs to send to FreeTON and click Next
5. Specify the FreeTON address you want to send WTONs to.
    1. Open Crystal Wallet
    2. Click on the TON section
    3. Click receive and copy address. It looks like `0:...`
    4. Paste your FreeTON address into the "Recipient TON address" input and click Next
6. Check the details and click "Transfer tokens". Confirm the Ethereum transaction.
7. Claim your WTONs in FreeTON
    5. After the Ethereum transaction is confirmed by Bridge relays, the "Execute" button will appear in your Crystal Wallet.
    6. Make sure you have a few TONs - you'll need to pay a fee to claim your FreeTON WTONs
    7. Click on the "Execute" and after a while WTONs will appear in your Crystal wallet

## 
**How can I unwrap my WTONs into TONs?**

1. Open your Crystal wallet and click on the WTON token section
2. Click "Send" and specify the amount of WTONs you want to convert into TONs.
3. As a recipient, specify the Vault address (`0:136cc9fabcecfa251fae61a0fa727e1b65fe68edd2512beb671582189367faed`)
4. Make sure you have some TONs to pay fees
5. Send transaction. After confirmation, your WTON balance will decrease and your TON balance will increase.

## 
**Artifacts**


### 
**Ethereum**

*   ERC20 WTON token ([0xdB3C2515Da400e11Bcaf84f3b5286f18ffF1868F](https://etherscan.io/token/0xdB3C2515Da400e11Bcaf84f3b5286f18ffF1868F))
*   TokenMint proxy ([0xdceeae4492732c04b5224841286bf7146aa299df](https://etherscan.io/address/0xdceeae4492732c04b5224841286bf7146aa299df))
*   [Uniswap WTON-USDT pool](https://info.uniswap.org/pair/0x5811ec00d774de2c72a51509257d50d1305358aa) ([0x5811Ec00d774dE2c72A51509257d50d1305358AA](https://etherscan.io/address/0x5811ec00d774de2c72a51509257d50d1305358aa))

### 
**FreeTON**

*   TIP3 WTON root ([0:eed3f331634d49a5da2b546f4652dd4889487a187c2ef9dd2203cff17b584e3d](https://ton-explorer.com/accounts/0:EED3F331634D49A5DA2B546F4652DD4889487A187C2EF9DD2203CFF17B584E3D))
*   WTON vault ([0:136cc9fabcecfa251fae61a0fa727e1b65fe68edd2512beb671582189367faed](https://ton-explorer.com/accounts/0:136CC9FABCECFA251FAE61A0FA727E1B65FE68EDD2512BEB671582189367FAED))

## 
**Links**

*   [Broxus team](https://broxus.com/)
*   [FreeTON Crystal Wallet](https://l1.broxus.com/freeton/wallet)
*   [Ethereum-FreeTON bridge](https://tonbridge.io/)
*   [Coinmarketcap - TON Crystal](https://coinmarketcap.com/currencies/ton-crystal/)
