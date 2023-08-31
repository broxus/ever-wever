async function main() {
    const vault_root = await locklift.factory.getContractArtifacts('VaultTokenRoot_V1');
    const vault_wallet = await locklift.factory.getContractArtifacts('VaultTokenWallet_V1');

    console.log('Vault root');
    console.log(vault_root.code);
    console.log('Vault wallet');
    console.log(vault_wallet.code);
}


main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });
