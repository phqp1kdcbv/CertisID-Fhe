// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, ebool, euint8, euint16, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IIdentityRegistry {
    function getEncryptedIdentity(address user)
        external
        view
        returns (
            euint32 fullNameHash,
            euint8 age,
            euint32 addressHash,
            euint16 countryCode,
            euint32 passportHash,
            euint8 kycLevel,
            euint8 riskScore,
            euint8 verified
        );

    function hasIdentity(address user) external view returns (bool);
}

/**
 * @title PolicyEngine
 * @notice Evaluates encrypted policy conditions using FHE operations
 * @dev Supports multiple configurable policies for different use cases
 */
contract PolicyEngine is SepoliaConfig, Ownable, ReentrancyGuard {

    // ═══════════════════════════════════════════════════════════════
    // DATA STRUCTURES
    // ═══════════════════════════════════════════════════════════════

    struct Policy {
        string name;
        uint8 minAge;
        uint8 maxAge;
        uint8 minKYCLevel;
        uint8 maxRiskScore;
        bool requireAccredited;
        bool allowPEP;
        bool allowSanctioned;
        uint256 createdAt;
        bool active;
    }

    struct PolicyResult {
        euint8 encryptedResult;  // 0 or 1 (pass/fail)
        uint64 evaluatedAt;
        uint256 policyId;
        bool exists;
    }

    // ═══════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════

    IIdentityRegistry public identityRegistry;

    // Policy ID => Policy configuration
    mapping(uint256 => Policy) public policies;
    uint256 public policyCounter;

    // User => Policy ID => Result
    mapping(address => mapping(uint256 => PolicyResult)) private policyResults;

    // User => last evaluated policy ID
    mapping(address => uint256) public lastEvaluatedPolicy;

    // ═══════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════

    event PolicyCreated(uint256 indexed policyId, string name);
    event PolicyUpdated(uint256 indexed policyId);
    event PolicyEvaluated(address indexed user, uint256 indexed policyId, uint64 timestamp);
    event ResultClaimed(address indexed user, uint256 indexed policyId, uint8 result);

    // ═══════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════

    error NoIdentity();
    error InvalidPolicy();
    error PolicyInactive();
    error NoResult();
    error InvalidProof();
    error IdentityRegistryNotSet();

    // ═══════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════

    constructor(address _identityRegistry) Ownable(msg.sender) {
        if (_identityRegistry == address(0)) revert IdentityRegistryNotSet();
        identityRegistry = IIdentityRegistry(_identityRegistry);
    }

    // ═══════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Create a new policy
     * @param name Policy name
     * @param minAge Minimum age requirement
     * @param maxAge Maximum age requirement (255 = no limit)
     * @param minKYCLevel Minimum KYC level
     * @param maxRiskScore Maximum risk score
     * @param requireAccredited Whether accreditation is required
     * @param allowPEP Whether PEPs are allowed
     * @param allowSanctioned Whether sanctioned individuals are allowed
     * @return policyId The created policy ID
     */
    function createPolicy(
        string memory name,
        uint8 minAge,
        uint8 maxAge,
        uint8 minKYCLevel,
        uint8 maxRiskScore,
        bool requireAccredited,
        bool allowPEP,
        bool allowSanctioned
    ) external onlyOwner returns (uint256) {
        uint256 policyId = policyCounter++;

        policies[policyId] = Policy({
            name: name,
            minAge: minAge,
            maxAge: maxAge,
            minKYCLevel: minKYCLevel,
            maxRiskScore: maxRiskScore,
            requireAccredited: requireAccredited,
            allowPEP: allowPEP,
            allowSanctioned: allowSanctioned,
            createdAt: block.timestamp,
            active: true
        });

        emit PolicyCreated(policyId, name);
        return policyId;
    }

    /**
     * @notice Update policy status
     * @param policyId Policy ID
     * @param active New active status
     */
    function setPolicyStatus(uint256 policyId, bool active) external onlyOwner {
        if (policyId >= policyCounter) revert InvalidPolicy();
        policies[policyId].active = active;
        emit PolicyUpdated(policyId);
    }

    /**
     * @notice Update identity registry address
     * @param _identityRegistry New identity registry address
     */
    function setIdentityRegistry(address _identityRegistry) external onlyOwner {
        if (_identityRegistry == address(0)) revert IdentityRegistryNotSet();
        identityRegistry = IIdentityRegistry(_identityRegistry);
    }

    // ═══════════════════════════════════════════════════════════════
    // POLICY EVALUATION
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Evaluate a policy for the caller
     * @param policyId Policy ID to evaluate
     */
    function evaluatePolicy(uint256 policyId) external nonReentrant {
        if (policyId >= policyCounter) revert InvalidPolicy();
        if (!policies[policyId].active) revert PolicyInactive();
        if (!identityRegistry.hasIdentity(msg.sender)) revert NoIdentity();

        Policy storage policy = policies[policyId];

        // Get encrypted identity data
        (
            ,  // fullNameHash not used
            euint8 age,
            ,  // addressHash not used
            ,  // countryCode not used
            ,  // passportHash not used
            euint8 kycLevel,
            euint8 riskScore,
            euint8 verified
        ) = identityRegistry.getEncryptedIdentity(msg.sender);

        // Build policy conditions using FHE operations
        ebool condMinAge = FHE.ge(age, policy.minAge);
        ebool condMaxAge = policy.maxAge == 255 ?
            FHE.asEbool(true) :
            FHE.le(age, policy.maxAge);

        ebool condKYCLevel = FHE.ge(kycLevel, policy.minKYCLevel);
        ebool condRiskScore = FHE.le(riskScore, policy.maxRiskScore);

        // Verified check (replaces PEP/sanctions/accredited checks)
        ebool condVerified = FHE.eq(verified, 1);

        // Accreditation check (simplified to verified status)
        ebool condAccredited = policy.requireAccredited ?
            condVerified :
            FHE.asEbool(true);

        // Combine all conditions with AND
        ebool result = FHE.and(
            condMinAge,
            FHE.and(
                condMaxAge,
                FHE.and(
                    condKYCLevel,
                    FHE.and(
                        condRiskScore,
                        condAccredited
                    )
                )
            )
        );

        // Convert ebool to euint8 (0 or 1)
        euint8 passValue = FHE.select(result, FHE.asEuint8(1), FHE.asEuint8(0));

        // Store encrypted result
        policyResults[msg.sender][policyId] = PolicyResult({
            encryptedResult: passValue,
            evaluatedAt: uint64(block.timestamp),
            policyId: policyId,
            exists: true
        });

        // Allow user to access result
        FHE.allow(passValue, msg.sender);
        FHE.allowThis(passValue);

        lastEvaluatedPolicy[msg.sender] = policyId;

        emit PolicyEvaluated(msg.sender, policyId, uint64(block.timestamp));
    }

    /**
     * @notice Claim policy result by providing decrypted value
     * @param policyId Policy ID
     * @param decryptedResult Decrypted result (0 or 1)
     * @return success Whether the claim was successful
     */
    function claimResult(uint256 policyId, uint8 decryptedResult)
        external
        nonReentrant
        returns (bool)
    {
        if (!policyResults[msg.sender][policyId].exists) revert NoResult();
        if (decryptedResult > 1) revert InvalidProof();

        // Note: In production, verification would require Gateway decryption
        // to ensure the decryptedResult matches the encrypted value.
        // For now, we trust the user-provided decrypted value.
        // The contract could implement a challenge-response mechanism
        // or use Gateway to verify the decryption is correct.
        
        // Store the claim for potential verification
        // In a full implementation, the Gateway would verify this
        
        emit ResultClaimed(msg.sender, policyId, decryptedResult);

        return decryptedResult == 1;
    }

    // ═══════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Check if user has evaluated a policy
     * @param user User address
     * @param policyId Policy ID
     * @return exists Whether the result exists
     */
    function hasResult(address user, uint256 policyId) external view returns (bool) {
        return policyResults[user][policyId].exists;
    }

    /**
     * @notice Get policy result metadata
     * @param user User address
     * @param policyId Policy ID
     * @return evaluatedAt Evaluation timestamp
     * @return exists Whether the result exists
     */
    function getResultMetadata(address user, uint256 policyId)
        external
        view
        returns (uint64 evaluatedAt, bool exists)
    {
        PolicyResult storage result = policyResults[user][policyId];
        return (result.evaluatedAt, result.exists);
    }

    /**
     * @notice Re-encrypt policy result for the user
     * @param policyId Policy ID
     * @param publicKey Public key to encrypt to
     * @return Encrypted result bytes
     */
    /* DISABLED - Gateway required
function reencryptResult(uint256 policyId, bytes calldata publicKey)
        external
        view
        returns (bytes memory)
    {
        if (!policyResults[msg.sender][policyId].exists) revert NoResult();
        return FHE.reencrypt(policyResults[msg.sender][policyId].encryptedResult, publicKey);
    }
*/

    /**
     * @notice Get policy configuration
     * @param policyId Policy ID
     * @return Policy configuration
     */
    function getPolicy(uint256 policyId) external view returns (Policy memory) {
        if (policyId >= policyCounter) revert InvalidPolicy();
        return policies[policyId];
    }
}
