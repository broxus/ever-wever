import fs from "fs";
import {Address} from "locklift";
import {splitToNChunks} from "../../test/utils";
const winston = require('winston');
import _ from 'underscore';
const cliProgress = require('cli-progress');
import cluster from "cluster"
import * as os from 'os';


const CHUNK_SIZE = 10;


const loadWalletVersions = async (wallets: Address[]) => {
    return Promise.all(wallets.map(async (wallet) => {
        const Wallet = await locklift.factory.getDeployedContract('VaultTokenWallet_V1', wallet);

        const version = await Wallet.methods.version({ answerId: 0 }).call().then(t => t.value0);

        return [
            wallet, version
        ];
    }));
}


enum WorkerToPrimaryMessage {
    Ready,
}

enum PrimaryToWorkerMessage {
    Chunk,
}


if (cluster.isMaster) {
    const logger = winston.createLogger({
        defaultMeta: { service: 'master' },
        transports: [
            // new winston.transports.Console(),
            new winston.transports.File({ filename: 'logs/master.log' , options: { flags: 'w' }})
        ]
    });

    const wallets = fs
        .readFileSync('./10_000.txt')
        .toString()
        .split('\n')
        .filter(a => a !== '')
        .map(a => new Address(a));

    const chunks = _.chunk(wallets, CHUNK_SIZE);

    logger.info(`Processing ${wallets.length} wallets in ${chunks.length} length`);

    let cpus = os.cpus();

    if (cpus.length > chunks.length) {
        cpus = cpus.slice(0, chunks.length);
    }

    logger.info(`Running ${cpus.length} parallel workers`);

    // create a new progress bar instance and use shades_classic theme
    const bar = new cliProgress.SingleBar({
        format: '[{bar}] {percentage}% | ETA: {eta}s | {value}/{total} ({duration} sec)'
    }, cliProgress.Presets.shades_classic);
    bar.start(wallets.length, 0);

    cpus.map((i, index) => {
        logger.info(`Spawning worker #${index}`);

        const worker = cluster.fork();

        worker.on('online', () => {
            logger.info(`Worker #${index} is online`);
        });

        worker.on('exit', (w) => {
            if (Object.values(cluster.workers).length === 0) {
                bar.stop();
                process.exit(0);
            }
        });

        worker.on('message', (msg) => {
            switch (msg.t) {
                case WorkerToPrimaryMessage.Ready:
                    const { delta } = msg;

                    bar.increment(delta);

                    logger.info(`Primary: Got Ready from worker #${index} (${bar.value} wallets done)`);

                    const chunk = chunks.pop();

                    if (chunk === undefined) {
                        worker.kill();
                    } else {
                        worker.send({ t: PrimaryToWorkerMessage.Chunk, chunk });
                    }

                    break;
                default:
                    logger.error(`Primary: Unknown message: ${msg}`);
            }
        });
    });

} else {
    const worker_id = cluster.worker.id;

    const logger = winston.createLogger({
        defaultMeta: { service: `worker_${worker_id}` },
        transports: [
            // new winston.transports.Console(),
            new winston.transports.File({ filename: `logs/worker_${worker_id}.log`, options: { flags: 'w' } })
        ]
    });

    logger.info(`Worker #${worker_id} started`);

    // @ts-ignore
    process.send({ t: WorkerToPrimaryMessage.Ready, delta: 0 });

    process.on('message', (msg) => {
        switch (msg.t) {
            case PrimaryToWorkerMessage.Chunk:
                const { chunk } = msg;
                logger.info(`Worker #${worker_id}: Got Chunk from primary`);

                loadWalletVersions(chunk)
                    .then(versions => {
                        const legacy_wallets = versions.filter(([, version]) => version === '1');

                        if (legacy_wallets.length === 0) {
                            logger.info(`All wallets upgraded successfully`);
                        } else {
                            logger.warn('Legacy wallets');
                            for (const [wallet, version] of legacy_wallets) {
                                logger.warn(wallet);
                            }
                        }

                        // @ts-ignore
                        process.send({ t: WorkerToPrimaryMessage.Ready, delta: chunk.length });
                    })
                    .catch(e => {
                        console.log(chunk);
                        console.log('error');
                        console.log(e);
                    });

                break
            default:
                logger.error(`Worker #${worker_id}: Unknown message: ${msg}`);
        }
    });
}

