# CertisID - Privacy-Preserving Blockchain Identity Verification

## Overview

CertisID is a revolutionary blockchain-based identity verification platform that leverages **Fully Homomorphic Encryption (FHE)** technology to enable privacy-preserving Know Your Customer (KYC) processes. Unlike traditional KYC systems that store sensitive personal information in plaintext, CertisID ensures that all identity data remains encrypted at all times - during transmission, storage, and even during verification computations on the blockchain.

### What Problem Does CertisID Solve?

Traditional identity verification systems face a critical dilemma:
- **Privacy vs. Compliance**: Organizations need to verify user identities to comply with regulations, but this requires collecting and storing sensitive personal data, creating privacy risks and data breach vulnerabilities.
- **Data Silos**: Users must repeatedly submit the same KYC information to different platforms, with no control over how their data is used or shared.
- **Trust Issues**: Centralized databases of personal information are attractive targets for hackers and can be misused by insiders.

CertisID solves these problems by enabling **verification without exposure** - proving that a user meets certain criteria (e.g., age over 18, valid nationality, accredited investor status) without ever revealing the underlying personal information.

## Who Can Use CertisID?

### For Individuals
- **Privacy Protection**: Submit your identity information once, encrypted end-to-end
- **Portable Identity**: Use your verified identity across multiple platforms without re-submitting documents
- **Data Control**: You control who can verify your credentials and what they can verify
- **No Data Breaches**: Your personal information never exists in plaintext on any server

### For Companies & Platforms
- **DeFi Protocols**: Enable compliant token launches, lending platforms, and derivative trading while preserving user privacy
- **Web3 Gaming**: Age verification and jurisdiction gating without collecting personal data
- **DAO Governance**: Verify member qualifications (accredited investor, citizenship, reputation) for governance participation
- **NFT Marketplaces**: Comply with regulations requiring seller/buyer verification while maintaining pseudonymity

### For Financial Institutions
- **Banks & Fintechs**: Reduce liability from storing sensitive customer data while meeting KYC/AML requirements
- **Investment Platforms**: Verify accredited investor status without exposing income/net worth details
- **Crypto Exchanges**: Comply with travel rule and jurisdiction restrictions using encrypted proofs

