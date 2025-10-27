// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint16, euint32, externalEuint16} from "@fhevm/solidity/lib/FHE.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ReputationScore
 * @notice Privacy-preserving reputation system using FHE
 * @dev Tracks encrypted reputation scores and activity metrics
 */
contract ReputationScore is SepoliaConfig, Ownable, ReentrancyGuard {

    // ═══════════════════════════════════════════════════════════════
    // DATA STRUCTURES
    // ═══════════════════════════════════════════════════════════════

    struct EncryptedReputation {
        euint16 totalScore;           // Total reputation score (0-65535)
        euint16 trustScore;           // Trust score (0-10000)
        euint16 activityScore;        // Activity score (0-10000)
        euint32 totalInteractions;    // Total interactions count
        uint64 lastUpdated;
        uint64 createdAt;
        bool exists;
    }

    // ═══════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════

    // User address => Encrypted reputation
    mapping(address => EncryptedReputation) private reputations;

    // Authorized scorers who can update reputation
    mapping(address => bool) public authorizedScorers;

    // Total reputation accounts
    uint256 public totalReputationAccounts;

    // Score change limits per update
    uint16 public constant MAX_SCORE_CHANGE = 1000;

    // ═══════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════

    event ReputationCreated(address indexed user, uint64 timestamp);
    event ReputationUpdated(address indexed user, uint64 timestamp);
    event ScorerUpdated(address indexed scorer, bool authorized);
    event InteractionRecorded(address indexed user, uint64 timestamp);

    // ═══════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════

    error ReputationNotFound();
    error UnauthorizedScorer();
    error ReputationAlreadyExists();
    error InvalidScoreChange();

    // ═══════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════

    constructor() Ownable(msg.sender) {
        // Owner is automatically an authorized scorer
        authorizedScorers[msg.sender] = true;
    }

    // ═══════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Set authorization status for a scorer
     * @param scorer Address of the scorer
     * @param authorized Whether the scorer is authorized
     */
    function setScorer(address scorer, bool authorized) external onlyOwner {
        authorizedScorers[scorer] = authorized;
        emit ScorerUpdated(scorer, authorized);
    }

    // ═══════════════════════════════════════════════════════════════
    // REPUTATION MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Initialize reputation for a user
     * @param user Address of the user
     * @param initialScoreExt Initial encrypted total score
     * @param scoreProof ZK proof for initial score
     */
    function initializeReputation(
        address user,
        externalEuint16 initialScoreExt,
        bytes calldata scoreProof
    ) external nonReentrant {
        if (!authorizedScorers[msg.sender]) revert UnauthorizedScorer();
        if (reputations[user].exists) revert ReputationAlreadyExists();

        euint16 initialScore = FHE.fromExternal(initialScoreExt, scoreProof);

        // Initialize with equal distribution to trust and activity
        euint16 halfScore = FHE.div(initialScore, 2);

        FHE.allowThis(initialScore);
        FHE.allowThis(halfScore);
        FHE.allow(initialScore, user);
        FHE.allow(halfScore, user);

        uint64 now64 = uint64(block.timestamp);

        reputations[user] = EncryptedReputation({
            totalScore: initialScore,
            trustScore: halfScore,
            activityScore: halfScore,
            totalInteractions: FHE.asEuint32(0),
            lastUpdated: now64,
            createdAt: now64,
            exists: true
        });

        totalReputationAccounts++;
        emit ReputationCreated(user, now64);
    }

    /**
     * @notice Update user's trust score
     * @param user Address of the user
     * @param scoreChangeExt Encrypted score change (can be positive or negative)
     * @param changeProof ZK proof for score change
     */
    function updateTrustScore(
        address user,
        externalEuint16 scoreChangeExt,
        bytes calldata changeProof
    ) external nonReentrant {
        if (!authorizedScorers[msg.sender]) revert UnauthorizedScorer();
        if (!reputations[user].exists) revert ReputationNotFound();

        euint16 scoreChange = FHE.fromExternal(scoreChangeExt, changeProof);

        // Update trust score
        reputations[user].trustScore = FHE.add(
            reputations[user].trustScore,
            scoreChange
        );

        // Recalculate total score
        reputations[user].totalScore = FHE.add(
            reputations[user].trustScore,
            reputations[user].activityScore
        );

        FHE.allowThis(reputations[user].trustScore);
        FHE.allowThis(reputations[user].totalScore);
        FHE.allow(reputations[user].trustScore, user);
        FHE.allow(reputations[user].totalScore, user);

        reputations[user].lastUpdated = uint64(block.timestamp);

        emit ReputationUpdated(user, uint64(block.timestamp));
    }

    /**
     * @notice Update user's activity score
     * @param user Address of the user
     * @param scoreChangeExt Encrypted score change
     * @param changeProof ZK proof for score change
     */
    function updateActivityScore(
        address user,
        externalEuint16 scoreChangeExt,
        bytes calldata changeProof
    ) external nonReentrant {
        if (!authorizedScorers[msg.sender]) revert UnauthorizedScorer();
        if (!reputations[user].exists) revert ReputationNotFound();

        euint16 scoreChange = FHE.fromExternal(scoreChangeExt, changeProof);

        // Update activity score
        reputations[user].activityScore = FHE.add(
            reputations[user].activityScore,
            scoreChange
        );

        // Recalculate total score
        reputations[user].totalScore = FHE.add(
            reputations[user].trustScore,
            reputations[user].activityScore
        );

        FHE.allowThis(reputations[user].activityScore);
        FHE.allowThis(reputations[user].totalScore);
        FHE.allow(reputations[user].activityScore, user);
        FHE.allow(reputations[user].totalScore, user);

        reputations[user].lastUpdated = uint64(block.timestamp);

        emit ReputationUpdated(user, uint64(block.timestamp));
    }

    /**
     * @notice Record an interaction for a user
     * @param user Address of the user
     */
    function recordInteraction(address user) external {
        if (!authorizedScorers[msg.sender]) revert UnauthorizedScorer();
        if (!reputations[user].exists) revert ReputationNotFound();

        // Increment total interactions
        reputations[user].totalInteractions = FHE.add(
            reputations[user].totalInteractions,
            FHE.asEuint32(1)
        );

        FHE.allowThis(reputations[user].totalInteractions);
        FHE.allow(reputations[user].totalInteractions, user);

        emit InteractionRecorded(user, uint64(block.timestamp));
    }

    // ═══════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Check if user has a reputation account
     * @param user Address of the user
     * @return Whether the user has a reputation account
     */
    function hasReputation(address user) external view returns (bool) {
        return reputations[user].exists;
    }

    /**
     * @notice Get reputation metadata
     * @param user Address of the user
     * @return createdAt Creation timestamp
     * @return lastUpdated Last update timestamp
     */
    function getReputationMetadata(address user)
        external
        view
        returns (uint64 createdAt, uint64 lastUpdated)
    {
        if (!reputations[user].exists) revert ReputationNotFound();
        return (reputations[user].createdAt, reputations[user].lastUpdated);
    }

    /**
    /* DISABLED - Gateway required
function reencryptTotalScore(bytes calldata publicKey)
        external
        view
        returns (bytes memory)
    {
        if (!reputations[msg.sender].exists) revert ReputationNotFound();
        return FHE.reencrypt(reputations[msg.sender].totalScore, publicKey);
    }
*/

    /**
    /* DISABLED - Gateway required
function reencryptTrustScore(bytes calldata publicKey)
        external
        view
        returns (bytes memory)
    {
        if (!reputations[msg.sender].exists) revert ReputationNotFound();
        return FHE.reencrypt(reputations[msg.sender].trustScore, publicKey);
    }
*/

    /**
    /* DISABLED - Gateway required
function reencryptActivityScore(bytes calldata publicKey)
        external
        view
        returns (bytes memory)
    {
        if (!reputations[msg.sender].exists) revert ReputationNotFound();
        return FHE.reencrypt(reputations[msg.sender].activityScore, publicKey);
    }
*/

    /**
    /* DISABLED - Gateway required
function reencryptTotalInteractions(bytes calldata publicKey)
        external
        view
        returns (bytes memory)
    {
        if (!reputations[msg.sender].exists) revert ReputationNotFound();
        return FHE.reencrypt(reputations[msg.sender].totalInteractions, publicKey);
    }
*/

    /**
     * @notice Get encrypted reputation data (internal use)
     * @dev Only accessible by authorized scorers or the user themselves
     * @param user Address of the user
     * @return totalScore Encrypted total score
     * @return trustScore Encrypted trust score
     * @return activityScore Encrypted activity score
     */
    function getEncryptedReputation(address user)
        external
        view
        returns (
            euint16 totalScore,
            euint16 trustScore,
            euint16 activityScore
        )
    {
        if (!reputations[user].exists) revert ReputationNotFound();
        if (msg.sender != user && !authorizedScorers[msg.sender]) {
            revert UnauthorizedScorer();
        }

        EncryptedReputation storage rep = reputations[user];
        return (rep.totalScore, rep.trustScore, rep.activityScore);
    }
}
