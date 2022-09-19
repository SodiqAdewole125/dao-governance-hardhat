import {developmentChains} from "../../helper-hardhat-config"
import {network, deployments, ethers, getNamedAccounts} from "hardhat"
import { now, sDuration, toWei } from "../../utils/helper"
import { Dao, LAR } from "../../typechain-types/index.js";
import { ContractReceipt, ContractTransaction } from "ethers";


describe("Dao", function () {
    let dao: Dao;
    let lar: LAR;
    let deployer;
    beforeEach(async function (){
        deployer = (await getNamedAccounts()).deployer

        if (developmentChains.includes(network.name)){
            await deployments.fixture(["all"])
        }
        dao = await ethers.getContract("Dao");
        lar = await ethers.getContract("LAR")

     
    })

    it("", async function (){
        const title:string = "This is the title"
        const description:string = "This is the description"
        const proposalType:number = 0
        const proposalStatus:number = 1
        const startDate = now()
        const duration = sDuration.hours(4)

       const options =  [{
            index: 0,
            optionText:"This is option A",
            vote: 0
        }, {
            index: 1,
            optionText:"This is option B",
            vote: 0
        }]

        const approveTx = await lar.approve(dao.address, toWei(10))
        await approveTx.wait(1);

        const daoTx = await dao.createProposal(
            title,
            description,
           proposalType,
           proposalStatus,
          startDate,
            duration,
            options
        ) 

        const receipt: ContractReceipt = await daoTx.wait();
        const proposalCreated = receipt.events?.filter((x) => {return x.event == "ProposalCreated"});
        const proposalArgs  = proposalCreated[0].args;

        console.log(proposalArgs)
        // const proposalCreated = result.events[result.events.length - 1]
        // const args = proposalCreated.args;
        // console.log(args)
        // console.log(proposalCreated)


        const currentProposal = await dao.proposals(1);
        const currentProposalOptions =  await dao.getOptions(currentProposal[0])
        // console.log(currentProposalOptions)
        const currentProposalVoters=  await dao.getVoters(currentProposal[0])

    })
})