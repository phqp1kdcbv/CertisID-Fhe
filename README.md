# CertisID - Privacy-Preserving Blockchain Identity Verification

<div align="center">

![CertisID Logo](frontend/public/certisid-logo.svg)

**Decentralized KYC/AML Compliance Platform Powered by Fully Homomorphic Encryption**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-363636?logo=solidity)](https://soliditylang.org/)
[![fhEVM](https://img.shields.io/badge/fhEVM-0.9.1-7C3AED)](https://docs.zama.ai/fhevm)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Network](https://img.shields.io/badge/Network-Sepolia-F6851B)](https://sepolia.etherscan.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Live Demo](https://certisid.vercel.app) | [Documentation](https://certisid.vercel.app/documentation) | [Etherscan](https://sepolia.etherscan.io/address/0x47A7e05cAD7Ab5Df3C09Fe1D97A07ddD80aC721B)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Technical Architecture](#technical-architecture)
- [Smart Contract Design](#smart-contract-design)
- [FHE Technology Deep Dive](#fhe-technology-deep-dive)
- [Contract Deployment](#contract-deployment)
- [Project Structure](#project-structure)
- [Dependencies & Versions](#dependencies--versions)
- [Unit Testing](#unit-testing)
- [Quick Start](#quick-start)
- [Use Cases](#use-cases)
- [Security Model](#security-model)
- [Roadmap](#roadmap)
- [Legal Disclaimer](#legal-disclaimer)
- [License](#license)

---

## Overview

CertisID is a next-generation blockchain identity verification platform that enables **privacy-preserving KYC/AML compliance** using Zama's Fully Homomorphic Encryption (FHE) technology. The platform allows users to prove compliance with identity requirements without exposing their personal data.

### Key Innovation

Traditional identity verification requires exposing sensitive personal information. CertisID revolutionizes this by:

- **Encrypting all identity data** before it reaches the blockchain
- **Performing verification computations on encrypted data** using FHE
- **Revealing only the verification result** (pass/fail), never the underlying data

```
Traditional: User submits age=25 → Server stores plaintext → Checks if age >= 18 → Verified
CertisID:    User submits E(25) → Contract stores ciphertext → FHE.ge(E(age), 18) → Verified
             ↑ encrypted                                        ↑ computation on encrypted data
```

---

## Problem Statement

### The Identity Verification Dilemma

| Challenge | Traditional Solution | CertisID Solution |
|-----------|---------------------|-------------------|
| **Privacy vs. Compliance** | Collect & store plaintext PII | FHE-encrypted data, computations on ciphertext |
| **Data Breach Risk** | Centralized honeypots of personal data | No plaintext data exists on any server |
| **Repeated KYC** | Re-submit documents to each platform | Portable encrypted identity, verify once |
| **Data Control** | Users have no control after submission | Users control access permissions |
| **Audit Trail** | Opaque verification processes | Immutable on-chain verification records |

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                     │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │  React 18 + TS  │  │  Zama FHE SDK    │  │  Wagmi + Privy/Reown   │  │
│  │  (UI/UX)        │  │  (Encryption)     │  │  (Wallet Connection)   │  │
│  └────────┬────────┘  └────────┬─────────┘  └───────────┬────────────┘  │
│           │                    │                        │                │
│           └────────────────────┼────────────────────────┘                │
│                                │                                         │
│                    ┌───────────▼───────────┐                            │
│                    │  Client-Side FHE      │                            │
│                    │  Encryption Engine    │                            │
│                    │  (Browser WASM)       │                            │
│                    └───────────┬───────────┘                            │
└────────────────────────────────┼────────────────────────────────────────┘
                                 │ Encrypted Inputs + ZK Proofs
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      BLOCKCHAIN LAYER (Ethereum Sepolia)                 │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     IdentityRegistry.sol                          │   │
│  │  - Encrypted identity storage (euint8, euint16, euint32)         │   │
│  │  - Verifier role management                                       │   │
│  │  - Contract authorization system                                  │   │
│  └──────────────────────────┬───────────────────────────────────────┘   │
│                              │                                           │
│          ┌───────────────────┼───────────────────┐                      │
│          │                   │                   │                      │
│          ▼                   ▼                   ▼                      │
│  ┌───────────────┐  ┌───────────────┐  ┌────────────────┐              │
│  │ PolicyEngine  │  │ Reputation    │  │ Compliance     │              │
│  │    .sol       │  │ Score.sol     │  │ Verifier.sol   │              │
│  │               │  │               │  │                │              │
│  │ - Policy CRUD │  │ - Score mgmt  │  │ - Attestation  │              │
│  │ - FHE eval    │  │ - Interaction │  │ - Requirement  │              │
│  │ - Conditions  │  │   tracking    │  │   management   │              │
│  └───────────────┘  └───────────────┘  └────────────────┘              │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Zama FHE Coprocessor                          │   │
│  │  - FHE.fromExternal() - Convert external encrypted inputs         │   │
│  │  - FHE.add/sub/mul   - Arithmetic on ciphertexts                 │   │
│  │  - FHE.eq/ge/le      - Comparison on ciphertexts                 │   │
│  │  - FHE.and/or/select - Boolean logic on ciphertexts              │   │
│  │  - FHE.allow/allowThis - Access control for encrypted values     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. User Input           2. Client Encryption      3. On-Chain Storage
   ┌──────────┐            ┌──────────────┐          ┌──────────────┐
   │ age: 30  │  ───────►  │ E(age): 0x.. │  ─────►  │ euint8 age   │
   │ kyc: 2   │  FHE SDK   │ E(kyc): 0x.. │  tx      │ euint8 kyc   │
   │ risk: 25 │            │ proof: 0x..  │          │ euint8 risk  │
   └──────────┘            └──────────────┘          └──────────────┘
                                                            │
4. Policy Evaluation (FHE)                                  │
   ┌────────────────────────────────────────────────────────┘
   │
   ▼
   FHE.ge(E(age), 18)      → E(true)   ─┐
   FHE.ge(E(kyc), 1)       → E(true)    ├─► FHE.and(...) → E(pass)
   FHE.le(E(risk), 50)     → E(true)   ─┘

5. Result                  6. Attestation
   ┌──────────────┐          ┌──────────────────────┐
   │ pass: true   │  ─────►  │ ComplianceAttestation │
   │ (decrypted)  │          │ - requirementId      │
   └──────────────┘          │ - issuedAt/expiresAt │
                             └──────────────────────┘
```

---

## Smart Contract Design

### Contract Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZamaEthereumConfig (fhEVM 0.9.1)             │
│            Base configuration for FHE operations                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │ inherits
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│IdentityRegistry│   │ PolicyEngine  │    │ReputationScore│
│               │◄───│               │    │               │
│ + Ownable     │    │ + Ownable     │    │ + Ownable     │
│ + Reentrancy  │    │ + Reentrancy  │    │ + Reentrancy  │
└───────────────┘    └───────┬───────┘    └───────────────┘
        ▲                    │
        │                    ▼
        │           ┌───────────────┐
        └───────────│ Compliance    │
                    │ Verifier      │
                    │               │
                    │ + Ownable     │
                    │ + Reentrancy  │
                    └───────────────┘
```

### 1. IdentityRegistry.sol

**Purpose**: Central registry for encrypted identity data with role-based access control.

**Encrypted Identity Structure**:
```solidity
struct EncryptedIdentity {
    euint32 fullNameHash;    // Hash of full name (FHE encrypted)
    euint8  age;             // Age derived from DOB (0-255)
    euint32 addressHash;     // Hash of residential address
    euint16 countryCode;     // ISO 3166-1 numeric code
    euint32 passportHash;    // Hash of passport number
    euint8  kycLevel;        // Verification tier (0-5)
    euint8  riskScore;       // AML risk assessment (0-100)
    euint8  verified;        // Verification status (0/1)
    uint64  createdAt;       // Creation timestamp
    uint64  updatedAt;       // Last update timestamp
    bool    exists;          // Identity existence flag
}
```

**Key Functions**:
| Function | Access | Description |
|----------|--------|-------------|
| `submitIdentity(...)` | Public | Submit/update encrypted KYC data with ZK proofs |
| `verifyIdentity(user, kycLevel, riskScore)` | Verifier/Owner | Set verification status and scores |
| `revokeIdentity(user)` | User/Verifier/Owner | Remove identity from registry |
| `authorizeContract(contract, bool)` | User | Grant/revoke contract access to identity |
| `getEncryptedIdentity(user)` | Authorized | Retrieve encrypted identity data |

### 2. PolicyEngine.sol

**Purpose**: Define and evaluate compliance policies using FHE operations.

**Policy Structure**:
```solidity
struct Policy {
    string name;
    uint8  minAge;           // Minimum age requirement
    uint8  maxAge;           // Maximum age (255 = no limit)
    uint8  minKYCLevel;      // Required KYC tier
    uint8  maxRiskScore;     // Maximum acceptable risk
    bool   requireAccredited; // Accreditation requirement
    bool   allowPEP;         // Allow Politically Exposed Persons
    bool   allowSanctioned;  // Allow sanctioned individuals
    uint256 createdAt;
    bool   active;
}
```

**FHE Policy Evaluation Logic**:
```solidity
function evaluatePolicy(uint256 policyId) external {
    // Retrieve encrypted identity data
    (,euint8 age,,,, euint8 kycLevel, euint8 riskScore, euint8 verified) =
        identityRegistry.getEncryptedIdentity(msg.sender);

    Policy storage policy = policies[policyId];

    // Build conditions using FHE operations
    ebool condMinAge   = FHE.ge(age, policy.minAge);
    ebool condMaxAge   = policy.maxAge == 255 ?
                         FHE.asEbool(true) :
                         FHE.le(age, policy.maxAge);
    ebool condKYC      = FHE.ge(kycLevel, policy.minKYCLevel);
    ebool condRisk     = FHE.le(riskScore, policy.maxRiskScore);
    ebool condVerified = FHE.eq(verified, 1);

    // Combine all conditions
    ebool result = FHE.and(condMinAge,
                  FHE.and(condMaxAge,
                  FHE.and(condKYC,
                  FHE.and(condRisk, condVerified))));

    // Store encrypted result
    euint8 passValue = FHE.select(result, FHE.asEuint8(1), FHE.asEuint8(0));
    policyResults[msg.sender][policyId] = PolicyResult({
        encryptedResult: passValue,
        evaluatedAt: uint64(block.timestamp),
        policyId: policyId,
        exists: true
    });

    FHE.allow(passValue, msg.sender);
    FHE.allowThis(passValue);
}
```

### 3. ReputationScore.sol

**Purpose**: Privacy-preserving reputation tracking using encrypted scores.

**Encrypted Reputation Structure**:
```solidity
struct EncryptedReputation {
    euint16 totalScore;        // Combined reputation (0-65535)
    euint16 trustScore;        // Trust component (0-10000)
    euint16 activityScore;     // Activity component (0-10000)
    euint32 totalInteractions; // Interaction counter
    uint64  lastUpdated;
    uint64  createdAt;
    bool    exists;
}
```

**Key Operations**:
- `initializeReputation(user, encryptedScore)`: Create reputation account
- `updateTrustScore(user, encryptedChange)`: Modify trust score (FHE addition)
- `updateActivityScore(user, encryptedChange)`: Modify activity score
- `recordInteraction(user)`: Increment interaction counter (FHE.add with euint32)

### 4. ComplianceVerifier.sol

**Purpose**: Issue and manage compliance attestations based on policy evaluations.

**Attestation Structure**:
```solidity
struct ComplianceAttestation {
    uint256 policyId;
    euint8  complianceStatus;  // Encrypted pass/fail
    uint64  issuedAt;
    uint64  expiresAt;
    bool    isValid;
}

struct ComplianceRequirement {
    string  name;
    bool    requireIdentity;
    bool    requirePolicyPass;
    uint256 requiredPolicyId;
    uint64  validityPeriod;
    bool    active;
}
```

**Attestation Flow**:
```
1. Owner creates ComplianceRequirement
2. User requests attestation for requirement
3. Contract checks: identity exists? policy evaluated?
4. If all checks pass → issue attestation with expiry
5. Third parties can verify: hasValidAttestation(user, requirementId)
```

---

## FHE Technology Deep Dive

### What is Fully Homomorphic Encryption?

FHE enables computations on encrypted data without decryption. The mathematical foundation is based on the **Learning With Errors (LWE)** problem.

```
Homomorphic Property:
  E(a) ⊕ E(b) = E(a + b)    // Addition on ciphertexts
  E(a) ⊗ E(b) = E(a × b)    // Multiplication on ciphertexts
```

### Zama fhEVM 0.9.1 Features

| Feature | Type | Description |
|---------|------|-------------|
| **Encrypted Types** | `euint8`, `euint16`, `euint32`, `euint64`, `euint128`, `euint256`, `ebool` | Encrypted integers and booleans |
| **External Types** | `externalEuint8`, `externalEuint16`, etc. | Input types with ZK proofs |
| **Arithmetic** | `FHE.add`, `FHE.sub`, `FHE.mul`, `FHE.div` | Operations on ciphertexts |
| **Comparison** | `FHE.eq`, `FHE.ne`, `FHE.ge`, `FHE.gt`, `FHE.le`, `FHE.lt` | Encrypted comparisons |
| **Boolean Logic** | `FHE.and`, `FHE.or`, `FHE.not`, `FHE.xor` | Logic on encrypted bools |
| **Conditional** | `FHE.select(cond, a, b)` | Encrypted ternary operator |
| **Conversion** | `FHE.asEuint8(plaintext)`, `FHE.fromExternal(ext, proof)` | Type conversions |
| **Access Control** | `FHE.allow(value, address)`, `FHE.allowThis(value)` | ACL for encrypted values |

### Security Guarantees

| Property | Guarantee |
|----------|-----------|
| **Semantic Security** | Ciphertexts reveal nothing about plaintexts |
| **Computational Security** | Based on LWE hardness (post-quantum secure) |
| **Proof of Encryption** | ZK proofs ensure ciphertext validity |
| **Access Control** | On-chain ACL prevents unauthorized decryption |

---

## Contract Deployment

### Deployed Addresses (Ethereum Sepolia)

| Contract | Address | Etherscan |
|----------|---------|-----------|
| **IdentityRegistry** | `0x47A7e05cAD7Ab5Df3C09Fe1D97A07ddD80aC721B` | [View](https://sepolia.etherscan.io/address/0x47A7e05cAD7Ab5Df3C09Fe1D97A07ddD80aC721B) |
| **PolicyEngine** | `0xbD97B64581e3C8C2818c9e38AE48C8b40712A620` | [View](https://sepolia.etherscan.io/address/0xbD97B64581e3C8C2818c9e38AE48C8b40712A620) |
| **ReputationScore** | `0x1584956133d1466246ae93cEf226b2b56ef4f99e` | [View](https://sepolia.etherscan.io/address/0x1584956133d1466246ae93cEf226b2b56ef4f99e) |
| **ComplianceVerifier** | `0x2E17570Cf42BBAd1a241Be6c1B99b2936D6853c5` | [View](https://sepolia.etherscan.io/address/0x2E17570Cf42BBAd1a241Be6c1B99b2936D6853c5) |

**Deployment Info**:
- **Network**: Ethereum Sepolia Testnet (Chain ID: 11155111)
- **Deployer**: `0x6A35bb1734F8532054Cd56CCaEaff6232DFFa311`
- **Deployed**: December 2024

---

## Project Structure

```
CertisID/
├── contracts/                          # Solidity smart contracts
│   ├── IdentityRegistry.sol           # Core identity storage
│   ├── PolicyEngine.sol               # Policy evaluation engine
│   ├── ReputationScore.sol            # Reputation tracking
│   └── ComplianceVerifier.sol         # Attestation management
│
├── test/                              # Unit tests (fhEVM mock)
│   ├── IdentityRegistry.test.js       # Identity contract tests
│   ├── PolicyEngine.test.js           # Policy evaluation tests
│   ├── ReputationScore.test.js        # Reputation tests
│   └── ComplianceVerifier.test.js     # Compliance tests
│
├── scripts/
│   └── deploy.js                      # Deployment script
│
├── deployments/
│   └── sepolia.json                   # Deployment addresses
│
├── frontend/                          # React frontend
│   ├── src/
│   │   ├── components/                # UI components
│   │   │   ├── KYCForm.tsx           # KYC submission form
│   │   │   └── ui/                    # shadcn/ui components
│   │   │
│   │   ├── lib/
│   │   │   ├── fhe.ts                # FHE SDK wrapper
│   │   │   ├── toast-utils.tsx       # Transaction notifications
│   │   │   └── utils.ts              # Helper functions
│   │   │
│   │   ├── contracts/
│   │   │   └── IdentityRegistry.ts   # Contract ABI + address
│   │   │
│   │   ├── pages/                    # Page components
│   │   └── config/                   # Web3 configuration
│   │
│   ├── index.html                    # Entry point with FHE SDK CDN
│   ├── .env                          # Environment variables
│   └── package.json
│
├── hardhat.config.js                  # Hardhat + fhEVM config
├── package.json                       # Root dependencies
└── README.md
```

---

## Dependencies & Versions

### Smart Contracts

| Package | Version | Purpose |
|---------|---------|---------|
| `@fhevm/solidity` | ^0.9.1 | Zama FHE library for Solidity |
| `@fhevm/hardhat-plugin` | ^0.3.0-1 | Hardhat plugin for fhEVM testing |
| `@openzeppelin/contracts` | ^5.4.0 | Security primitives (Ownable, ReentrancyGuard) |
| `hardhat` | ^2.22.0 | Development framework |
| `@nomicfoundation/hardhat-toolbox` | ^4.0.0 | Testing utilities |
| `dotenv` | ^17.2.3 | Environment configuration |

### Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.3.1 | UI framework |
| `typescript` | ~5.6.2 | Type safety |
| `vite` | ^5.4.10 | Build tool |
| `wagmi` | ^2.14.11 | React hooks for Ethereum |
| `viem` | ^2.21.54 | TypeScript Ethereum library |
| `@reown/appkit` | ^1.6.8 | Wallet connection modal |
| `@privy-io/react-auth` | (optional) | Social login integration |
| `sonner` | ^1.7.1 | Toast notifications |
| `tailwindcss` | ^3.4.14 | Utility-first CSS |
| **Zama FHE SDK** | 0.3.0-5 | Client-side encryption (CDN) |

### FHE SDK Integration

The Zama Relayer SDK is loaded via CDN in `index.html`:
```html
<script
  src="https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs"
  defer
  crossorigin="anonymous"
></script>
```

Required COOP/COEP headers for SharedArrayBuffer:
```html
<meta http-equiv="Cross-Origin-Opener-Policy" content="same-origin" />
<meta http-equiv="Cross-Origin-Embedder-Policy" content="require-corp" />
```

---

## Unit Testing

### Test Framework

Tests use Hardhat with the `@fhevm/hardhat-plugin` for mock FHE operations:

```javascript
const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("IdentityRegistry", function () {
    beforeEach(async function () {
        if (!fhevm.isMock) {
            throw new Error("This test must run in FHEVM mock environment");
        }
        await fhevm.initializeCLIApi();
        // ... deploy contracts
    });

    it("should create identity with encrypted data", async function () {
        const encAge = await fhevm
            .createEncryptedInput(contractAddress, user.address)
            .add8(BigInt(30))
            .encrypt();

        await identityRegistry.connect(user).submitIdentity(
            encFullName.handles[0], encFullName.inputProof,
            encAge.handles[0], encAge.inputProof,
            // ... other encrypted fields
        );

        expect(await identityRegistry.hasIdentity(user.address)).to.be.true;
    });
});
```

### Test Coverage

| Contract | Test File | Test Cases |
|----------|-----------|------------|
| IdentityRegistry | `IdentityRegistry.test.js` | Deployment, Verifier Management, Identity Submission, Verification, Revocation, Contract Authorization, View Functions |
| ReputationScore | `ReputationScore.test.js` | Deployment, Scorer Management, Reputation Initialization, Trust/Activity Score Updates, Interaction Recording |
| ComplianceVerifier | `ComplianceVerifier.test.js` | Deployment, Officer Management, Requirement CRUD, Attestation Requests, Revocation, Expiry Handling |
| PolicyEngine | `PolicyEngine.test.js` | Deployment, Policy Creation, Status Management, FHE Policy Evaluation, Result Claiming |

### Running Tests

```bash
# From project root

# Run all tests
npm run test:all

# Run individual test suites
npm run test:identity      # IdentityRegistry tests
npm run test:reputation    # ReputationScore tests
npm run test:compliance    # ComplianceVerifier tests
npm run test:policy        # PolicyEngine tests
```

---

## Quick Start

### Prerequisites

- Node.js v18+
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH ([faucet](https://sepoliafaucet.com/))

### Installation

```bash
# Clone repository
git clone https://github.com/your-repo/CertisID.git
cd CertisID

# Install root dependencies (contracts)
npm install

# Install frontend dependencies
cd frontend
npm install
```

### Contract Deployment

```bash
# From project root
cd CertisID

# Configure environment
cp .env.example .env
# Edit .env with your PRIVATE_KEY and SEPOLIA_RPC_URL

# Compile contracts
npm run compile

# Deploy to Sepolia
npm run deploy:sepolia
```

### Frontend Development

```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build
```

Visit `http://localhost:5173` to interact with the platform.

---

## Use Cases

### For Individuals
- **Privacy-First KYC**: Submit identity once, encrypted end-to-end
- **Portable Verification**: Reuse attestations across platforms
- **Data Sovereignty**: Control who can verify your credentials

### For DeFi Protocols
- **Compliant Token Sales**: Age/jurisdiction verification without PII exposure
- **Lending Platforms**: Risk scoring without revealing financial details
- **DEX Compliance**: Travel rule adherence with encrypted proofs

### For Enterprises
- **Reduced Liability**: No plaintext PII storage
- **Streamlined Compliance**: Automated policy enforcement
- **Audit Trail**: Immutable verification records

---

## Security Model

### Access Control Layers

| Role | Permissions |
|------|------------|
| **Owner** | Deploy contracts, manage verifiers, create policies |
| **Verifier** | Verify identities, set KYC levels, revoke identities |
| **Compliance Officer** | Issue/revoke attestations |
| **Scorer** | Initialize/update reputation scores |
| **User** | Submit identity, authorize contracts, request attestations |

### Privacy Guarantees

1. **Client-Side Encryption**: Data encrypted in browser before transmission
2. **On-Chain Ciphertext**: Only encrypted data stored on blockchain
3. **Computation Privacy**: Verification runs entirely on encrypted values
4. **Result Privacy**: Only pass/fail revealed, never underlying data

---

## Roadmap

### Phase 1: Foundation (Completed)
- Core smart contracts with fhEVM 0.9.1
- React frontend with wallet integration
- Sepolia testnet deployment
- Comprehensive unit tests

### Phase 2: Production Readiness
- Integration with identity verification providers (Onfido, Jumio)
- Security audits (Trail of Bits, OpenZeppelin)
- Mainnet deployment
- Enterprise API development

### Phase 3: Ecosystem Expansion
- Cross-chain identity bridges (Polygon, Arbitrum, Base)
- Verifiable credentials marketplace
- Developer SDKs (JavaScript, Python, Go)
- Decentralized verifier network

---

## Legal Disclaimer

**IMPORTANT**: This is a **demonstration project** on Ethereum Sepolia testnet.

- **DO NOT** submit real personal information
- No actual identity verification is performed
- Not a licensed identity verification service
- For educational and research purposes only

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with Zama FHE Technology**

*CertisID - Certified by design, verifiable by default.*

[Website](https://certisid.vercel.app) | [Documentation](https://certisid.vercel.app/documentation) | [GitHub](https://github.com/your-repo/CertisID)

</div>
