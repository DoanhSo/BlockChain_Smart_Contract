// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.34;

/// @title Public, allowlisted, one-address-one-vote election for CSE465
/// @notice One deployment is one election. Wallet eligibility is assigned off-chain.
contract Voting {
    uint256 public constant MAX_TITLE_BYTES = 160;
    uint256 public constant MAX_NAME_BYTES = 96;
    uint256 public constant MAX_CANDIDATES = 20;
    uint256 public constant MAX_BATCH_SIZE = 100;
    uint256 public constant MIN_DURATION = 60;
    uint256 public constant MAX_DURATION = 30 days;

    enum Phase { Setup, Voting, Ended }
    enum Outcome { NoVotes, Winner, Tie }
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    address public immutable admin;
    string public electionTitle;
    Candidate[] private candidates;
    mapping(bytes32 => bool) private candidateNameUsed;
    mapping(address => bool) public isRegistered;
    mapping(address => bool) public hasVoted;
    uint256 public registeredVoterCount;
    uint256 public totalVotes;
    bool public started;
    uint256 public startTime;
    uint256 public endTime;

    error InvalidTitle();
    error Unauthorized();
    error InvalidPhase();
    error InvalidCandidateName();
    error DuplicateCandidate();
    error CandidateLimitReached();
    error InvalidVoter();
    error AlreadyRegistered();
    error InvalidBatchSize();
    error InsufficientCandidates();
    error NoRegisteredVoters();
    error InvalidDuration();
    error NotRegistered();
    error AlreadyVoted();
    error InvalidCandidate();
    error ResultsNotFinal();

    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoterRegistered(address indexed voter);
    event VotingStarted(uint256 startTime, uint256 endTime);
    event VoteCast(address indexed voter, uint256 indexed candidateId);

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    modifier onlySetup() {
        if (started) revert InvalidPhase();
        _;
    }

    constructor(string memory title) {
        uint256 length = bytes(title).length;
        if (length == 0 || length > MAX_TITLE_BYTES) revert InvalidTitle();

        admin = msg.sender;
        electionTitle = title;
    }

    /// @dev Derived from chain time; expiry needs neither an admin nor a transaction.
    function phase() public view returns (Phase) {
        if (!started) return Phase.Setup;
        return block.timestamp < endTime ? Phase.Voting : Phase.Ended;
    }

    function addCandidate(string calldata name) external onlyAdmin onlySetup {
        if (candidates.length >= MAX_CANDIDATES) revert CandidateLimitReached();
        uint256 length = bytes(name).length;
        if (length == 0 || length > MAX_NAME_BYTES) revert InvalidCandidateName();
        bytes32 key = keccak256(bytes(name));
        if (candidateNameUsed[key]) revert DuplicateCandidate();
        candidateNameUsed[key] = true;
        uint256 id = candidates.length;
        candidates.push(Candidate(name, 0));
        emit CandidateAdded(id, name);
    }

    /// @notice An invalid or duplicate entry reverts the entire batch.
    function registerVoters(address[] calldata voters) external onlyAdmin onlySetup {
        if (voters.length == 0 || voters.length > MAX_BATCH_SIZE) revert InvalidBatchSize();
        for (uint256 i; i < voters.length; ++i) {
            address voter = voters[i];
            if (voter == address(0)) revert InvalidVoter();
            if (isRegistered[voter]) revert AlreadyRegistered();
            isRegistered[voter] = true;
            emit VoterRegistered(voter);
        }
        registeredVoterCount += voters.length;
    }

    function startVoting(uint256 durationSeconds) external onlyAdmin onlySetup {
        if (candidates.length < 2) revert InsufficientCandidates();
        if (registeredVoterCount == 0) revert NoRegisteredVoters();
        if (durationSeconds < MIN_DURATION || durationSeconds > MAX_DURATION) revert InvalidDuration();
        started = true;
        startTime = block.timestamp;
        endTime = block.timestamp + durationSeconds;
        emit VotingStarted(startTime, endTime);
    }

    /// @notice Public and nonpayable; the sender pays network gas, not a contract fee.
    function vote(uint256 candidateId) external {
        if (phase() != Phase.Voting) revert InvalidPhase();
        if (!isRegistered[msg.sender]) revert NotRegistered();
        if (hasVoted[msg.sender]) revert AlreadyVoted();
        if (candidateId >= candidates.length) revert InvalidCandidate();
        hasVoted[msg.sender] = true;
        candidates[candidateId].voteCount += 1;
        totalVotes += 1;
        emit VoteCast(msg.sender, candidateId);
    }

    function candidateCount() external view returns (uint256) {
        return candidates.length;
    }

    function getCandidate(uint256 candidateId) external view returns (string memory name, uint256 voteCount) {
        if (candidateId >= candidates.length) revert InvalidCandidate();
        Candidate storage candidate = candidates[candidateId];
        return (candidate.name, candidate.voteCount);
    }

    /// @notice During Voting these are provisional, publicly observable totals.
    function getResults() external view returns (uint256[] memory voteCounts, uint256 total) {
        voteCounts = new uint256[](candidates.length);
        for (uint256 i; i < candidates.length; ++i) voteCounts[i] = candidates[i].voteCount;
        total = totalVotes;
    }

    function getOutcome() external view returns (Outcome outcome, uint256[] memory winnerIds, uint256 highestVotes) {
        if (phase() != Phase.Ended) revert ResultsNotFinal();
        if (totalVotes == 0) return (Outcome.NoVotes, new uint256[](0), 0);
        uint256 winnerCount;
        for (uint256 i; i < candidates.length; ++i) {
            uint256 count = candidates[i].voteCount;
            if (count > highestVotes) {
                highestVotes = count;
                winnerCount = 1;
            } else if (count == highestVotes) {
                winnerCount += 1;
            }
        }
        winnerIds = new uint256[](winnerCount);
        uint256 next;
        for (uint256 i; i < candidates.length; ++i) {
            if (candidates[i].voteCount == highestVotes) winnerIds[next++] = i;
        }
        outcome = winnerCount == 1 ? Outcome.Winner : Outcome.Tie;
    }
}
