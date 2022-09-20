import {frontEndContractsFile, frontEndAbiFile } from "../helper-hardhat-config"
import fs from "fs"
import { network, ethers } from "hardhat"
import { DeployFunction } from "hardhat-deploy/types"
import { Dao } from "../typechain-types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const updateFrontend:DeployFunction = async (hre:HardhatRuntimeEnvironment) => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Writing to front end...")
        await updateContractAddresses()
        await updateAbi()
        console.log("Front end written!")
    }
}

async function updateAbi() {
    const dao:Dao = await ethers.getContract("Dao")
    fs.writeFileSync(frontEndAbiFile, dao.interface.format(ethers.utils.FormatTypes.json).toString())
}

async function updateContractAddresses() {
    const dao = await ethers.getContract("Dao")
    const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
    const chainId = network.config.chainId!.toString()
    if (chainId in contractAddresses) {
        if (!contractAddresses[chainId].includes(dao.address)) {
            contractAddresses[chainId].push(dao.address)
        }
    } else {
        contractAddresses[chainId] = [dao.address]
    }
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
}

export default updateFrontend
updateFrontend.tags = ["all", "frontend"]