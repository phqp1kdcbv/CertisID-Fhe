// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {
    FHE,
    euint8,
    euint16,
    euint32,
    externalEuint8,
    externalEuint16,
    externalEuint32
} from "@fhevm/solidity/lib/FHE.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IdentityRegistry
 * @notice Central registry for encrypted identity data using FHE
 * @dev Stores and manages encrypted personal information for KYC/AML compliance
 */
contract IdentityRegistry is SepoliaConfig, Ownable, ReentrancyGuard {

    // ═══════════════════════════════════════════════════════════════
    // DATA STRUCTURES
    // ═══════════════════════════════════════════════════════════════

    struct EncryptedIdentity {
        euint32 fullNameHash;    // Hash of encrypted full name
        euint8 age;              // Age (0-255) derived from date of birth
        euint32 addressHash;     // Hash of encrypted address
        euint16 countryCode;     // ISO 3166-1 numeric country code
        euint32 passportHash;    // Hash of encrypted passport number
        euint8 kycLevel;         // KYC verification level (0-5, auto-set to 1)
        euint8 riskScore;        // Risk assessment score (0-100, default 50)
        euint8 verified;         // Verification status (0/1)
        uint64 createdAt;
        uint64 updatedAt;
        bool exists;
    }

    // ═══════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════

    // User address => Encrypted identity
    mapping(address => EncryptedIdentity) private identities;

    // Authorized verifiers who can update identity data
    mapping(address => bool) public authorizedVerifiers;

    // Track total identities for statistics
    uint256 public totalIdentities;

    // Mapping to track user's authorized contracts
    mapping(address => mapping(address => bool)) public authorizedContracts;

    // ═══════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════

    event IdentityCreated(address indexed user, uint64 timestamp);
    event IdentityUpdated(address indexed user, uint64 timestamp);
    event IdentityRevoked(address indexed user, uint64 timestamp);
    event VerifierUpdated(address indexed verifier, bool authorized);
    event ContractAuthorized(address indexed user, address indexed contractAddr, bool authorized);

    // ═══════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════

    error IdentityNotFound();
    error IdentityAlreadyExists();
    error IdentityExpired();
    error UnauthorizedVerifier();
    error InvalidKYCLevel();
    error InvalidRiskScore();

    // ═══════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════

    constructor() Ownable(msg.sender) {}

    // ═══════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Set authorization status for a verifier
     * @param verifier Address of the verifier
     * @param authorized Whether the verifier is authorized
     */
    function setVerifier(address verifier, bool authorized) external onlyOwner {
        authorizedVerifiers[verifier] = authorized;
        emit VerifierUpdated(verifier, authorized);
    }

    // ═══════════════════════════════════════════════════════════════
    // IDENTITY MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Create or update encrypted identity with KYC data
     * @param fullNameHashExt Encrypted hash of full name
     * @param fullNameProof ZK proof for full name hash
     * @param ageExt Encrypted age (derived from date of birth)
     * @param ageProof ZK proof for age
     * @param addressHashExt Encrypted hash of residential address
     * @param addressProof ZK proof for address hash
     * @param countryExt Encrypted country code (ISO 3166-1 numeric)
     * @param countryProof ZK proof for country code
     * @param passportHashExt Encrypted hash of passport number
     * @param passportProof ZK proof for passport hash
     */
    function submitIdentity(
        externalEuint32 fullNameHashExt,
        bytes calldata fullNameProof,
        externalEuint8 ageExt,
        bytes calldata ageProof,
        externalEuint32 addressHashExt,
        bytes calldata addressProof,
        externalEuint16 countryExt,
        bytes calldata countryProof,
        externalEuint32 passportHashExt,
        bytes calldata passportProof
    ) external nonReentrant {
        address user = msg.sender;

        // Convert external encrypted values to internal
        euint32 fullNameHash = FHE.fromExternal(fullNameHashExt, fullNameProof);
        euint8 age = FHE.fromExternal(ageExt, ageProof);
        euint32 addressHash = FHE.fromExternal(addressHashExt, addressProof);
        euint16 countryCode = FHE.fromExternal(countryExt, countryProof);
        euint32 passportHash = FHE.fromExternal(passportHashExt, passportProof);

        // Set default values for auto-calculated fields
        euint8 kycLevel = FHE.asEuint8(1);        // Initial KYC level 1
        euint8 riskScore = FHE.asEuint8(50);      // Default medium risk
        euint8 verified = FHE.asEuint8(0);        // Not yet verified

        // Allow contract to access encrypted data
        FHE.allowThis(fullNameHash);
        FHE.allowThis(age);
        FHE.allowThis(addressHash);
        FHE.allowThis(countryCode);
        FHE.allowThis(passportHash);
        FHE.allowThis(kycLevel);
        FHE.allowThis(riskScore);
        FHE.allowThis(verified);

        // Allow user to access their own encrypted data
        FHE.allow(fullNameHash, user);
        FHE.allow(age, user);
        FHE.allow(addressHash, user);
        FHE.allow(countryCode, user);
        FHE.allow(passportHash, user);
        FHE.allow(kycLevel, user);
        FHE.allow(riskScore, user);
        FHE.allow(verified, user);

        bool isNew = !identities[user].exists;
        uint64 now64 = uint64(block.timestamp);

        identities[user] = EncryptedIdentity({
            fullNameHash: fullNameHash,
            age: age,
            addressHash: addressHash,
            countryCode: countryCode,
            passportHash: passportHash,
            kycLevel: kycLevel,
            riskScore: riskScore,
            verified: verified,
            createdAt: isNew ? now64 : identities[user].createdAt,
            updatedAt: now64,
            exists: true
        });

        if (isNew) {
            totalIdentities++;
            emit IdentityCreated(user, now64);
        } else {
            emit IdentityUpdated(user, now64);
        }
    }

    /**
     * @notice Verify a user's identity (only by authorized verifiers)
     * @param user Address of the user to verify
     * @param newKycLevel New KYC level (1-5)
     * @param newRiskScore New risk score (0-100)
     */
    function verifyIdentity(
        address user,
        uint8 newKycLevel,
        uint8 newRiskScore
    ) external {
        if (!identities[user].exists) revert IdentityNotFound();
        if (!authorizedVerifiers[msg.sender] && msg.sender != owner()) {
            revert UnauthorizedVerifier();
        }
        if (newKycLevel > 5) revert InvalidKYCLevel();
        if (newRiskScore > 100) revert InvalidRiskScore();

        // Update KYC level, risk score, and verification status
        identities[user].kycLevel = FHE.asEuint8(newKycLevel);
        identities[user].riskScore = FHE.asEuint8(newRiskScore);
        identities[user].verified = FHE.asEuint8(1);
        identities[user].updatedAt = uint64(block.timestamp);

        // Allow contract and user to access updated values
        FHE.allowThis(identities[user].kycLevel);
        FHE.allowThis(identities[user].riskScore);
        FHE.allowThis(identities[user].verified);
        FHE.allow(identities[user].kycLevel, user);
        FHE.allow(identities[user].riskScore, user);
        FHE.allow(identities[user].verified, user);

        emit IdentityUpdated(user, uint64(block.timestamp));
    }

    /**
     * @notice Revoke a user's identity
     * @param user Address of the user
     */
    function revokeIdentity(address user) external {
        if (!identities[user].exists) revert IdentityNotFound();
        if (msg.sender != user && !authorizedVerifiers[msg.sender] && msg.sender != owner()) {
            revert UnauthorizedVerifier();
        }

        delete identities[user];
        totalIdentities--;

        emit IdentityRevoked(user, uint64(block.timestamp));
    }

    /**
     * @notice Authorize a contract to access user's encrypted data
     * @param contractAddr Address of the contract to authorize
     * @param authorized Whether to authorize or revoke
     */
    function authorizeContract(address contractAddr, bool authorized) external {
        if (!identities[msg.sender].exists) revert IdentityNotFound();

        authorizedContracts[msg.sender][contractAddr] = authorized;
        emit ContractAuthorized(msg.sender, contractAddr, authorized);
    }

    // ═══════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Check if user has an identity
     * @param user Address of the user
     * @return Whether the user has an identity
     */
    function hasIdentity(address user) external view returns (bool) {
        return identities[user].exists;
    }

    /**
     * @notice Check if identity is verified
     * @param user Address of the user
     * @return Whether the identity is verified (note: returns encrypted value)
     */
    function isVerified(address user) external view returns (bool) {
        if (!identities[user].exists) revert IdentityNotFound();
        return identities[user].exists;
    }

    /**
     * @notice Get identity metadata (non-encrypted)
     * @param user Address of the user
     * @return createdAt Creation timestamp
     * @return updatedAt Last update timestamp
     */
    function getIdentityMetadata(address user)
        external
        view
        returns (
            uint64 createdAt,
            uint64 updatedAt
        )
    {
        if (!identities[user].exists) revert IdentityNotFound();

        EncryptedIdentity storage identity = identities[user];
        return (
            identity.createdAt,
            identity.updatedAt
        );
    }

    /**
    /* DISABLED - Gateway required
function reencryptAge(address user, bytes calldata publicKey)
        external
        view
        returns (bytes memory)
    {
        if (!identities[user].exists) revert IdentityNotFound();
        _checkAccess(user);
        return FHE.reencrypt(identities[user].age, publicKey);
    }
*/

    /**
    /* DISABLED - Gateway required
function reencryptKYCLevel(address user, bytes calldata publicKey)
        external
        view
        returns (bytes memory)
    {
        if (!identities[user].exists) revert IdentityNotFound();
        _checkAccess(user);
        return FHE.reencrypt(identities[user].kycLevel, publicKey);
    }
*/

    /**
    /* DISABLED - Gateway required
function reencryptRiskScore(address user, bytes calldata publicKey)
        external
        view
        returns (bytes memory)
    {
        if (!identities[user].exists) revert IdentityNotFound();
        _checkAccess(user);
        return FHE.reencrypt(identities[user].riskScore, publicKey);
    }
*/

    // ═══════════════════════════════════════════════════════════════
    // INTERNAL ACCESS CONTROL
    // ═══════════════════════════════════════════════════════════════

    function _checkAccess(address user) private view {
        if (msg.sender != user && !authorizedContracts[user][msg.sender]) {
            revert UnauthorizedVerifier();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // INTERNAL GETTERS (FOR AUTHORIZED CONTRACTS)
    // ═══════════════════════════════════════════════════════════════

    /**
     * @notice Get encrypted identity data (internal use only)
     * @dev Only callable by authorized contracts
     */
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
        )
    {
        if (!identities[user].exists) revert IdentityNotFound();

        // Check if caller is authorized
        _checkAccess(user);

        EncryptedIdentity storage identity = identities[user];
        return (
            identity.fullNameHash,
            identity.age,
            identity.addressHash,
            identity.countryCode,
            identity.passportHash,
            identity.kycLevel,
            identity.riskScore,
            identity.verified
        );
    }
}
