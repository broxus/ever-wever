import { setupWever } from "./utils";
import { expect } from "chai";
import { toNano } from "locklift";
const EMPTY_TVM_CELL = "te6ccgEBAQEAAgAAAA==";

describe("Bridge integration", async function () {
  // @ts-ignore
  let context: ReturnType<typeof setupWever> extends Promise<infer F> ? F : never = {};

  it("Setup contracts", async function () {
    context = await setupWever();
  });

  it("Mint wEVERs", async function () {
    const { userTokenWallet, user, vault } = context;

    await vault.methods
      .wrap({
        tokens: toNano(4),
        owner_address: user.address,
        gas_back_address: user.address,
        payload: EMPTY_TVM_CELL,
      })
      .send({
        from: user.address,
        amount: toNano(10),
      });
    const balance = await userTokenWallet.methods
      .balance({ answerId: 0 })
      .call()
      .then(res => res.value0);
    expect(balance).to.be.equal(toNano(4), "Wrong user token wallet balance");
  });

  describe("EVER-EVM transfer", async () => {
    const transferPayload = "te6ccgEBAQEAGgAAMAAAAAAAAAAAAAAAAAAAAAAAAAB7AAABWQ=="; // (123,345)

    it("Transfer tokens to the event proxy", async () => {
      const { userTokenWallet, user, proxyTokenTransfer } = context;

      await userTokenWallet.methods
        .transfer({
          amount: toNano(2.5),
          recipient: proxyTokenTransfer.address,
          deployWalletValue: 200000000,
          remainingGasTo: user.address,
          notify: true,
          payload: transferPayload,
        })
        .send({
          from: user.address,
          amount: toNano(4),
        });
    });

    it("Check proxy EVER balance", async () => {
      const { proxyTokenTransfer } = context;

      expect(Number(await locklift.provider.getBalance(proxyTokenTransfer.address))).to.be.greaterThan(
        0,
        "Proxy EVER balance is zero",
      );
    });

    it("Check user token balance", async () => {
      const { userTokenWallet } = context;

      expect(
        await userTokenWallet.methods
          .balance({ answerId: 0 })
          .call()
          .then(res => res.value0),
      ).to.be.equal(toNano(1.5), "Wrong user token balance");
    });

    it("Check proxy token balance", async () => {
      const { proxyTokenWallet } = context;

      expect(
        await proxyTokenWallet.methods
          .balance({ answerId: 0 })
          .call()
          .then(res => res.value0),
      ).to.be.equal(toNano(2.5), "Wrong proxy token balance");
    });

    it("Check proxy counters", async () => {
      const { proxyTokenTransfer } = context;

      const details = await proxyTokenTransfer.methods.getDetails({ answerId: 0 }).call();

      expect(details._received_count).to.be.equal(toNano(2.5), "Wrong received count");

      expect(details._transferred_count).to.be.equal("0", "Wrong transferred count");
    });
  });

  describe("EVM-EVER transfer", async () => {
    it("Send confirmation from the fake evm configuration", async () => {
      const { user, proxyTokenTransfer } = context;

      const payload = await proxyTokenTransfer.methods
        .encodeEthereumEventData({
          tokens: toNano(1.5),
          wid: 0,
          owner_addr: "0x" + user.address.toString().split(":")[1],
        })
        .call()
        .then(res => res.data);

      await proxyTokenTransfer.methods
        .onEventConfirmed({
          eventData: {
            configuration: user.address,
            staking: user.address,
            chainId: 123,
            voteData: {
              eventTransaction: 0,
              eventIndex: 0,
              eventData: payload,
              eventBlockNumber: 0,
              eventBlock: 0,
            },
          },
          gasBackAddress: user.address,
        })
        .send({
          from: user.address,
          amount: toNano(5),
        });
    });

    it("Check proxy EVER balance", async () => {
      const { proxyTokenTransfer } = context;

      expect(Number(await locklift.provider.getBalance(proxyTokenTransfer.address))).to.be.greaterThan(
        0,
        "Proxy EVER balance is zero",
      );
    });

    it("Check user token balance", async () => {
      const { userTokenWallet } = context;

      expect(
        await userTokenWallet.methods
          .balance({ answerId: 0 })
          .call()
          .then(res => res.value0),
      ).to.be.equal(toNano(3), "Wrong user token balance");
    });

    it("Check proxy token balance", async () => {
      const { proxyTokenWallet } = context;

      expect(
        await proxyTokenWallet.methods
          .balance({ answerId: 0 })
          .call()
          .then(res => res.value0),
      ).to.be.equal(toNano(1), "Wrong proxy token balance");
    });

    it("Check proxy counters", async () => {
      const { proxyTokenTransfer } = context;

      const details = await proxyTokenTransfer.methods.getDetails({ answerId: 0 }).call();

      expect(details._received_count).to.be.equal(toNano(2.5), "Wrong received count");

      expect(details._transferred_count).to.be.equal(toNano(1.5), "Wrong transferred count");
    });
  });
});
