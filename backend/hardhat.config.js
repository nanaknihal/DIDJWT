require("@nomiclabs/hardhat-waffle");
require("hardhat-abi-exporter");
require('@openzeppelin/hardhat-upgrades');
require('dotenv').config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",

  abiExporter: {
  path: './data/abi',
  runOnCompile: true,
  clear: true,
  flat: true,
  only: [],
  spacing: 2,
  pretty: true,
},

  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      // forking: {
      //   url: "https://speedy-nodes-nyc.moralis.io/a1167200f0a0e81dd757304e/polygon/mumbai"
      // }
    },
    matic: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [process.env.PRIVATE_KEY],
      gas: 2100000,
      gasPrice: 2000000000
    },
    harmony: {
      url: "https://api.s0.b.hmny.io",
      accounts: [process.env.PRIVATE_KEY],
    },
    arbitrum: {
      url: "https://rinkeby.arbitrum.io/rpc",
      accounts: [process.env.PRIVATE_KEY],
      gas: 2100000,
      gasPrice: 2000000000
    },
    avalanche: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: [process.env.PRIVATE_KEY],
    },
    ethereum: {
      url: "https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      accounts: [process.env.PRIVATE_KEY],
      gas: 2100000,
      gasPrice: 2000000000
    },
    fantom: {
      url: "https://rpc.testnet.fantom.network",
      accounts: [process.env.PRIVATE_KEY],
    },
  }
};
