import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
// import verify from "../utils/verify"
import { networkConfig, developmentChains } from "../helper-hardhat-config"
import { ethers } from "hardhat"
import {verify} from "../utils/verify"

const deployDao: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  // @ts-ignore
  const { getNamedAccounts, deployments, network } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId: number = network.config.chainId!


  const lar = await ethers.getContract("LAR");

  log("----------------------------------------------------")
  log("Deploying Dao and waiting for confirmations...")
  const dao = await deploy("Dao", {
    from: deployer,
    args: [lar.address],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: networkConfig[network.name].blockConfirmations || 0,
  })
  log(`Dao deployed at ${dao.address}`)
  if (
    !developmentChains.includes(network.name) &&
    process.env.POLYGON_API_KEY
  ) {
    await verify(dao.address, [lar.address])
  }
}
export default deployDao
deployDao.tags = ["all", "dao"]