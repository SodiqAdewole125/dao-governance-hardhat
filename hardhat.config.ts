import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter"
import "dotenv/config"
import "hardhat-deploy"
import "solidity-coverage"

const TESTNET_URL = process.env.TESTNET_URL
const MNEMONIC = process.env.MNEMONIC

interface Network {
  url:string,
  chainId:number,
  blockConfirmations:number,
  accounts: {mnemonic: string}
}

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    localhost: {
      timeout: 100_000_000,
    },
  
    mumbai: {
      url: TESTNET_URL,
      chainId: 80001,
      blockConfirmations: 6,
      accounts: {mnemonic: MNEMONIC},
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    }
  },
};

export default config;
