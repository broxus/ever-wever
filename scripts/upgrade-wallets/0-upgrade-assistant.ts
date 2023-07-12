import {UpgradeAssistant} from "../../test/upgrade-assistant";
import {Address, Contract, fromNano, getRandomNonce, toNano, zeroAddress} from "locklift";
const logger = require("mocha-logger");
import * as fs from 'fs';


const main = async () => {
    const wallets = fs
        .readFileSync('./10_000.txt')
        .toString()
        .split('\n')
        .filter(a => a !== '')
        .map(a => new Address(a));

    logger.log(`Uploading ${wallets.length} wallets`);

    const upgrade_assistant = new UpgradeAssistant(
        new Address('0:cfcf66505259c0221924bb3ab3759e9e5d9d532f66eb851efd4d0f135237a020'),
        new Address('0:fb733789f40a93478dece03f1d543c9127fa998af04461e18a9318c0d3fd2ecc'),
        wallets,
        500
    );

    logger.log('Setting up upgrade assistant...');

    await upgrade_assistant.setup();

    logger.log(`Upgrade assistant: ${upgrade_assistant.fabric.address.toString()}`);

    logger.log(`Uploading wallets...`);

    await upgrade_assistant.uploadWallets();

    for (const [batch_id, batch] of upgrade_assistant.batches.entries()) {
        logger.log(`Batch #${batch_id}: ${batch.address.toString()}`);

        const wallets_ = await batch.methods.wallets({}).call().then(t => t.wallets.length);
        logger.log(`Batch holds ${wallets_} wallets`);
    }
}


main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });

