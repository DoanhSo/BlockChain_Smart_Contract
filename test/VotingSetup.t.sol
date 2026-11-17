// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.34;

import {Test} from "forge-std/Test.sol";
import {Voting} from "../contracts/Voting.sol";

contract VotingSetupTest is Test {
    Voting private voting;
    address private alice = address(11);

    function setUp() public { voting = new Voting("Election"); }
    function one(address who) private pure returns (address[] memory a) {
        a = new address[](1); a[0] = who;
    }
    function ready() private {
        voting.addCandidate("A"); voting.addCandidate("B");
        voting.registerVoters(one(alice));
    }
    function test_InitialState() public view {
        assertEq(uint256(voting.phase()), 0);
        assertFalse(voting.started()); assertEq(voting.startTime(), 0);
        assertEq(voting.endTime(), 0); assertEq(voting.candidateCount(), 0);
        assertEq(voting.registeredVoterCount(), 0); assertEq(voting.totalVotes(), 0);
    }
    function test_AddCandidateAndEvent() public {
        vm.expectEmit(true, false, false, true);
        emit Voting.CandidateAdded(0, "A"); voting.addCandidate("A");
        (string memory name, uint256 votes) = voting.getCandidate(0);
        assertEq(name, "A"); assertEq(votes, 0); assertEq(voting.candidateCount(), 1);
    }
    function test_OnlyAdminAddsCandidates() public {
        vm.prank(alice); vm.expectRevert(Voting.Unauthorized.selector); voting.addCandidate("A");
    }
    function test_EmptyCandidateName() public {
        vm.expectRevert(Voting.InvalidCandidateName.selector); voting.addCandidate("");
    }
    function test_CandidateNameByteBoundary() public {
        voting.addCandidate(string(new bytes(96)));
        vm.expectRevert(Voting.InvalidCandidateName.selector); voting.addCandidate(string(new bytes(97)));
    }
    function test_DuplicateCandidate() public {
        voting.addCandidate("A"); vm.expectRevert(Voting.DuplicateCandidate.selector); voting.addCandidate("A");
        assertEq(voting.candidateCount(), 1);
    }
    function test_CandidateLimit() public {
        for (uint256 i; i < 20; ++i) voting.addCandidate(vm.toString(i));
        vm.expectRevert(Voting.CandidateLimitReached.selector); voting.addCandidate("21");
    }
    function test_InvalidCandidateGetter() public {
        vm.expectRevert(Voting.InvalidCandidate.selector); voting.getCandidate(0);
    }
    function test_RegisterVoterAndEvent() public {
        vm.expectEmit(true, false, false, true); emit Voting.VoterRegistered(alice);
        voting.registerVoters(one(alice));
        assertTrue(voting.isRegistered(alice)); assertFalse(voting.hasVoted(alice));
        assertEq(voting.registeredVoterCount(), 1);
    }
    function test_OnlyAdminRegisters() public {
        vm.prank(alice); vm.expectRevert(Voting.Unauthorized.selector); voting.registerVoters(one(alice));
    }
    function test_EmptyBatch() public {
        vm.expectRevert(Voting.InvalidBatchSize.selector); voting.registerVoters(new address[](0));
    }
    function test_BatchLimit() public {
        address[] memory batch = new address[](100);
        for (uint256 i; i < 100; ++i) batch[i] = address(uint160(i + 1));
        voting.registerVoters(batch); assertEq(voting.registeredVoterCount(), 100);
        vm.expectRevert(Voting.InvalidBatchSize.selector); voting.registerVoters(new address[](101));
    }
    function test_ZeroVoter() public {
        vm.expectRevert(Voting.InvalidVoter.selector); voting.registerVoters(one(address(0)));
    }
    function test_AlreadyRegistered() public {
        voting.registerVoters(one(alice));
        vm.expectRevert(Voting.AlreadyRegistered.selector); voting.registerVoters(one(alice));
        assertEq(voting.registeredVoterCount(), 1);
    }
    function test_DuplicateBatchRollsBack() public {
        address[] memory batch = new address[](2); batch[0] = alice; batch[1] = alice;
        vm.expectRevert(Voting.AlreadyRegistered.selector); voting.registerVoters(batch);
        assertFalse(voting.isRegistered(alice)); assertEq(voting.registeredVoterCount(), 0);
    }
    function test_InvalidLastEntryRollsBack() public {
        address[] memory batch = new address[](2); batch[0] = alice;
        vm.expectRevert(Voting.InvalidVoter.selector); voting.registerVoters(batch);
        assertFalse(voting.isRegistered(alice)); assertEq(voting.registeredVoterCount(), 0);
    }
    function test_ExistingLastEntryRollsBackNewEntry() public {
        voting.registerVoters(one(alice));
        address[] memory batch = new address[](2); batch[0] = address(12); batch[1] = alice;
        vm.expectRevert(Voting.AlreadyRegistered.selector); voting.registerVoters(batch);
        assertFalse(voting.isRegistered(address(12))); assertEq(voting.registeredVoterCount(), 1);
    }
    function test_StartAndEvent() public {
        ready(); vm.warp(1_000);
        vm.expectEmit(false, false, false, true); emit Voting.VotingStarted(1_000, 1_060);
        voting.startVoting(60);
        assertTrue(voting.started()); assertEq(voting.startTime(), 1_000); assertEq(voting.endTime(), 1_060);
        assertEq(uint256(voting.phase()), 1);
    }
    function test_OnlyAdminStarts() public {
        ready(); vm.prank(alice); vm.expectRevert(Voting.Unauthorized.selector); voting.startVoting(60);
    }
    function test_StartNeedsTwoCandidates() public {
        voting.addCandidate("A"); voting.registerVoters(one(alice));
        vm.expectRevert(Voting.InsufficientCandidates.selector); voting.startVoting(60);
    }
    function test_StartNeedsVoters() public {
        voting.addCandidate("A"); voting.addCandidate("B");
        vm.expectRevert(Voting.NoRegisteredVoters.selector); voting.startVoting(60);
    }
    function test_DurationBelowMinimum() public {
        ready(); vm.expectRevert(Voting.InvalidDuration.selector); voting.startVoting(59); assertFalse(voting.started());
    }
    function test_DurationAboveMaximum() public {
        ready(); vm.expectRevert(Voting.InvalidDuration.selector); voting.startVoting(30 days + 1);
    }
    function test_MaxDurationAccepted() public {
        ready(); voting.startVoting(30 days); assertEq(voting.endTime() - voting.startTime(), 30 days);
    }
    function test_FreezeSetupDuringAndAfterVoting() public {
        ready(); voting.startVoting(60);
        for (uint256 i; i < 2; ++i) {
            vm.expectRevert(Voting.InvalidPhase.selector); voting.addCandidate("C");
            vm.expectRevert(Voting.InvalidPhase.selector); voting.registerVoters(one(address(12)));
            vm.expectRevert(Voting.InvalidPhase.selector); voting.startVoting(120);
            vm.warp(voting.endTime());
        }
        assertEq(voting.candidateCount(), 2); assertEq(voting.registeredVoterCount(), 1);
    }
}
