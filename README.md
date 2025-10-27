# FHE Private KYC & Reputation Platform

## Overview
A privacy-preserving identity verification and reputation platform using fully homomorphic encryption to enable compliant KYC/AML checks, qualification gating, and reputation scoring without exposing personal information.

## Core Features
- **Private KYC Verification**: Encrypted identity verification without data exposure
- **Qualification Gating**: Access control based on encrypted credentials
- **Reputation Scoring**: Private reputation accumulation and verification
- **Compliance Reporting**: Regulatory compliance without privacy compromise
- **Cross-platform Identity**: Portable encrypted identity across services

## Technology Stack
- **Smart Contracts**: Solidity with Zama fhEVM
- **Frontend**: React 18 with Ant Design 5.x
- **State Management**: Redux Toolkit
- **Web3 Integration**: Ethers.js v6
- **Identity Standards**: DID, Verifiable Credentials
- **Testing**: Hardhat, Jest, React Testing Library

## Project Status
- Phase: Prototype
- Current Sprint: Contract + basic frontend scaffolding

## Quick Start
```bash
# Contracts
cd contracts && npm install
npm run compile
export SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/1d4b7fd7fa354aeca092b2420b0cf09f"
export DEPLOYER_PRIVATE_KEY="<your_private_key>"
npm run deploy:sepolia

# Frontend
cd ../frontend && npm install
VITE_KYC_CONTRACT_ADDRESS=0x... VITE_FHE_RPC_URL="https://sepolia.infura.io/v3/1d4b7fd7fa354aeca092b2420b0cf09f" npm run dev
```

## What’s Encrypted (FHE)
- age (euint8), country (euint16), riskScore (euint16), kycLevel (euint8)
- pep, sanctioned, accredited as 0/1 (euint8)

## On-chain Policy (Encrypted Computation)
- age≥18 ∧ ¬sanctioned ∧ risk≤600 ∧ (accredited ∨ level≥2)
- The check runs entirely over encrypted state using FHE ops (ge/le/eq/and/or/cmux)
- Result is stored encrypted; user reveals plaintext 0/1 later, verified with FHE.eq

## Files
- contracts/src/FHEKYC.sol: FHE-enabled identity + policy checks
- contracts/scripts/deploy.js: Hardhat deploy script
- frontend/src/App.tsx: Minimal UI to submit, compute, claim
- frontend/src/lib/fhe.ts: Encryption placeholders — wire up @zama-fhe/relayer-sdk here

## Next Steps
- Replace frontend encryption placeholders with real @zama-fhe/relayer-sdk calls
- Add more checks (jurisdiction gating, min tiers, cooldowns)
- Optional: issue non-transferable NFT/SBT on successful proof
- Add tests for encrypted comparisons and claim flow


## Team Requirements
- 2 Solidity Engineers (FHE/Identity expertise)
- 2 Frontend Engineers (React/Web3)
- 1 UI/UX Designer
- 1 Compliance Officer
- 1 QA Engineer

## Documentation
- [Architecture Overview](./docs/architecture.md)
- [Development Plan](./docs/development-plan.md)
- [API Specification](./docs/api-specification.md)
