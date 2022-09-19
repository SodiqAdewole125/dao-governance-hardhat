import {developmentChains} from "../../helper-hardhat-config"
import {network, deployments, ethers, getNamedAccounts, getUnnamedAccounts} from "hardhat"
import { now, sDuration, toWei } from "../../utils/helper"
import { Dao, LAR } from "../../typechain-types/index.js";
import { ContractReceipt, ContractTransaction, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


describe("Dao", function () {
    let dao: Dao;
    let lar: LAR;
    let deployer;
    let deployerSigner:Signer;
    let user1:SignerWithAddress, user2:SignerWithAddress, user3:SignerWithAddress, user4:SignerWithAddress
    
    beforeEach(async function (){
        deployer = (await getNamedAccounts()).deployer
        const users = await getUnnamedAccounts();
        deployerSigner = await ethers.getSigner(deployer)
        user1 = await ethers.getSigner(users[0]);
        user2= await ethers.getSigner(users[1]);
        user3 = await ethers.getSigner(users[2]);
        user4 = await ethers.getSigner(users[3]);

        if (developmentChains.includes(network.name)){
            await deployments.fixture(["all"])
        }
        dao = await ethers.getContract("Dao");
        lar = await ethers.getContract("LAR")

        const title:string = "This is the title"
        const description:string = "This is the description"
        const proposalType:number = 0
        const proposalStatus:number = 1
        const startDate:number = await now()
        const duration:number = sDuration.hours(4)

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
        const proposalArgs  = proposalCreated?.[0].args;

        // const currentProposal = await dao.proposals(1);
        // const currentProposalOptions =  await dao.getOptions(currentProposal[0])
        // const currentProposalVoters=  await dao.getVoters(currentProposal[0])
     
    })

    it("should vote by single choice", async function (){

        const approveTx:ContractTransaction = await lar.approve(dao.address, toWei(40))
        await approveTx.wait(1)

        const voteTx1:ContractTransaction =  await dao.voteProposalBySingleChoice(1, 0, toWei(20))
        const receipt1:ContractReceipt = await voteTx1.wait(1)

        const currentProposal = await dao.proposals(1);
        const currentProposalOptions =  await dao.getOptions(currentProposal[0])
        const currentProposalVoters=  await dao.getVoters(currentProposal[0])

        await lar.connect(deployerSigner).transfer(user1.address, toWei(100));

        await lar.connect(user1).approve(dao.address, toWei(100))

        const voteTx2:ContractTransaction =  await dao.connect(user1).voteProposalBySingleChoice(1, 0, toWei(20))
        const receipt2:ContractReceipt = await voteTx2.wait(1)

    })
})