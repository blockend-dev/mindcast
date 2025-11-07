import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@nomicfoundation/hardhat-verify'
import * as dotenv from 'dotenv'
import 'hardhat-deploy'
import '@typechain/hardhat'
dotenv.config()

const PRIVATE_KEY = process.env.PRIVATE_KEY!
const OG_TESTNET_RPC = process.env.OG_TESTNET_RPC!
const OG_MAINNET_RPC = process.env.OG_MAINNET_RPC!

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200
      },
       metadata: {
        bytecodeHash: "none", 
      },
    }
  },
  networks: {
    OG_testnet: {
      url: OG_TESTNET_RPC,
      chainId: 16602,
      accounts: [PRIVATE_KEY!],
      saveDeployments : true
    },
    OG_mainnet: {
      url: OG_MAINNET_RPC,
      chainId: 16661,
      accounts: [PRIVATE_KEY!],
      saveDeployments : true
    }
  },
 etherscan: {
    apiKey: {
      og_testnet: process.env.ETHERSCAN_API_KEY!, // Use a placeholder if you don't have one
      og_mainnet: process.env.ETHERSCAN_API_KEY!  // Use a placeholder if you don't have one
    },
    customChains: [
      {
        // Testnet
        network: "testnet",
        chainId: 16602,
        urls: {
          apiURL: "https://chainscan-galileo.0g.ai/open/api",
          browserURL: "https://chainscan-galileo.0g.ai",
        },
      },
      {
        // Mainnet
        network: "mainnet",
        chainId: 16661,
        urls: {
          apiURL: "https://chainscan.0g.ai/open/api",
          browserURL: "https://chainscan.0g.ai",
        },
      },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0,
      1: 0,
    },
  }

};

export default config;
