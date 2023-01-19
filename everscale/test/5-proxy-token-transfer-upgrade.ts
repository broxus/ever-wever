import { setupWever } from "./utils";
import { expect } from "chai";
import { Contract, toNano } from "locklift";
import { ProxyTokenTransferAbi, ProxyTokenTransferMockupUpgradeAbi } from "../build/factorySource";

describe("Test upgrading proxy token transfer", async function () {
  //@ts-ignore
  let context: Omit<ReturnType<typeof setupWever> extends Promise<infer F> ? F : never, "proxyTokenTransfer"> & {
    proxyTokenTransfer: Contract<ProxyTokenTransferAbi> | Contract<ProxyTokenTransferMockupUpgradeAbi>;
  } = {};

  let oldDetails: ReturnType<
    ReturnType<Contract<ProxyTokenTransferAbi>["methods"]["getDetails"]>["call"]
  > extends Promise<infer f>
    ? f
    : never;
  it("Setup contracts", async () => {
    context = await setupWever();
  });

  it("Save proxy details before upgrade", async () => {
    const { proxyTokenTransfer } = context;
    const apiVersion = await proxyTokenTransfer.methods
      .apiVersion()
      .call()
      .then(res => res.API_VERSION);
    expect(apiVersion).to.be.equal("0.1.0", "Wrong api version");

    oldDetails = await proxyTokenTransfer.methods.getDetails({ answerId: 0 }).call();
  });

  it("Upgrade", async () => {
    const { user, proxyTokenTransfer } = context;

    // await user.runTarget({
    //   contract: proxyTokenTransfer,
    //   method: "upgrade",
    //   params: {
    //     code: ProxyTokenTransferMockupUpgrade.code,
    //     send_gas_to: user.address,
    //   },
    // });
    const { code: proxyTokenTransferMockupUpgradeCode } = locklift.factory.getContractArtifacts(
      "ProxyTokenTransferMockupUpgrade",
    );
    await (proxyTokenTransfer as Contract<ProxyTokenTransferAbi>).methods
      .upgrade({
        code: proxyTokenTransferMockupUpgradeCode,
        send_gas_to: user.address,
      })
      .send({
        from: user.address,
        amount: toNano(2),
      });

    context.proxyTokenTransfer = locklift.factory.getDeployedContract(
      "ProxyTokenTransferMockupUpgrade",
      context.proxyTokenTransfer.address,
    );
  });

  it("Check proxy details after upgrade", async () => {
    const { proxyTokenTransfer } = context;
    const apiVersion = await proxyTokenTransfer.methods
      .apiVersion()
      .call()
      .then(res => res.API_VERSION);
    expect(apiVersion).to.be.equal("0.2.0", "Wrong api version");

    const details = await proxyTokenTransfer.methods.getDetails({ answerId: 0 }).call();

    expect(details._config.tonConfiguration.toString()).to.be.equal(
      oldDetails._config.tonConfiguration.toString(),
      "Wrong ton configuration",
    );
    expect(details._config.ethereumConfigurations.map(el => el.toString())).to.deep.equal(
      oldDetails._config.ethereumConfigurations.map(el => el.toString()),
      "Wrong ethereum configurations",
    );
    expect(details._config.root.toString()).to.be.equal(oldDetails._config.root.toString(), "Wrong token root");
    expect(details._config.settingsDeployWalletGrams).to.be.equal(
      oldDetails._config.settingsDeployWalletGrams,
      "Wrong settings deploy wallet grams",
    );
    expect(details._config.settingsTransferGrams).to.be.equal(
      oldDetails._config.settingsTransferGrams,
      "Wrong settings transfer grams",
    );

    expect(details._owner.toString()).to.be.equal(oldDetails._owner.toString(), "Wrong owner");
    expect(details._received_count).to.be.equal(oldDetails._received_count, "Wrong received count");
    expect(details._transferred_count).to.be.equal(oldDetails._transferred_count, "Wrong transferred count");
    expect(details._token_wallet.toString()).to.be.equal(oldDetails._token_wallet.toString(), "Wrong token wallet");
  });
});