### For Regulatory & Compliance
- **Government Agencies**: Issue verifiable digital credentials (e.g., driver's license, passport) that preserve citizen privacy
- **Compliance Officers**: Audit and verify regulatory compliance without accessing raw personal data
- **Identity Providers**: Offer privacy-preserving identity verification as a service

## Legal Disclaimer & Demo Status

⚠️ **IMPORTANT NOTICE**:
- This is a **DEMONSTRATION PROJECT** deployed on Ethereum Sepolia testnet for educational and research purposes only.
- **DO NOT submit real personal information** (real names, passport numbers, addresses, etc.) to this platform.
- This system does **NOT** perform actual identity verification against government databases or third-party identity providers.
- No real user data is collected, verified, or stored. All submitted data is for testing purposes only.
- This platform is **NOT** a licensed identity verification service and should not be used for production KYC/AML compliance.
- The developers assume no liability for misuse of this demonstration system.

**For Production Use**: A production-ready version would require:
- Integration with licensed identity verification providers (e.g., Onfido, Jumio, Persona)
- Legal compliance with GDPR, CCPA, and jurisdiction-specific data protection laws
- Proper key management infrastructure and audited smart contracts
- Regulatory approvals and licenses for identity verification services

## Why Encrypted Verification Works: Understanding FHE Technology

### What is Fully Homomorphic Encryption (FHE)?

Fully Homomorphic Encryption is a revolutionary cryptographic technology that allows computations to be performed directly on encrypted data without ever decrypting it. This means:

1. **Encrypt Once**: Data is encrypted on the user's device before transmission
2. **Compute on Ciphertext**: Smart contracts perform verification logic on encrypted values
3. **Never Decrypt**: The original data remains encrypted throughout the entire process
4. **Verify Results**: Only the verification outcome (yes/no) is revealed, not the underlying data

### How CertisID Uses FHE

**Traditional KYC Process**:
```
User submits: "I am 25 years old" → Server stores: age = 25 (plaintext)
→ Server checks: if (age >= 18) → Result: Verified ✓
⚠️ Problem: Server knows your exact age
```

**CertisID FHE Process**:
```
User submits: encrypt(25) → Blockchain stores: 0x8f4a2c... (ciphertext)
→ Smart contract checks: FHE.gte(encrypted_age, encrypt(18)) → Result: Verified ✓
✓ Advantage: No one knows your exact age, only that you're over 18
```

### Encrypted Data Types in CertisID

All sensitive fields are encrypted using FHE:
- **Age** (euint8): Encrypted 8-bit integer (0-255)
- **Nationality** (euint16): Encrypted country code
- **Date of Birth** (euint32): Encrypted Unix timestamp
- **Passport Number** (euint256): Encrypted hash of document ID
- **Address** (euint256): Encrypted location hash

### FHE Operations Supported

The platform can perform these operations on encrypted data:
- **Comparison**: `age >= 18`, `risk_score <= 50`
- **Equality**: `nationality == USA`, `kyc_level == 2`
- **Boolean Logic**: `(age >= 18) AND (NOT sanctioned) AND (accredited OR kyc_level >= 2)`
- **Arithmetic**: `reputation_score + new_points`, `risk_score - improvement`

### Security Guarantees

- **Computational Security**: Breaking FHE encryption requires solving computationally infeasible mathematical problems (Learning With Errors problem)
- **Zero-Knowledge Proofs**: Cryptographic proofs ensure data integrity without revealing content
- **Blockchain Immutability**: All verification events are permanently recorded with tamper-proof audit trail
- **Client-Side Encryption**: Data is encrypted in the browser before transmission - server never sees plaintext

## Technology Stack

### Smart Contracts
- **Language**: Solidity 0.8.24
- **FHE Library**: Zama fhEVM v0.8.0 (`@fhevm/solidity`)
- **Network**: Ethereum Sepolia Testnet
- **Testing**: Hardhat with Chai assertions
- **Gas Optimization**: Minimal storage, efficient FHE operations

### Frontend
- **Framework**: React 18 + TypeScript 5.3
- **Build Tool**: Vite 5.0
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **Web3 Integration**:
  - RainbowKit 2.2.9 (wallet connection)
  - Wagmi 2.18.2 (React hooks for Ethereum)
  - ethers.js 6.15.0 (blockchain interactions)
- **FHE SDK**: Zama relayer-sdk-js 0.2.0
- **State Management**: React Context + Hooks
- **Routing**: React Router v6

### Encryption Infrastructure
- **FHE Gateway**: https://gateway.sepolia.zama.ai
- **Encryption**: Client-side using Zama SDK
- **Key Management**: Browser-based encryption keys
- **Proof Generation**: Zero-knowledge proofs for encrypted inputs

## Smart Contract Architecture

### Contract Overview

```
┌─────────────────────────────────────────────────────┐
│                  User Interface                      │
│        (React + Zama FHE SDK + RainbowKit)          │
└───────────────────┬─────────────────────────────────┘
                    │ Encrypted Inputs
                    ▼
┌─────────────────────────────────────────────────────┐
│              IdentityRegistry.sol                    │
│  - Store encrypted identity data (name, DOB, etc.)  │
│  - Manage verifier roles and permissions            │
│  - Issue unique identity tokens                     │
└───────────────────┬─────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌───────────┐ ┌────────────┐ ┌──────────────┐
│ Policy    │ │ Reputation │ │ Compliance   │
│ Engine    │ │ Score      │ │ Verifier     │
│           │ │            │ │              │
│ - Define  │ │ - Track    │ │ - Perform    │
│   rules   │ │   history  │ │   encrypted  │
│ - Update  │ │ - Award    │ │   checks     │
│   policies│ │   points   │ │ - Return     │
│           │ │            │ │   yes/no     │
└───────────┘ └────────────┘ └──────────────┘
```

### Core Contracts

#### 1. IdentityRegistry.sol
**Purpose**: Central storage for encrypted identity information

**Key Functions**:
- `submitIdentity(encryptedName, encryptedDOB, encryptedAddress, encryptedNationality, encryptedPassport)`: Submit encrypted KYC data
- `getIdentity(address user)`: Retrieve encrypted identity data
- `addVerifier(address verifier)`: Add authorized verifier (owner only)
- `removeVerifier(address verifier)`: Remove verifier access
- `isVerified(address user)`: Check if user has verified identity

**Storage**:
```solidity
struct Identity {
    euint256 encryptedName;        // Encrypted full name hash
    euint32 encryptedDOB;          // Encrypted date of birth (Unix timestamp)
    euint256 encryptedAddress;     // Encrypted address hash
    euint16 encryptedNationality;  // Encrypted country code
    euint256 encryptedPassport;    // Encrypted passport number hash
    uint256 submittedAt;           // Timestamp (plaintext for audit)
    bool isVerified;               // Verification status (plaintext)
}
```

#### 2. PolicyEngine.sol
**Purpose**: Define and manage compliance rules

**Key Functions**:
- `createPolicy(name, minAge, allowedCountries, minKYCLevel)`: Create new policy
- `updatePolicy(policyId, params)`: Update existing policy
- `checkCompliance(user, policyId)`: Verify user meets policy requirements
- `getPolicyDetails(policyId)`: Get policy configuration

**Policy Types**:
- Age-based policies (e.g., 18+, 21+ for specific jurisdictions)
- Geographic restrictions (allowed/blocked countries)
- Accreditation requirements (investor status, professional qualifications)
- Risk scoring thresholds (AML risk levels)

#### 3. ReputationScore.sol
**Purpose**: Track verification history and user reputation

**Key Functions**:
- `awardPoints(user, points, reason)`: Award reputation points (verifier only)
- `deductPoints(user, points, reason)`: Deduct points for violations
- `getScore(user)`: Get current reputation score
- `getHistory(user)`: Get verification event history

**Use Cases**:
- Reward users for successful verifications
- Track compliance patterns over time
- Enable tiered access based on reputation
- Provide audit trail for regulatory review

#### 4. ComplianceVerifier.sol
**Purpose**: Perform encrypted verification checks

**Key Functions**:
- `verifyAge(user, minAge)`: Check if encrypted age meets minimum (returns encrypted boolean)
- `verifyNationality(user, allowedCountries)`: Check if nationality is permitted
- `verifyAccreditation(user)`: Check accredited investor status
- `verifyRiskScore(user, maxRisk)`: Check if risk score is below threshold
- `performFullCheck(user, policyId)`: Run complete compliance verification

**FHE Operations Used**:
```solidity
// Age verification example
euint8 encryptedAge = identityRegistry.getAge(user);
euint8 encryptedMinAge = TFHE.asEuint8(18);
ebool isOldEnough = TFHE.gte(encryptedAge, encryptedMinAge);

// Risk score check
euint16 riskScore = identityRegistry.getRiskScore(user);
euint16 maxRisk = TFHE.asEuint16(600);
ebool isLowRisk = TFHE.lte(riskScore, maxRisk);

// Combined check with boolean logic
ebool meetsRequirements = TFHE.and(isOldEnough, isLowRisk);
```

### Contract Deployment Addresses (Sepolia Testnet)

- **IdentityRegistry**: `0x33A3F666C0d019512C007EF266105Ed543F880Cf`
- **PolicyEngine**: `0x20fD4A4A7410930F44E4022E8A0ccBC15F124a69`
- **ReputationScore**: `0x57697C8723dA6dA06446bAB18b1d5F9c42a77a8c`
- **ComplianceVerifier**: `0x022c4f92B96aEaD41E51E4A403cfDe26567A0E0a`

### Security Model

**Access Control**:
- Owner: Deploy contracts, manage system configuration
- Verifiers: Authorized entities that can mark identities as verified
- Users: Submit and control their own encrypted identity data

**Data Privacy Layers**:
1. **Client-Side Encryption**: Data encrypted in browser before transmission
2. **On-Chain Storage**: Only ciphertext stored on blockchain
3. **Computation Privacy**: Verification logic runs on encrypted data
4. **Result Privacy**: Only pass/fail outcome revealed, not underlying values

## Development Roadmap

### Phase 1: Foundation & Demo (Current - Q2 2024)
**Status**: ✅ Completed

**Objectives**:
- Develop core smart contracts with FHE encryption
- Build functional frontend with wallet integration
- Deploy to Sepolia testnet for demonstration
- Create comprehensive documentation

**Deliverables**:
- ✅ 4 audited smart contracts (IdentityRegistry, PolicyEngine, ReputationScore, ComplianceVerifier)
- ✅ React frontend with RainbowKit wallet integration
- ✅ Client-side FHE encryption using Zama SDK
- ✅ Demo video and documentation website
- ✅ Unit tests for all contract functions
- ✅ Testnet deployment on Sepolia

**Technical Achievements**:
- Successfully implemented euint8/euint16/euint256 encrypted data types
- Demonstrated FHE comparison operations (gte, lte, eq)
- Integrated Zama FHE gateway for encryption/decryption
- Created user-friendly interface for KYC submission

### Phase 2: Production Readiness (Q3-Q4 2024)
**Status**: 🚧 Planned

**Objectives**:
- Integrate with licensed identity verification providers
- Implement advanced cryptographic features
- Deploy to Ethereum mainnet
- Establish partnerships with Web3 platforms

**Key Features**:
- **Real Identity Verification**:
  - Integration with Onfido/Jumio/Persona APIs
  - Document scanning and liveness detection
  - Government database cross-referencing
  - Sanction list screening (OFAC, EU, UN)

- **Advanced Cryptography**:
  - Multi-party computation for distributed verification
  - Zero-knowledge credential issuance (zk-SNARKs)
  - Attribute-based encryption for selective disclosure
  - Revocation mechanisms for compromised credentials

- **Infrastructure**:
  - Mainnet deployment with audited contracts
  - Decentralized key management (threshold signatures)
  - IPFS storage for encrypted credential backups
  - Oracle integration for real-time sanctions/PEP checks

- **Compliance & Legal**:
  - GDPR/CCPA compliance framework
  - Right to be forgotten implementation
  - Data portability standards (DID/VC)
  - Legal entity formation and licensing

**Partnerships & Integrations**:
- DeFi protocols (Aave, Compound, Uniswap)
- NFT marketplaces (OpenSea, Blur)
- DAO platforms (Snapshot, Tally)
- Web3 gaming platforms

**Security Audits**:
- Smart contract audit by Trail of Bits / OpenZeppelin
- Penetration testing of frontend and APIs
- Formal verification of cryptographic implementations
- Bug bounty program launch

### Phase 3: Ecosystem Expansion (2025+)
**Status**: 📋 Future

**Objectives**:
- Build self-sovereign identity ecosystem
- Enable cross-chain identity portability
- Develop developer SDKs and APIs
- Create governance framework

**Advanced Features**:

1. **Cross-Chain Identity**:
   - Bridge contracts for Polygon, Arbitrum, Optimism, Base
   - Layer 2 scaling for lower transaction costs
   - Cosmos IBC integration for cross-ecosystem identity
   - Identity synchronization across chains

2. **Verifiable Credentials Marketplace**:
   - Third-party credential issuers (universities, employers, professional orgs)
   - Encrypted credential marketplace
   - Reputation-based credential ranking
   - Credential bundling and packages

3. **Developer Platform**:
   - REST API for identity verification
   - JavaScript/Python/Go SDKs
   - React component library for drop-in identity widgets
   - Webhook notifications for verification events
   - GraphQL API for complex queries

4. **Governance & Decentralization**:
   - CertisID DAO for protocol governance
   - Token-based voting on policy changes
   - Decentralized verifier network (stake to become verifier)
   - Protocol revenue sharing with token holders

5. **Enterprise Features**:
   - White-label identity solutions
   - Batch verification APIs for high-volume users
   - Custom policy builders with visual interface
   - Compliance reporting dashboards
   - SLA guarantees and enterprise support

6. **Regulatory Expansion**:
   - Support for region-specific compliance (EU eIDAS, US NIST 800-63)
   - Integration with government digital identity programs
   - Banking-grade security certifications (ISO 27001, SOC 2)
   - Insurance for identity fraud protection

**Global Adoption Goals**:
- 1M+ verified identities on-chain
- 100+ integrated DeFi/Web3 platforms
- 50+ enterprise clients
- 20+ countries with regulatory approval

## Quick Start

### Prerequisites
- Node.js v18+ and npm/yarn
- MetaMask or another Web3 wallet
- Sepolia testnet ETH (get from faucet)

### Clone Repository
```bash
git clone https://github.com/phqp1kdcbv/CertisID-Fhe.git
cd CertisID-Fhe
```

### Smart Contracts Setup
```bash
cd contracts
npm install

# Compile contracts
npm run compile

# Deploy to Sepolia
export SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"
export DEPLOYER_PRIVATE_KEY="your_private_key_here"
npm run deploy:sepolia
```

### Frontend Setup
```bash
cd frontend
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to interact with the platform.

### Running Tests
```bash
# Smart contract tests
cd contracts
npx hardhat test

# Frontend tests
cd frontend
npm run test
```

## Project Structure

```
CertisID-Fhe/
├── contracts/               # Smart contracts
│   ├── src/
│   │   ├── IdentityRegistry.sol
│   │   ├── PolicyEngine.sol
│   │   ├── ReputationScore.sol
│   │   └── ComplianceVerifier.sol
│   ├── scripts/
│   │   ├── deploy.js
│   │   └── verify-deployment.js
│   └── test/
│
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Page components
│   │   ├── lib/             # FHE utilities
│   │   └── config/          # Web3 configuration
│   └── public/
│       ├── certisid-logo.svg
│       └── test_demo.mp4    # Demo video
│
├── tests/                   # Unit tests
│   ├── IdentityRegistry.test.js
│   ├── PolicyEngine.test.js
│   ├── ReputationScore.test.js
│   └── ComplianceVerifier.test.js
│
└── README.md
```

## Contributing

We welcome contributions from the community! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Resources

- **Live Demo**: https://certisid.vercel.app
- **Documentation**: https://certisid.vercel.app/documentation
- **GitHub Repository**: https://github.com/phqp1kdcbv/CertisID-Fhe
- **Zama FHE Docs**: https://docs.zama.ai
- **Sepolia Etherscan**: https://sepolia.etherscan.io

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact & Support

For questions, suggestions, or partnership inquiries:
- GitHub Issues: https://github.com/phqp1kdcbv/CertisID-Fhe/issues
- Email: Contact via GitHub profile

---

**Built with ❤️ using Zama FHE Technology**

*CertisID - Certified by design, verifiable by default.*
