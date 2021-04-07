const hre = require("hardhat");


const meta = {
  requiredConfirmations: 2,
  multisig: '0xFaD2C3B926A2751aa27b4B24AcBAc3B13EED9771',
  bridge: '0xAA5f2fc251b1387F8b828eD66d4508215B1b6ee7',
};


async function main() {
  const accounts = await ethers.getSigners();

  console.log(accounts.map(a => a.address));

  const ProxyTokenMint = await hre.ethers.getContractFactory('ProxyTokenMint');
  
  const proxyTokenLock = await hre.upgrades.deployProxy(
    ProxyTokenMint,
    [
      [
        '0x0000000000000000000000000000000000000000',
        meta.bridge,
        true,
        meta.requiredConfirmations,
        [0, 1000]
      ],
      meta.multisig
    ],
  );
  
  await
  
  console.log(`Proxy token lock: ${proxyTokenLock.address}`);
  
  const admin = await hre.upgrades.admin.getInstance();
  console.log(`Proxy admin: ${admin.address}`);
}


main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
