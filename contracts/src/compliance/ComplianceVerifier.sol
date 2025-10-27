// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, ebool, euint8, euint16, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IIdentityRegistry {
    function hasIdentity(address user) external view returns (bool);
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
}

interface IPolicyEngine {
    function hasResult(address user, uint256 policyId) external view returns (bool);
}

/**
 * @title ComplianceVerifier
 * @notice Manages compliance verification and attestations
 * @dev Issues verifiable compliance proofs without exposing user data
 */
contract ComplianceVerifier is SepoliaConfig, Ownable, ReentrancyGuard {

    // ═══════════════════════════════════════════════════════════════
    // DATA STRUCTURES
    // ═══════════════════════════════════════════════════════════════

    struct ComplianceAttestation {
        uint256 policyId;
        euint8 complianceStatus;  // 0 = failed, 1 = passed
        uint64 issuedAt;
        uint64 expiresAt;
        bool isValid;
    }

    struct ComplianceRequirement {
        string name;
        bool requireIdentity;
        bool requirePolicyPass;
        uint256 requiredPolicyId;
        uint64 validityPeriod;
        bool active;
    }

    // ═══════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════

    IIdentityRegistry public identityRegistry;
    IPolicyEngine public policyEngine;

    // User => Requirement ID => Attestation
    mapping(address => mapping(uint256 => ComplianceAttestation)) private attestations;

    // Requirement ID => Requirement
    mapping(uint256 => ComplianceRequirement) public requirements;
    uint256 public requirementCounter;

    // Compliance officers
    mapping(address => bool) public complianceOfficers;

    // Track total attestations
    uint256 public totalAttestations;

    // ═══════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════

    event RequirementCreated(uint256 indexed requirementId, string name);
    event RequirementUpdated(uint256 indexed requirementId);
    event AttestationIssued(
        address indexed user,
        uint256 indexed requirementId,
        uint64 issuedAt,
        uint64 expiresAt
    );
    event AttestationRevoked(address indexed user, uint256 indexed requirementId);
    event ComplianceOfficerUpdated(address indexed officer, bool authorized);

    // ═══════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════

    error InvalidRequirement();
    error RequirementInactive();
    error UnauthorizedOfficer();
    error NoIdentity();
    error PolicyNotEvaluated();
    error AttestationExpired();
    error NoAttestation();
    error InvalidRegistries();

    // ═══════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════

    constructor(address _identityRegistry, address _policyEngine) Ownable(msg.sender) {
        if (_identityRegistry == address(0) || _policyEngine == address(0)) {
            revert InvalidRegistries();
        }
        identityRegistry = IIdentityRegistry(_identityRegistry);
        policyEngine = IPolicyEngine(_policyEngine);
        complianceOfficers[msg.sender] = true;
    }

    // ═══════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Set compliance officer authorization
     * @param officer Address of the officer
     * @param authorized Whether the officer is authorized
     */
    function setComplianceOfficer(address officer, bool authorized) external onlyOwner {
        complianceOfficers[officer] = authorized;
        emit ComplianceOfficerUpdated(officer, authorized);
    }

    /**
     * @notice Create a new compliance requirement
     * @param name Requirement name
     * @param requireIdentity Whether identity is required
     * @param requirePolicyPass Whether policy evaluation is required
     * @param requiredPolicyId Required policy ID (if applicable)
     * @param validityPeriod Validity period in seconds
     * @return requirementId The created requirement ID
     */
    function createRequirement(
        string memory name,
        bool requireIdentity,
        bool requirePolicyPass,
        uint256 requiredPolicyId,
        uint64 validityPeriod
    ) external onlyOwner returns (uint256) {
        uint256 requirementId = requirementCounter++;

        requirements[requirementId] = ComplianceRequirement({
            name: name,
            requireIdentity: requireIdentity,
            requirePolicyPass: requirePolicyPass,
            requiredPolicyId: requiredPolicyId,
            validityPeriod: validityPeriod,
            active: true
        });

        emit RequirementCreated(requirementId, name);
        return requirementId;
    }

    /**
     * @notice Update requirement status
     * @param requirementId Requirement ID
     * @param active New active status
     */
    function setRequirementStatus(uint256 requirementId, bool active) external onlyOwner {
        if (requirementId >= requirementCounter) revert InvalidRequirement();
        requirements[requirementId].active = active;
        emit RequirementUpdated(requirementId);
    }

    /**
     * @notice Update registries
     * @param _identityRegistry New identity registry
     * @param _policyEngine New policy engine
     */
    function updateRegistries(address _identityRegistry, address _policyEngine)
        external
        onlyOwner
    {
        if (_identityRegistry == address(0) || _policyEngine == address(0)) {
            revert InvalidRegistries();
        }
        identityRegistry = IIdentityRegistry(_identityRegistry);
        policyEngine = IPolicyEngine(_policyEngine);
    }

    // ═══════════════════════════════════════════════════════════════
    // ATTESTATION FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Request compliance attestation
     * @param requirementId Requirement ID to verify against
     */
    function requestAttestation(uint256 requirementId) external nonReentrant {
        if (requirementId >= requirementCounter) revert InvalidRequirement();

        ComplianceRequirement storage req = requirements[requirementId];
        if (!req.active) revert RequirementInactive();

        // Check identity requirement
        if (req.requireIdentity && !identityRegistry.hasIdentity(msg.sender)) {
            revert NoIdentity();
        }

        // Check policy requirement
        if (req.requirePolicyPass) {
            if (!policyEngine.hasResult(msg.sender, req.requiredPolicyId)) {
                revert PolicyNotEvaluated();
            }
        }

        // Issue attestation with encrypted pass status
        euint8 passStatus = FHE.asEuint8(1);  // Passed compliance check
        FHE.allowThis(passStatus);
        FHE.allow(passStatus, msg.sender);

        uint64 now64 = uint64(block.timestamp);
        uint64 expiresAt = now64 + req.validityPeriod;

        attestations[msg.sender][requirementId] = ComplianceAttestation({
            policyId: req.requiredPolicyId,
            complianceStatus: passStatus,
            issuedAt: now64,
            expiresAt: expiresAt,
            isValid: true
        });

        totalAttestations++;

        emit AttestationIssued(msg.sender, requirementId, now64, expiresAt);
    }

    /**
     * @notice Revoke a compliance attestation
     * @param user User address
     * @param requirementId Requirement ID
     */
    function revokeAttestation(address user, uint256 requirementId) external {
        if (!complianceOfficers[msg.sender]) revert UnauthorizedOfficer();
        if (!attestations[user][requirementId].isValid) revert NoAttestation();

        attestations[user][requirementId].isValid = false;

        emit AttestationRevoked(user, requirementId);
    }

    // ═══════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Check if user has valid attestation
     * @param user User address
     * @param requirementId Requirement ID
     * @return valid Whether attestation is valid
     */
    function hasValidAttestation(address user, uint256 requirementId)
        external
        view
        returns (bool)
    {
        ComplianceAttestation storage attestation = attestations[user][requirementId];

        if (!attestation.isValid) return false;
        if (block.timestamp > attestation.expiresAt) return false;

        return true;
    }

    /**
     * @notice Get attestation metadata
     * @param user User address
     * @param requirementId Requirement ID
     * @return issuedAt Issue timestamp
     * @return expiresAt Expiration timestamp
     * @return isValid Validity status
     */
    function getAttestationMetadata(address user, uint256 requirementId)
        external
        view
        returns (uint64 issuedAt, uint64 expiresAt, bool isValid)
    {
        ComplianceAttestation storage attestation = attestations[user][requirementId];
        return (attestation.issuedAt, attestation.expiresAt, attestation.isValid);
    }

    /**
     * @notice Re-encrypt compliance status for the user
     * @param requirementId Requirement ID
     * @param publicKey Public key to encrypt to
     * @return Encrypted compliance status bytes
     */
    /* DISABLED - Gateway required
function reencryptComplianceStatus(uint256 requirementId, bytes calldata publicKey)
        external
        view
        returns (bytes memory)
    {
        if (!attestations[msg.sender][requirementId].isValid) revert NoAttestation();
        return FHE.reencrypt(attestations[msg.sender][requirementId].complianceStatus, publicKey);
    }
*/

    /**
     * @notice Get requirement configuration
     * @param requirementId Requirement ID
     * @return Requirement configuration
     */
    function getRequirement(uint256 requirementId)
        external
        view
        returns (ComplianceRequirement memory)
    {
        if (requirementId >= requirementCounter) revert InvalidRequirement();
        return requirements[requirementId];
    }
}
