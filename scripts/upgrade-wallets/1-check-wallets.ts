import _ from 'underscore';
import {getAddress} from "../../test/utils";
import {Address, Contract, getRandomNonce, toNano} from "locklift";


const main = async () => {
    const users = 1000;

    const root = await locklift.factory.getDeployedContract(
        'TokenRootUpgradeable',
        new Address('0:0e789072e63c46cec521f9853a4f7bbb1ee9197005c8fa6d1e04a0b3ab7c2de4')
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

        // console.log(user_id, wallet.toString());
        // console.log(await Wallet.methods.balance({answerId: 0}).call());
    }
}


main()
    .then(() => process.exit(0))
    .catch(e => {
        console.log(e);
        process.exit(1);
    });

