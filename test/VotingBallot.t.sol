// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.34;
import {Test} from "forge-std/Test.sol";
import {Voting} from "../contracts/Voting.sol";

contract VotingBallotTest is Test {
    Voting private voting;
    address[] private voters;
    function setUp() public {
        voting = new Voting("Election");
        voting.addCandidate("A"); voting.addCandidate("B"); voting.addCandidate("C");
        for (uint256 i; i < 5; ++i) voters.push(address(uint160(i + 11)));
        voting.registerVoters(voters);
    }
    function cast(uint256 who, uint256 choice) private { vm.prank(voters[who]); voting.vote(choice); }
    function finish() private { vm.warp(voting.endTime()); }
    function test_VoteBeforeStart() public {
        vm.prank(voters[0]); vm.expectRevert(Voting.InvalidPhase.selector); voting.vote(0);
    }
    function test_VoteAndEvent() public {
        voting.startVoting(60);
        vm.expectEmit(true, true, false, true); emit Voting.VoteCast(voters[0], 1);
        cast(0, 1);
        assertTrue(voting.hasVoted(voters[0])); assertEq(voting.totalVotes(), 1);
        (, uint256 count) = voting.getCandidate(1); assertEq(count, 1);
    }
    function test_UnregisteredVoter() public {
        voting.startVoting(60);
        vm.prank(address(99)); vm.expectRevert(Voting.NotRegistered.selector); voting.vote(0);
        assertEq(voting.totalVotes(), 0);
    }
    function test_AdminHasNoAutomaticVote() public {
        voting.startVoting(60); vm.expectRevert(Voting.NotRegistered.selector); voting.vote(0);
    }
    function test_AdminCanVoteWhenRegistered() public {
        address[] memory adminVoter = new address[](1); adminVoter[0] = address(this);
        voting.registerVoters(adminVoter); voting.startVoting(60); voting.vote(0);
        assertEq(voting.totalVotes(), 1);
    }
    function test_SameCandidateDoubleVote() public {
        voting.startVoting(60); cast(0, 1);
        vm.prank(voters[0]); vm.expectRevert(Voting.AlreadyVoted.selector); voting.vote(1);
        assertEq(voting.totalVotes(), 1);
    }
    function test_ChangingCandidateIsRejected() public {
        voting.startVoting(60); cast(0, 0);
        vm.prank(voters[0]); vm.expectRevert(Voting.AlreadyVoted.selector); voting.vote(2);
        (, uint256 count) = voting.getCandidate(2); assertEq(count, 0);
    }
    function test_InvalidIdDoesNotConsumeVote() public {
        voting.startVoting(60);
        vm.prank(voters[0]); vm.expectRevert(Voting.InvalidCandidate.selector); voting.vote(type(uint256).max);
        assertFalse(voting.hasVoted(voters[0])); assertEq(voting.totalVotes(), 0); cast(0, 0);
    }
    function test_VoteAtStartTime() public {
        voting.startVoting(60); cast(0, 0); assertEq(voting.totalVotes(), 1);
    }
    function test_VoteOneSecondBeforeEnd() public {
        voting.startVoting(60); vm.warp(voting.endTime() - 1); cast(0, 0);
        assertEq(uint256(voting.phase()), 1);
    }
    function test_VoteAtExactEnd() public {
        voting.startVoting(60); finish();
        vm.prank(voters[0]); vm.expectRevert(Voting.InvalidPhase.selector); voting.vote(0);
        assertEq(uint256(voting.phase()), 2);
    }
    function test_VoteAfterEnd() public {
        voting.startVoting(60); vm.warp(voting.endTime() + 1);
        vm.prank(voters[0]); vm.expectRevert(Voting.InvalidPhase.selector); voting.vote(0);
    }
    function test_OutcomeBeforeStart() public {
        vm.expectRevert(Voting.ResultsNotFinal.selector); voting.getOutcome();
    }
    function test_OutcomeDuringVoting() public {
        voting.startVoting(60); cast(0, 0);
        vm.expectRevert(Voting.ResultsNotFinal.selector); voting.getOutcome();
    }
    function test_ProvisionalResults() public {
        (uint256[] memory initial, uint256 total) = voting.getResults();
        assertEq(initial.length, 3); assertEq(total, 0);
        voting.startVoting(60); cast(0, 2);
        (uint256[] memory counts, uint256 sum) = voting.getResults(); assertEq(counts[2], 1); assertEq(sum, 1);
    }
    function test_NoVotesIsNotATie() public {
        voting.startVoting(60); finish();
        (Voting.Outcome outcome, uint256[] memory ids, uint256 high) = voting.getOutcome();
        assertEq(uint256(outcome), 0); assertEq(ids.length, 0); assertEq(high, 0);
    }
    function test_UniqueWinnerIncludingLastCandidate() public {
        voting.startVoting(60); cast(0, 2); cast(1, 2); cast(2, 0); finish();
        (Voting.Outcome outcome, uint256[] memory ids, uint256 high) = voting.getOutcome();
        assertEq(uint256(outcome), 1); assertEq(ids.length, 1); assertEq(ids[0], 2); assertEq(high, 2);
    }
    function test_TwoWayTie() public {
        voting.startVoting(60); cast(0, 0); cast(1, 1); cast(2, 0); cast(3, 1); cast(4, 2); finish();
        (Voting.Outcome outcome, uint256[] memory ids, uint256 high) = voting.getOutcome();
        assertEq(uint256(outcome), 2); assertEq(ids.length, 2); assertEq(ids[0], 0); assertEq(ids[1], 1); assertEq(high, 2);
    }
    function test_ThreeWayTie() public {
        voting.startVoting(60); cast(0, 0); cast(1, 1); cast(2, 2); finish();
        (Voting.Outcome outcome, uint256[] memory ids, uint256 high) = voting.getOutcome();
        assertEq(uint256(outcome), 2); assertEq(ids.length, 3); assertEq(ids[2], 2); assertEq(high, 1);
    }
    function test_VotingDoesNotAcceptEther() public {
        voting.startVoting(60); vm.deal(voters[0], 1 ether); vm.prank(voters[0]);
        (bool ok,) = address(voting).call{value: 1}(abi.encodeCall(Voting.vote, (0)));
        assertFalse(ok); assertFalse(voting.hasVoted(voters[0])); assertEq(voting.totalVotes(), 0);
    }
    function testFuzz_ActionSequencePreservesCounts(uint256 seed) public {
        voting.startVoting(60);
        bool[5] memory used; uint256[3] memory expected; uint256 total;
        for (uint256 i; i < 40; ++i) {
            uint256 random = uint256(keccak256(abi.encode(seed, i)));
            uint256 who = random % 5; uint256 choice = (random / 5) % 4;
            vm.prank(voters[who]);
            (bool ok,) = address(voting).call(abi.encodeCall(Voting.vote, (choice)));
            bool valid = !used[who] && choice < 3;
            assertEq(ok, valid);
            if (valid) { used[who] = true; expected[choice]++; total++; }
            (uint256[] memory counts, uint256 actual) = voting.getResults();
            uint256 sum;
            for (uint256 j; j < 3; ++j) { assertEq(counts[j], expected[j]); sum += counts[j]; }
            assertEq(actual, total); assertEq(sum, actual); assertLe(actual, voting.registeredVoterCount());
        }
        finish();
        for (uint256 i; i < 5; ++i) {
            assertEq(voting.hasVoted(voters[i]), used[i]);
            vm.prank(voters[i]); vm.expectRevert(Voting.InvalidPhase.selector); voting.vote(0);
        }
        assertEq(voting.totalVotes(), total);
    }
}
