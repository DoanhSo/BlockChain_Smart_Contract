// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.34;

import {Test} from "forge-std/Test.sol";
import {Voting} from "../contracts/Voting.sol";

contract VotingTest is Test {
    function test_RecordsTheDeployerAndTitle() public {
        Voting voting = new Voting("CSE465 election");
        assertEq(voting.admin(), address(this));
        assertEq(voting.electionTitle(), "CSE465 election");
    }

    function test_RejectsAnEmptyTitle() public {
        vm.expectRevert(Voting.InvalidTitle.selector);
        new Voting("");
    }

    function test_AcceptsTheTitleSizeBoundary() public {
        bytes memory title = new bytes(160);
        for (uint256 i; i < title.length; ++i) title[i] = "a";
        Voting voting = new Voting(string(title));
        assertEq(bytes(voting.electionTitle()).length, 160);
    }

    function test_RejectsATitleAboveTheByteLimit() public {
        bytes memory title = new bytes(161);
        vm.expectRevert(Voting.InvalidTitle.selector);
        new Voting(string(title));
    }
}
