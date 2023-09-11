import {Address, Contract, getRandomNonce, toNano} from "locklift";
import _ from 'underscore';
import {ed25519_generateKeyPair, Ed25519KeyPair} from "nekoton-wasm";
import {UpgradeAssistantBatchAbi, UpgradeAssistantFabricAbi} from "../build/factorySource";
import {splitToNChunks} from "./utils";
const logger = require("mocha-logger");
const cliProgress = require('cli-progress');


class Executor {
    private isCancelled: boolean = false;
    private method: () => Promise<void>;
    private timeout: number;

    constructor(
        method: () => Promise<void>,
        timeout: number
    ) {
        this.method = method;
        this.timeout = timeout;
    }

    async run(): Promise<void> {
        try {
            await this.runWithTimeout();
        } catch (error) {
            if (error === 'Timeout') {
                console.log('Method timed out. Retrying...');
                await this.run();
            } else {
                console.error('An error occurred:', error);
            }
        }
    }

    private runWithTimeout(): Promise<void> {
        this.isCancelled = false;

        return new Promise(async (resolve, reject) => {
            const timer = setTimeout(() => {
                this.isCancelled = true;
                reject('Timeout');
            }, this.timeout);

            try {
                await this.executeMethod();

                if (!this.isCancelled) {
                    clearTimeout(timer);
                    resolve();
                }
            } catch (error) {
                if (!this.isCancelled) {
                    clearTimeout(timer);
                    reject(error);
                }
            }
        });
    }

    private async executeMethod(): Promise<void> {
        if (this.isCancelled) return;
        
        // Your actual method content goes here. For example:
        // await someLongRunningTask();
        await this.method();
    }
}
  
  

export class UpgradeAssistant {
    // @ts-ignore
    worker_key: Ed25519KeyPair;
    wallets: Address[];
    owner: Address;
    tunnel: Address;
    batches_amount: number;
    chunk_size: number;
    external_timeout: number;

    // @ts-ignore
    fabric: Contract<UpgradeAssistantFabricAbi>;
    // @ts-ignore
    batches: Contract<UpgradeAssistantBatchAbi>[];

    bar: any;


    constructor(
        owner: Address,
        tunnel: Address,
        wallets: Address[],
        batches_amount: number
    ) {
        this.owner = owner;
        this.tunnel = tunnel;
        this.wallets = [...wallets];
        this.batches_amount = batches_amount;

        this.chunk_size = 50;
        this.external_timeout = 80000; // 60 seconds
        this.bar = new cliProgress.SingleBar({
            format: '[{bar}] {percentage}% | ETA: {eta}s | {value}/{total} ({duration} sec)'
        }, cliProgress.Presets.shades_classic);
    }

    async isDone() {
        const {
            done
        } = await this.fabric.methods.isDone({}).call();

        return done;
    }

    async _setupWorkerKeys() {
        this.worker_key = ed25519_generateKeyPair();
        await locklift.keystore.addKeyPair(this.worker_key);
    }

    private async _deployFabric(deployFabricValue: string, deployBatchValue: string) {
        const signer = await locklift.keystore.getSigner("0");

        const UpgradeAssistantBatch = await locklift.factory.getContractArtifacts('UpgradeAssistantBatch');

        const {
            contract: fabric
        } = await locklift.factory.deployContract({
            contract: 'UpgradeAssistantFabric',
            initParams: {
                _randomNonce: getRandomNonce()
            },
            constructorParams: {
                owner_: this.owner,
                worker_: `0x${this.worker_key.publicKey}`,
                tunnel_: this.tunnel,
                upgrade_assistant_batch_code_: UpgradeAssistantBatch.code,
                batches_: this.batches_amount,
                deploy_batch_value_: deployBatchValue
            },
            publicKey: signer?.publicKey,
            value: deployFabricValue // TODO: depends on batches amount
        });

        this.fabric = fabric;
    }

    async _setupBatches() {
        this.batches = await Promise.all(_.range(this.batches_amount).map(async (batch_id: number) => {
            const batch = await this.fabric.methods.deriveBatch({
                batch_id
            }).call();

            return locklift.factory.getDeployedContract('UpgradeAssistantBatch', batch.value0);
        }));
    }

    async uploadWallets() {
        logger.log(`Uploading ${this.wallets.length} wallets to ${this.batches_amount} batches`);

        const chunks = splitToNChunks([...this.wallets], this.batches_amount);

        this.bar.start(this.wallets.length, 0);

        await Promise.all(chunks.map(async (chunk, i) => this._uploadWalletsChunk(chunk, this.batches[i])));

        this.bar.stop();
    }

    async _uploadWalletsChunk(
        wallets: Address[],
        batch: Contract<UpgradeAssistantBatchAbi>
    ) {
        const chunks = _.chunk(wallets, this.chunk_size);

        for (const chunk of chunks) {
            const addWallets = async () => {
                await batch.methods.addWallets({
                    wallets_: chunk
                }).sendExternal({
                    publicKey: this.worker_key.publicKey
                });
            }

            const executor = new Executor(addWallets, this.external_timeout);
            await executor.run();

            this.bar.increment(chunk.length);
        }
    }

    async setup({
        deployFabricValue,
        deployBatchValue
    } : {
        deployFabricValue: string,
        deployBatchValue: string
    }) {
        await this._setupWorkerKeys();
        await this._deployFabric(deployFabricValue, deployBatchValue);
        await this._setupBatches();
    }

    async checkWallets() {
        
    }
}
