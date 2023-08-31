import _ from 'underscore';
import {getAddress} from "../../test/utils";
import {Address, Contract, getRandomNonce, toNano} from "locklift";


const main = async () => {
    const users = 30_000;

    const root = await locklift.factory.getDeployedContract(
        'TokenRootUpgradeable',
        new Address('0:ef9454582730631bf7c6cd2e47baefdba84437f96a0dfaa4ab312f989c879063')
    );

    const {
        state
    } = await root.getFullState();

    for (const user_id of _.range(1, users + 1)) {
        const user = getAddress(user_id);

        const {
            value0: wallet
        } = await root.methods.walletOf({
            walletOwner: user,
            answerId: 0
        }).call({
            cachedState: state
        });

        console.log(wallet.toString());

        // const Wallet = await locklift.factory.getDeployedContract('TokenWalletUpgradeable', wallet);
        // await Wallet.methods.balance({answerId: 0})
        //     .call()
        //     .then(({ value0: balance }) => {
        //         console.log(user_id, wallet.toString(), balance);
        //     })
        //     .catch(e => {
        //         console.log(`FAILED at ${user_id}, expected wallet at ${wallet}`);
        //     });

    }
}


main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });

