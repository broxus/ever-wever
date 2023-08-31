import {UpgradeAssistant} from "../../test/upgrade-assistant";
import {Address, Contract, fromNano, getRandomNonce, toNano, zeroAddress} from "locklift";

const logger = require("mocha-logger");
const prompts = require("prompts");

import * as fs from 'fs';
import _ from 'underscore';

import { isValidEverAddress } from "locklift/utils";
import { WalletTypes } from "locklift";


function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


const main = async () => {
    const response = await prompts([
        {
            type: 'text',
            name: 'wallet_file',
            message: 'Path to file with wallets (one wallet address per line)',
            default: './10_000.txt'
        },
        {
            type: 'text',
            name: 'root',
            message: 'WEVER / WVENOM root address',
            validate: value => isValidEverAddress(value) ? true : 'Invalid address',
        },
        {
            type: 'text',
            name: 'owner',
            message: 'Owner address (copy from ext wallet and do the satoshi test)',
            validate: value => isValidEverAddress(value) ? true : 'Invalid address',
        },
        {
            type: 'number',
            name: 'offset',
            message: 'Offset (how many addresses to skip, used mostly in case of restart)',
            initial: 0,
        },
        {
            type: 'number',
            name: 'wallets_per_upgrade',
            message: 'How many wallets are upgraded per one upgrade',
            initial: '1000'             
        },
        {
            type: 'number',
            name: 'sleep_between_upgrades_seconds',
            message: 'How many seconds to sleep between upgrades',
            initial: '60'
        },
        {
            type: 'number',
            name: 'depoy_fabric_value',
            message: 'Deploy fabric value (in EVER)',
            initial: '10',
        },
        {
            type: 'number',
            name: 'deploy_batch_value',
            message: 'Deploy batch value (in EVER)',
            initial: '5',
        },
        {
            type: 'number',
            name: 'batches_per_upgrade',
            message: 'How many batches per upgrade to use? Each batch is a separate smart contract, holding even amount of accounts',
            initial: '20'
        }
    ]);


    const all_wallets = fs
        .readFileSync(response.wallet_file)
        .toString()
        .split('\n')
        .filter(a => a !== '')
        .map(a => new Address(a))
        .slice(response.offset);

    logger.log(`Uploading ${all_wallets.length} wallets`);

    const wallet_chunks = _.chunk(all_wallets, response.wallets_per_upgrade);

    const owner = await locklift.factory.accounts.addExistingAccount({
        type: WalletTypes.EverWallet,
        address: new Address(response.owner),
    });

    logger.log(`Doing satoshi test`);
    await locklift.provider.sendMessage({
        sender: owner.address,
        recipient: owner.address,
        amount: toNano('0.00000001'),
        bounce: false
    });

    const root = await locklift.factory.getDeployedContract('TokenRootUpgradeable', response.root);

    const root_owner = await root.methods.rootOwner({ answerId: 0 }).call();

    if (owner.address.toString() !== root_owner.value0.toString()) {
        logger.error(`Root owner is not ${response.owner}`);
       
        process.exit(1);
    } else {
        logger.log(`Root owner is correct, starting upgrade`);
    }

    for (const [chunk_id, wallets] of wallet_chunks.entries()) {
        const startTime = new Date().getTime();

        logger.log(`Processing chunk #${chunk_id+1} / ${wallet_chunks.length} (offset = ${response.offset + chunk_id * response.wallets_per_upgrade})`);

        const upgrade_assistant = new UpgradeAssistant(
            owner.address,
            new Address(response.root),
            wallets,
            response.batches_per_upgrade
        );
    
        logger.log('Setting up upgrade assistant...');
    
        await upgrade_assistant.setup({
            deployFabricValue: toNano(response.depoy_fabric_value + response.deploy_batch_value * response.batches_per_upgrade),
            deployBatchValue: toNano(response.deploy_batch_value),
        });
    
        logger.log(`Upgrade assistant: ${upgrade_assistant.fabric.address.toString()}`);
    
        logger.log(`Uploading wallets...`);
    
        await upgrade_assistant.uploadWallets();

        
        let max_wallets_per_batch = 0;
        for (const [batch_id, batch] of upgrade_assistant.batches.entries()) {
            logger.log(`Batch #${batch_id}: ${batch.address.toString()}`);

            const {
                wallets
            } = await batch.methods.wallets({}).call();
            max_wallets_per_batch = Math.max(max_wallets_per_batch, wallets.length);
        }
        logger.log(`Max wallets per batch: ${max_wallets_per_batch}`);

        logger.log(`Transferring root ownership to upgrade assistant...`);
        await locklift.tracing.trace(
            root.methods.transferOwnership({
                newOwner: upgrade_assistant.fabric.address,
                remainingGasTo: owner.address,
                callbacks: []
            }).send({
                from: owner.address,
                amount: toNano('1')
            })
        );


        // Trigger upgrade
        logger.log(`Triggering upgrade...`);
        const tx = await upgrade_assistant.fabric.methods.upgrade({}).send({
            from: owner.address,
            amount: toNano(max_wallets_per_batch * upgrade_assistant.batches_amount * 1), // 1 VENOM per account upgrade
        });

        // Wait until fabric is done
        // TODO: or tracing?
        logger.log(`Waiting for all batches to finish...`);
        while (true) {
            const done = await upgrade_assistant.isDone();

            if (done) {
                logger.log(`All batches are done`);
                break;
            } else {
                logger.log(`Not all batches are done, sleeping for 10 seconds...`);
                await delay(10_000);
            }
        }

        // Revoke ownership
        logger.log(`Revoke ownership...`);
        await locklift.tracing.trace(
            upgrade_assistant.fabric.methods.revokeOwnership({}).send({
                from: owner.address,
                amount: toNano('1')
            })
        );

        const endTime = new Date().getTime();
        logger.log(`Time taken ${(endTime - startTime)/1000} seconds`);

        // Sleep
        logger.log(`Sleeping for ${response.sleep_between_upgrades_seconds} seconds...`);
        await delay(response.sleep_between_upgrades_seconds * 1000);
    }
}


main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });

