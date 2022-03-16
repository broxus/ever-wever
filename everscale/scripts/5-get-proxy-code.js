async function main() {
    const ProxyTokenTransfer = await locklift.factory.getContract('ProxyTokenTransfer');

    console.log(ProxyTokenTransfer.code);
}


main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });
