// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/*
createQuadraticProposal()
createWeightedProposal()
createSingleChoiceProposal()
voteByQuadratic()
voteBySingleChoice()
voteByWeighted()

 */
contract Dao is ReentrancyGuard {
    IERC20 larToken;
    uint256 proposalId;

    enum ProposalType {
        SingleChoice,
        Weighted,
        Quadratic
    }

    enum ProposalStatus {
        Pending,
        Active,
        Closed
    }

    struct Option {
        uint256 index;
        string optionText;
        uint256 vote;
    }

    struct Proposal {
        uint256 id;
        address creator;
        string title;
        string description;
        ProposalType proposalType;
        ProposalStatus proposalStatus;
        uint256 startDate;
        uint256 duration;
        Option[] options;
        address[] voters;
    }

    event ProposalCreated(
        uint256 id,
        address creator,
        string title,
        string description,
        ProposalType proposalType,
        ProposalStatus proposalStatus,
        uint256 startDate,
        uint256 duration,
        Option[] options
    );

    event QuadraticVote(uint256 id, address voter, Option[] options);

    mapping(uint256 => Proposal) public proposals;

    constructor(address larTokenAddress) {
        larToken = IERC20(larTokenAddress);
    }

    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _proposalType,
        uint256 _proposalStatus,
        uint256 _startDate,
        uint256 _duration,
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
            proposalType = ProposalType.Weighted;
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

        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.creator = msg.sender;
        proposal.title = _title;
        proposal.description = _description;
        proposal.proposalType = proposalType;
        proposal.proposalStatus = proposalStatus;
        proposal.startDate = _startDate;
        proposal.duration = _duration;

        // Proposal memory proposal = Proposal({
        //     id: proposalId,
        //     creator: msg.sender,
        //     title: _title,
        //     description: _description,
        //     proposalType: proposalType,
        //     proposalStatus: proposalStatus,
        //     startDate: _startDate,
        //     duration: _duration,
        //     options:  ,
        //     voters: new address[](0)
        // });
        // Proposal memory proposal = Proposal( proposalId,  msg.sender,  _title,  _description,  proposalType,  proposalStatus,  _startDate,  _duration);

        // proposals[proposalId] = proposal;

        for (uint256 i = 0; i < _options.length; i++) {
            Option memory currentOption = _options[i];
            proposal.options.push(currentOption);
        }

        emit ProposalCreated(
            proposalId,
            msg.sender,
            _title,
            _description,
            proposalType,
            proposalStatus,
            _startDate,
            _duration,
            _options
        );
    }

    function voteProposalByQuadratic(
        uint256 id,
        uint256[] memory indexes,
        uint256[] memory votingPower
    ) external nonReentrant {
        uint256 totalVotingPower = getQuadraticTotalVotingPower(votingPower);
        int256 hasVoted = checkVotingStatus(id, msg.sender);
        Proposal memory proposal = proposals[id];

        require(
            block.timestamp < proposal.startDate + proposal.duration,
            "Proposal has closed"
        );
        require(hasVoted < 0, "You've voted already");
        require(
            larToken.balanceOf(msg.sender) >= totalVotingPower,
            "Insufficient Voting Power"
        );
        larToken.transferFrom(msg.sender, address(this), totalVotingPower);

        Option[] storage options = proposals[id].options;

        for (uint256 i = 0; i < indexes.length; i++) {
            uint256 currentOptionIndex = indexes[i];
            uint256 currentOptionVotingPower = indexes[i];
            options[currentOptionIndex].vote += sqrt(currentOptionVotingPower);
        }

        proposals[id].voters.push(msg.sender);

        emit QuadraticVote(id, msg.sender, options);
    }

    function voteProposalBySingleChoice(
        uint256 id,
        uint256 index,
        uint256 votingPower
    ) external nonReentrant {
        int256 hasVoted = checkVotingStatus(id, msg.sender);
        Proposal memory proposal = proposals[id];

        require(
            block.timestamp < proposal.startDate + proposal.duration,
            "Proposal has closed"
        );
        require(hasVoted < 0, "You've voted already");
        require(
            larToken.balanceOf(msg.sender) >= votingPower,
            "Insufficient voting Power"
        );

        larToken.transferFrom(msg.sender, address(this), votingPower);

        proposals[id].options[index].vote += votingPower;
    }

    function voteByWeighing(
        uint256 id,
        uint256[] memory indexes,
        uint256[] memory votingPower
    ) external nonReentrant {
        uint256 totalVotingPower = getWeightedTotalVotingPower(votingPower);
        int256 hasVoted = checkVotingStatus(id, msg.sender);
        Proposal memory proposal = proposals[id];

        require(
            block.timestamp < proposal.startDate + proposal.duration,
            "Proposal has closed"
        );
        require(hasVoted < 0, "You've voted already");
        require(
            larToken.balanceOf(msg.sender) >= totalVotingPower,
            "Insufficient Voting Power"
        );
        larToken.transferFrom(msg.sender, address(this), totalVotingPower);

        Option[] storage options = proposals[id].options;

        for (uint256 i = 0; i < indexes.length; i++) {
            uint256 currentOptionIndex = indexes[i];
            uint256 currentOptionVotingPower = indexes[i];
            options[currentOptionIndex].vote += currentOptionVotingPower;
        }

        proposals[id].voters.push(msg.sender);

        emit QuadraticVote(id, msg.sender, options);
    }

    function getQuadraticTotalVotingPower(uint256[] memory votingPower)
        internal
        returns (uint256 totalVotingPower)
    {
        for (uint256 i = 0; i < votingPower.length; i++) {
            totalVotingPower += votingPower[i];
        }
    }

    function getWeightedTotalVotingPower(uint256[] memory votingPower)
        internal
        returns (uint256 totalVotingPower)
    {
        for (uint256 i = 0; i < votingPower.length; i++) {
            totalVotingPower += votingPower[i];
        }
    }

    function checkVotingStatus(uint256 id, address voter)
        internal
        view
        returns (int256)
    {
        address[] memory voters = proposals[id].voters;
        for (uint256 i = 0; i < voters.length; i++) {
            address currentVoter = voters[i];
            if (voter == currentVoter) {
                return int256(i);
            }
        }
        return -1;
    }

    function sqrt(uint256 y) public pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
