import { getTokenWalletAddress, setupWever } from "./utils";
import { expect } from "chai";
import { toNano, zeroAddress } from "locklift";

describe("Setup contracts", async function () {
  // @ts-ignore
  let context: ReturnType<typeof setupWever> extends Promise<infer F> ? F : never = {};

  it("Setup contracts", async function () {
    await locklift.deployments.fixture();

    context = await setupWever();
  });

  describe("Wrapped EVER token", async function () {
    it("Check wEVER root", async function () {
      const name = await context.vault.methods
        .name({ answerId: 0 })
        .call()
        .then(res => res.value0);

      expect(name).to.be.equal("Wrapped EVER", "Wrong root name");

      expect(Number(await locklift.provider.getBalance(context.vault.address)))
          .to.be.above(0, "Vault balance empty");
    });
  });

  describe("User", async function () {
    it("Check user account", async function () {
      const userBalance = await locklift.provider.getBalance(context.alice.address);

      expect(Number(userBalance)).to.be.above(0, "Bad user balance");
    });

    it("Check user token wallet balance", async function () {
      const userTokenBalance = await context.aliceTokenWallet.methods
        .balance({ answerId: 0 })
        .call()
        .then(res => res.value0);

      expect(Number(userTokenBalance))
          .to.be.equal(0, "Initial user token balance non zero");
    });
  });

  describe("Vault", async function () {
    it("Check vault token wallet", async function () {
      const vaultTokenWalletAddressExpected = await getTokenWalletAddress(context.vault, context.vault.address);

      expect(vaultTokenWalletAddressExpected.toString()).to.be.equal(
        context.vaultTokenWallet.address.toString(),
        "Wrong vault token wallet",
      );
    });
  });
});
