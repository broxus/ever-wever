import _ from 'underscore';
import {getAddress} from "../../test/utils";
import {Address, Contract, getRandomNonce, toNano} from "locklift";


const main = async () => {
    const users = 100_000;

    const root = await locklift.factory.getDeployedContract(
        'TokenRootUpgradeable',
        new Address('0:1795caddede4217bbfb332e387482ad24a32e86a6086e185b165f46e2823fd61')
    );

    const {
        state
    } = await root.getFullState();

    for (const user_id of _.range(41_500, users + 1)) {
        const user = getAddress(user_id);

        const {
            value0: wallet
        } = await root.methods.walletOf({
            walletOwner: user,
            answerId: 0
        }).call({
            cachedState: state
        });

        // console.log(wallet.toString());

        const Wallet = await locklift.factory.getDeployedContract('TokenWalletUpgradeable', wallet);
        await Wallet.methods.balance({answerId: 0})
            .call()
            .then(({ value0: balance }) => {
                console.log(user_id, wallet.toString(), balance);
            })
            .catch(e => {
                console.log(`FAILED at ${user_id}, expected wallet at ${wallet}`);
            });

    }
}


main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });

