import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from 'dotenv'
import 'hardhat-deploy'
import '@typechain/hardhat'
dotenv.config()

const PRIVATE_KEY = process.env.PRIVATE_KEY!
const OG_TESTNET_RPC = process.env.OG_TESTNET_RPC!

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    OG_testnet: {
      url: OG_TESTNET_RPC,
      chainId: 16602,
      accounts: [PRIVATE_KEY!],
      saveDeployments : true
    }
  },

  namedAccounts: {
    deployer: {
      default: 0,
      1: 0,
    },
  }

};

export default config;
