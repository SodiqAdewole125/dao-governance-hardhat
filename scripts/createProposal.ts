import { ethers } from "hardhat";
import {toWei, fromWei, now, sDuration, fastForwardTheTime} from "../utils/helper"

interface Option {
    index:number,
    optionText:string,
    vote:number
}

async function createProposal() {
    const dao = await ethers.getContract("Dao")
    const lar = await ethers.getContract("LAR")

    const title = "Is moralis server working fine?"
    const description = "I hope moralis server is working fine because I've been having some issues"
    const proposalType = 0
    const proposalStatus = 0
    const startDate = await now()
    const duration = sDuration.hours(4)
    const options: Option[] =  [{
            index: 0,
            optionText:"Yes",
            vote: 0
        }, {
            index: 1,
            optionText:"No",
            vote: 0
        }
    ]

    const approveTx = await lar.approve(dao.address, toWei(200))
    await approveTx.wait(1);

    console.log("Creating a proposal.....")

    const createTx = await dao.createProposal(
        title,
        description,
        proposalType,
        proposalStatus,
        startDate,
        duration,
        options
    )
    await createTx.wait(1)

    console.log("Proposal created.....")
}



createProposal().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });