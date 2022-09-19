// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/*
createQuadraticProposal()
createApprovalProposal()
createSingleChoiceProposal()
voteByQuadratic()
voteBySingleChoice()
voteByApproval()

 */
contract Dao is ReentrancyGuard {
    IERC20 larToken;
    uint256 proposalId;

    enum ProposalType {
        SingleChoice,
        Approval,
        Quadratic
    }

    enum ProposalStatus {
        Pending,
        Active,
        Closed
    }

    struct Option {
        uint index;
        string optionText;
    }

    struct Proposal {
        uint256 id;
        address creator;
        string title;
        string description;
        ProposalType proposalType;
        ProposalStatus proposalStatus;
        uint startDate;
        uint duration;
        Option[] options;
        
    }

    mapping(uint256 => Proposal) public proposals;

    constructor(address larTokenAddress) {
        larToken = IERC20(larTokenAddress);
    }

    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _proposalType,
        uint256 _proposalStatus,
        uint _startDate,
        uint _duration,
        Option[] memory _options
    ) external nonReentrant {
        require(
            larToken.balanceOf(msg.sender) >= 5e18,
            "Minimum of 5 LAR is needed to create a proposal"
        );

        larToken.transferFrom(msg.sender, address(this), 5e18);

        ProposalType proposalType;
        if (_proposalType == 0) {
            proposalType = ProposalType.SingleChoice;
        } else if (_proposalType == 1) {
            proposalType = ProposalType.Approval;
        } else if (_proposalType == 2) {
            proposalType = ProposalType.Quadratic;
        }

        ProposalStatus proposalStatus;
        if (_proposalStatus == 0) {
            proposalStatus = ProposalStatus.Pending;
        } else if (_proposalStatus == 1) {
            proposalStatus = ProposalStatus.Active;
        } else if (_proposalStatus == 2) {
            proposalStatus = ProposalStatus.Closed;
        }

        proposalId++;

        Proposal memory proposal = Proposal({
            id: proposalId,
            creator: msg.sender,
            title: _title,
            description: _description,
            proposalType: proposalType,
            proposalStatus: proposalStatus,
            startDate: _startDate,
            duration: _duration,
            options: _options
        });

        proposals[proposalId] = proposal;

        emit ProposalCreated()
    }
}
