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

    const title = "Will it populate all the data after casting a vote?"
    const description = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime mollitia, molestiae quas vel sint commodi repudiandae voluptatum laborum numquam "
    const proposalType = 0
    const proposalStatus = 0
    const startDate = await now()
    const duration = sDuration.hours(48)
    const options: Option[] =  [{
            index: 0,
            optionText:"Yes",
            vote: 0
        }, {
            index: 1,
            optionText:"No",
            vote: 0
        },
        {
            index: 2,
            optionText:"It might work",
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