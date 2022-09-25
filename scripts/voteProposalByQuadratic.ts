import { Signer } from "ethers";
import { ethers, getUnnamedAccounts } from "hardhat";
import {toWei, fromWei, now, sDuration, fastForwardTheTime} from "../utils/helper"

interface Option {
    index:number,
    optionText:string,
    vote:number
}

async function voteProposalByQuadratic() {
    const dao = await ethers.getContract("Dao")
    const lar = await ethers.getContract("LAR")

    const users = await getUnnamedAccounts()
    const user1:Signer = await ethers.getSigner(users[0])

    console.log(users[0])

    // const transferTx = await lar.transfer(users[0], toWei(500))
    // await transferTx.wait(1)
    /*
    voteProposalByQuadratic(
        uint256 id,
        uint256[] memory indexes,
        uint256[] memory votingPower
    )
    */

    const approveTx = await lar.connect(user1).approve(dao.address, toWei(200))
    await approveTx.wait(1);

    const proposalId = 4
    const indexes:number[] = []
    const votingPower:number[] = []
    

    console.log("Voting a proposal.....")

    const voteTx = await dao.connect(user1).voteProposalByQuadratic(
        proposalId,
        indexes,
        votingPower
    )
    await voteTx.wait(1)

    console.log("Voted Successfully.....")
}



voteProposalByQuadratic().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });