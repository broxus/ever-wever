const logger = require('mocha-logger');

async function main() {
  const LoudSpeaker = await locklift.factory.getContract('LoudSpeaker');
  // const loudSpeaker = await locklift.giver.deployContract({
  //   contract: LoudSpeaker,
  //   constructorParams: {
  //     _owner: '0:3c33153078ea2b94144ad058812563f4896cadbb84e7cc55c08e24e0a394fb3e'
  //   },
  //   initParams: {
  //     _randomNonce: locklift.utils.getRandomNonce(),
  //   },
  // }, locklift.utils.convertCrystal(10, 'nano'));

  // logger.success(`Loudspeaker: ${loudSpeaker.address}`);

  const message = await this.locklift.ton.client.abi.encode_message_body({
    address: '0:00a66660d86ce4b029b6d0a3639035bb4bad4844690c8dcbf82529c30266d506',
    abi: {
      type: "Contract",
      value: LoudSpeaker.abi,
    },
    call_set: {
      function_name: 'echo',
      input: {
        text: "Rename accepted"
      },
    },
    signer: {
      type: 'None',
    },
    is_internal: true,
  });

  console.log(message.body);
}


main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
