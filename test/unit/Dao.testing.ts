import {developmentChains} from "../../helper-hardhat-config"
import {network, deployments, ethers, getNamedAccounts, getUnnamedAccounts} from "hardhat"
import { now, sDuration, toWei, fromWei, fastForwardTheTime } from "../../utils/helper"
import { Dao, LAR } from "../../typechain-types/index.js";
import { ContractReceipt, ContractTransaction, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";

interface Option {
    index:number,
    optionText:string,
    vote:number
}

describe("Dao", function () {
    let dao: Dao;
    let lar: LAR;
    let deployer;
    let deployerSigner:Signer;
    let user1:SignerWithAddress, user2:SignerWithAddress, user3:SignerWithAddress, user4:SignerWithAddress
    let title:string, description:string,  proposalStatus:number, startDate:number, duration:number, options:Option[]
    
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

        title = "This is the title"
        description = "This is the description"
        proposalStatus = 1
        startDate = await now()
        duration = sDuration.hours(4)

       options =  [{
            index: 0,
            optionText:"This is option A",
            vote: 0
        }, {
            index: 1,
            optionText:"This is option B",
            vote: 0
        },
        {
            index: 2,
            optionText:"This is option C",
            vote: 0
        }
    ]

        // const currentProposal = await dao.proposals(1);
        // const currentProposalOptions =  await dao.getOptions(currentProposal[0])
        // const currentProposalVoters=  await dao.getVoters(currentProposal[0])
     
    })

    it("should vote by single choice", async function (){

        const approveTx1 = await lar.approve(dao.address, toWei(10))
        await approveTx1.wait(1);

        const daoTx = await dao.createProposal(
            title,
            description,
           0,
           proposalStatus,
          startDate,
            duration,
            options
        ) 

        const receipt: ContractReceipt = await daoTx.wait();

        const proposalCreated = receipt.events?.filter((x) => {return x.event == "ProposalCreated"});
        const proposalArgs  = proposalCreated?.[0].args;

        const approveTx2:ContractTransaction = await lar.approve(dao.address, toWei(40))
        await approveTx2.wait(1)

        const voteTx1:ContractTransaction =  await dao.voteProposalBySingleChoice(1, 0, toWei(20))
        const receipt1:ContractReceipt = await voteTx1.wait(1)

        const currentProposal = await dao.proposals(1);

        await expect(dao.voteProposalBySingleChoice(1, 0, toWei(20))).to.be.revertedWith("You've voted already")
       

        await lar.connect(deployerSigner).transfer(user1.address, toWei(100));

        await lar.connect(user1).approve(dao.address, toWei(100))

        const voteTx2:ContractTransaction =  await dao.connect(user1).voteProposalBySingleChoice(1, 0, toWei(20))
        const receipt2:ContractReceipt = await voteTx2.wait(1)

        const [optionA, optionB] =  await dao.getOptions(currentProposal[0])
        const currentProposalVoters=  await dao.getVoters(currentProposal[0])

        const optionATotalVote:string = fromWei(optionA[2])
        const optionBTotalVote:string = fromWei(optionB[2])

        assert.equal(optionATotalVote, "40.0")
        assert.equal(optionBTotalVote, "0.0")
        assert.equal(currentProposalVoters.length, 2)

        await fastForwardTheTime(sDuration.hours(5))

        await expect(dao.voteProposalBySingleChoice(1, 0, toWei(20))).to.be.revertedWith("Proposal has closed")

    })

    it("should vote by quadratic", async function(){

        const approveTx1 = await lar.approve(dao.address, toWei(10))
        await approveTx1.wait(1);

        const daoTx = await dao.createProposal(
            title,
            description,
           2,
           proposalStatus,
          startDate,
            duration,
            options
        ) 

        const receipt1: ContractReceipt = await daoTx.wait();

        const indexes:number[] = [0, 2]
        const votingPower:string[] = [toWei(20), toWei(50)]


        const approveTx = await lar.approve(dao.address, toWei(70))
        await approveTx.wait(1)
        
        const voteTx1 = await dao.voteProposalByQuadratic(
            1,
            indexes,
            votingPower
        )
        const receipt = await voteTx1.wait(1)

        const [proposalId] = await dao.proposals(1);

        const [optionA, optionB, optionC] =  await dao.getOptions(proposalId)
        const currentProposalVoters=  await dao.getVoters(proposalId)

        const optionATotalVote:string = fromWei(optionA[2])
        const optionBTotalVote:string = fromWei(optionB[2])
        const optionCTotalVote:string = fromWei(optionC[2])

        assert(Number(optionATotalVote) > 4 && (optionATotalVote as unknown as number ) < 5 )
        assert(Number(optionCTotalVote) > 7 && Number(optionCTotalVote) < 8)
        assert.equal(optionBTotalVote, "0.0")

        assert.equal(currentProposalVoters.length, 1)
    })

    it("should vote by weighing", async function(){

        const approveTx = await lar.approve(dao.address, toWei(500))
        await approveTx.wait(1);

        const daoTx = await dao.createProposal(
            title,
            description,
           1,
           proposalStatus,
          startDate,
            duration,
            options
        ) 

        const receipt1: ContractReceipt = await daoTx.wait();

        const indexes:number[] = [0, 1]
        const votingPower:string[] = [toWei(40), toWei(50)]

        const transferTx1 = await lar.transfer(user1.address, toWei(500))
        await transferTx1.wait(1)

        const transferTx2 = await lar.transfer(user2.address, toWei(500))
        await transferTx2.wait(1)
        
        const approveTx1 = await lar.connect(user1).approve(dao.address, toWei(500))
        await approveTx1.wait(1)
        
        const approveTx2 = await lar.connect(user2).approve(dao.address, toWei(500))
        await approveTx2.wait(1)
        
        // Deployer votes 
        const voteTx1 = await dao.voteProposalByWeighing(
            1,
            indexes,
            votingPower
        )
        await voteTx1.wait(1)

        // User 1 votes
        const voteTx2 = await dao.connect(user1).voteProposalByWeighing(
            1,
            indexes,
            votingPower
        )
        await voteTx2.wait(1)

        // user 2 votes
        const voteTx3 = await dao.connect(user2).voteProposalByWeighing(
            1,
            indexes,
            votingPower
        )
        await voteTx3.wait(1)


        const [proposalId] = await dao.proposals(1);

        const [optionA, optionB, optionC] =  await dao.getOptions(proposalId)
        const currentProposalVoters=  await dao.getVoters(proposalId)

        const optionATotalVote:string = fromWei(optionA[2])
        const optionBTotalVote:string = fromWei(optionB[2])
        const optionCTotalVote:string = fromWei(optionC[2])


        assert.equal(optionATotalVote, "120.0")
        assert.equal(optionBTotalVote, "150.0")
        assert.equal(optionCTotalVote, "0.0")

        assert.equal(currentProposalVoters.length, 3)

   
    })



})