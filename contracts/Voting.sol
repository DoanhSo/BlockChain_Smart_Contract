// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.34;

/// @title CSE465 voting project - initialization scaffold
/// @notice Voting operations will be implemented in the next milestone.
contract Voting {
    uint256 public constant MAX_TITLE_BYTES = 160;

    address public immutable admin;
    string public electionTitle;

    error InvalidTitle();

    constructor(string memory title) {
        uint256 length = bytes(title).length;
        if (length == 0 || length > MAX_TITLE_BYTES) revert InvalidTitle();

        admin = msg.sender;
        electionTitle = title;
    }

    // Next: candidates, voter registry, lifecycle, vote and outcome.
    // See docs/requirements.md before implementing these operations.
}
