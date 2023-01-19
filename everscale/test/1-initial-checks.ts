import { getTokenWalletAddress, setupWever } from "./utils";
import { expect } from "chai";
import { toNano, zeroAddress } from "locklift";

describe("Setup contracts", async function () {
  // @ts-ignore
  let context: ReturnType<typeof setupWever> extends Promise<infer F> ? F : never = {};

  it("Setup contracts", async function () {
    context = await setupWever();
  });

  describe("Wrapped EVER token", async function () {
    it("Check wEVER root", async function () {
      const name = await context.root.methods
        .name({ answerId: 0 })
        .call()
        .then(res => res.value0);

      expect(name).to.be.equal("Wrapped EVER", "Wrong root name");

      expect(Number(await locklift.provider.getBalance(context.root.address))).to.be.above(0, "Root balance empty");
    });

    it("Check root owned by tunnel", async function () {
      const rootOwner = await context.root.methods
        .rootOwner({ answerId: 0 })
        .call()
        .then(res => res.value0);

      expect(rootOwner.toString()).to.be.equal(context.tunnel.address.toString(), "Root owner should be tunnel");
    });
  });

  describe("User", async function () {
    it("Check user account", async function () {
      const userBalance = await locklift.provider.getBalance(context.user.address);

      expect(Number(userBalance)).to.be.above(0, "Bad user balance");
    });

    it("Check user token wallet balance", async function () {
      const userTokenBalance = await context.userTokenWallet.methods
        .balance({ answerId: 0 })
        .call()
        .then(res => res.value0);

      expect(Number(userTokenBalance)).to.be.equal(0, "Initial user token balance non zero");
    });
  });

  describe("Vault", async function () {
    it("Check vault root", async function () {
      const { root: vaultRoot } = await context.vault.methods
        .configuration()
        .call()
        .then(res => res.configuration);

      expect(vaultRoot.toString()).to.equal(context.root.address.toString(), "Wrong root address");
    });

    it("Check vault token wallet", async function () {
      const vaultTokenWalletAddressExpected = await getTokenWalletAddress(context.root, context.vault.address);

      expect(vaultTokenWalletAddressExpected.toString()).to.be.equal(
        context.vaultTokenWallet.address.toString(),
        "Wrong vault token wallet",
      );
    });
  });

  describe("Proxy token transfer", async () => {
    it("Check proxy token wallet deployed", async () => {
      expect(context.proxyTokenWallet.address.toString()).to.not.be.equal(
        zeroAddress.toString(),
        "Proxy token wallet not deployed",
      );
    });

    it("Check proxy token wallet owner", async () => {
      const owner = await context.proxyTokenWallet.methods
        .owner({ answerId: 0 })
        .call()
        .then(res => res.value0);

      expect(owner.toString()).to.be.equal(context.proxyTokenTransfer.address.toString(), "Wrong owner address");
    });

    it("Check proxy details", async () => {
      const details = await context.proxyTokenTransfer.methods.getDetails({ answerId: 0 }).call();

      expect(details._config.tonConfiguration.toString()).to.be.equal(
        context.user.address.toString(),
        "Wrong ton configuration",
      );

      expect(details._config.ethereumConfigurations).to.have.lengthOf(1, "Wrong amount of ethereum configurations");

      expect(details._config.ethereumConfigurations[0].toString()).to.be.equal(
        context.user.address.toString(),
        "Wrong ethereum configuration",
      );

      expect(details._config.settingsDeployWalletGrams).to.be.equal(toNano(0.5), "Wrong settings deploy grams");

      expect(details._config.settingsTransferGrams).to.be.equal(
        toNano(0.5),

        "Wrong settings transfer grams",
      );

      expect(details._owner.toString()).to.be.equal(context.user.address.toString(), "Wrong proxy owner");

      expect(details._received_count).to.be.equal("0", "Wrong received count");

      expect(details._transferred_count).to.be.equal("0", "Wrong transferred count");
    });
  });

  describe("Tunnel", async function () {
    it("Check tunnel sources", async function () {
      const { sources, destinations } = await context.tunnel.methods.__getTunnels().call();

      expect(sources).to.have.lengthOf(1, "Wrong amount of tunnel sources");
      expect(destinations).to.have.lengthOf(1, "Wrong amount of tunnel destinations");

      expect(sources[0].toString()).to.be.equal(context.vault.address.toString(), "Tunnel source differs from vault");
      expect(destinations[0].toString()).to.be.equal(
        context.root.address.toString(),
        "Tunnel destination differs from root",
      );
    });
  });
});
