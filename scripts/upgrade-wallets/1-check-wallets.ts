const main = async () => {
    // const UpgradeAssistantBatch = await locklift.factory.getContractArtifacts('UpgradeAssistantBatch');
}


main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });

