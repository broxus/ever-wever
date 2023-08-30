import { WalletTypes, toNano } from "locklift";


const main = async () => {
    const signer = await locklift.keystore.getSigner("0");

    const account = await locklift.factory.accounts.addNewAccount({
        type: WalletTypes.WalletV3,
        publicKey: signer?.publicKey,
        value: toNano(10)
    });

    console.log(`Account (add it to the wallet extension and do the satoshi test!)`);
    console.log(account.account.address.toString());
}


main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });