import {Address, Contract, getRandomNonce, toNano} from "locklift";
import _ from 'underscore';
import {ed25519_generateKeyPair, Ed25519KeyPair} from "nekoton-wasm";
import {UpgradeAssistantBatchAbi, UpgradeAssistantFabricAbi} from "../build/factorySource";
import {splitToNChunks} from "./utils";
const logger = require("mocha-logger");
const cliProgress = require('cli-progress');


export class UpgradeAssistant {
    // @ts-ignore
    worker_key: Ed25519KeyPair;
    wallets: Address[];
    owner: Address;
    root: Address;
    batches_amount: number;
    chunk_size: number;

    // @ts-ignore
    fabric: Contract<UpgradeAssistantFabricAbi>;
    // @ts-ignore
    batches: Contract<UpgradeAssistantBatchAbi>[];

    bar: any;


    constructor(
        owner: Address,
        root: Address,
        wallets: Address[],
        batches_amount: number
    ) {
        this.owner = owner;
        this.root = root;
        this.wallets = [...wallets];
        this.batches_amount = batches_amount;

        this.chunk_size = 100;
        this.bar = new cliProgress.SingleBar({
            format: '[{bar}] {percentage}% | ETA: {eta}s | {value}/{total} ({duration} sec)'
        }, cliProgress.Presets.shades_classic);
    }

    async _setupWorkerKeys() {
        this.worker_key = ed25519_generateKeyPair();
        await locklift.keystore.addKeyPair(this.worker_key);
    }

    async _deployFabric() {
        const signer = await locklift.keystore.getSigner("0");

        const UpgradeAssistantBatch = await locklift.factory.getContractArtifacts('UpgradeAssistantBatch');

        const {
            contract: fabric
        } = await locklift.tracing.trace(
            locklift.factory.deployContract({
                contract: 'UpgradeAssistantFabric',
                initParams: {
                    _randomNonce: getRandomNonce()
                },
                constructorParams: {
                    owner_: this.owner,
                    worker_: `0x${this.worker_key.publicKey}`,
                    root_: this.root,
                    upgrade_assistant_batch_code_: UpgradeAssistantBatch.code,
                    batches_: this.batches_amount
                },
                publicKey: signer?.publicKey,
                value: toNano(this.batches_amount + 5) // TODO: depends on batches amount
            })
        );

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
            const tx = await locklift.tracing.trace(
                batch.methods.addWallets({
                    wallets_: chunk
                }).sendExternal({
                    publicKey: this.worker_key.publicKey
                })
            ).catch(e => {
                console.log(e);
                console.log(chunk);

                process.exit(1);
            });

            this.bar.increment(chunk.length);
        }
    }

    async setup() {
        await this._setupWorkerKeys();
        await this._deployFabric();
        await this._setupBatches();
    }

    async checkWallets() {

    }
}
