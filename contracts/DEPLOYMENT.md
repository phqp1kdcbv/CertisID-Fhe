# FHE-KYC Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Requirements
- ✅ Node.js v18+ installed
- ✅ Contracts compiled successfully (`npx hardhat compile`)
- ✅ Frontend built successfully (`npm run build`)

### 2. Funding Requirements
- ⚠️ Need Sepolia testnet ETH (at least 0.05 ETH)
- Get test ETH from faucets:
  - https://sepoliafaucet.com/
  - https://www.alchemy.com/faucets/ethereum-sepolia
  - https://faucet.quicknode.com/ethereum/sepolia

### 3. Account Preparation
- Prepare a MetaMask or other wallet account
- Export private key (for deployment)
- ⚠️ Warning: Do NOT use mainnet accounts! Testnet only!

---

## Quick Deployment Steps

### Step 1: Configure Environment Variables

```bash
cd contracts
cp .env.example .env
```

Edit `.env` file:

```env
# Fill in your private key (without 0x prefix)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Sepolia RPC URL (default configured, or use your own)
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Etherscan API Key (optional, for contract verification)
ETHERSCAN_API_KEY=your_api_key_here
```

### Step 2: Check Account Balance

```bash
npx hardhat run scripts/check-balance.js --network sepolia
```

Ensure account has sufficient ETH (at least 0.05 ETH)

### Step 3: Deploy Contracts

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

**Expected Output:**
```
═══════════════════════════════════════════════════════════════
  FHE-KYC Contract Deployment
═══════════════════════════════════════════════════════════════

Deployment Information:
  Network: sepolia
  Deployer: 0x1234...5678
  Balance: 0.1 ETH

───────────────────────────────────────────────────────────────
Deploying Contracts...
───────────────────────────────────────────────────────────────

Deploying IdentityRegistry...
   ✅ IdentityRegistry deployed to: 0xabcd...1234

Deploying PolicyEngine...
   ✅ PolicyEngine deployed to: 0xefgh...5678

Deploying ReputationScore...
   ✅ ReputationScore deployed to: 0xijkl...9012

Deploying ComplianceVerifier...
   ✅ ComplianceVerifier deployed to: 0xmnop...3456

───────────────────────────────────────────────────────────────
Post-Deployment Configuration...
───────────────────────────────────────────────────────────────

Authorizing PolicyEngine...
   ✅ PolicyEngine authorized

Authorizing ComplianceVerifier...
   ✅ ComplianceVerifier authorized

═══════════════════════════════════════════════════════════════
  Deployment Summary
═══════════════════════════════════════════════════════════════

Contract Addresses:
   IdentityRegistry:      0xabcd...1234
   PolicyEngine:          0xefgh...5678
   ReputationScore:       0xijkl...9012
   ComplianceVerifier:    0xmnop...3456

Deployment saved to: deployments/sepolia.json
Frontend .env updated

✅ Deployment Complete!
```

### Step 4: Verify Deployment

Contract addresses are automatically saved to:
- `deployments/sepolia.json` - Deployment information
- `../frontend/.env` - Frontend environment configuration

Check file contents:
```bash
cat deployments/sepolia.json
cat ../frontend/.env
```

---

## Contract Verification (Optional)

Verify contracts on Etherscan:

```bash
# IdentityRegistry
npx hardhat verify --network sepolia <IDENTITY_REGISTRY_ADDRESS>

# PolicyEngine
npx hardhat verify --network sepolia <POLICY_ENGINE_ADDRESS> <IDENTITY_REGISTRY_ADDRESS>

# ReputationScore
npx hardhat verify --network sepolia <REPUTATION_SCORE_ADDRESS> <IDENTITY_REGISTRY_ADDRESS>

# ComplianceVerifier
npx hardhat verify --network sepolia <COMPLIANCE_VERIFIER_ADDRESS> <IDENTITY_REGISTRY_ADDRESS> <POLICY_ENGINE_ADDRESS>
```

---

## Frontend Configuration

### Step 1: Configure WalletConnect

Edit `frontend/.env`:

```env
# Get your Project ID from https://cloud.walletconnect.com/
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### Step 2: Start Frontend

```bash
cd ../frontend
npm run dev
```

Visit http://localhost:8080

---

## Testing Deployment

### 1. Connect Wallet
- Open frontend application
- Click "Connect Wallet"
- Switch to Sepolia testnet
- Connect your wallet

### 2. Submit KYC Data
- Fill out the form:
  - Full Name: John Doe
  - Date of Birth: 1990-01-01
  - Address: 123 Main St, City, Country
  - Nationality: United States
  - Passport Number: ABC123456

### 3. Verify Transaction
- Click "Encrypt & Submit to Blockchain"
- Confirm wallet transaction
- Wait for transaction confirmation
- Check success message

### 4. View on Block Explorer
Visit Sepolia Etherscan:
```
https://sepolia.etherscan.io/address/<IDENTITY_REGISTRY_ADDRESS>
```

Check:
- ✅ Transaction records
- ✅ IdentityCreated events
- ✅ Encrypted data storage

---

## Deployment Cost Estimation

| Contract | Gas Estimate | Cost (20 Gwei) |
|---------|-------------|----------------|
| IdentityRegistry | ~2,500,000 | ~0.05 ETH |
| PolicyEngine | ~3,000,000 | ~0.06 ETH |
| ReputationScore | ~2,000,000 | ~0.04 ETH |
| ComplianceVerifier | ~2,500,000 | ~0.05 ETH |
| **Total** | **~10,000,000** | **~0.20 ETH** |

**Note:** Actual cost depends on network congestion

---

## Troubleshooting

### Error: Insufficient balance
**Cause:** Account has insufficient ETH
**Solution:** Get more test ETH from faucets

### Error: Private key not found
**Cause:** .env file not properly configured
**Solution:** Check if DEPLOYER_PRIVATE_KEY is correctly filled

### Error: Network not supported
**Cause:** Network configuration error
**Solution:** Check sepolia network configuration in hardhat.config.js

### Error: Contract deployment failed
**Cause:** Compilation error or insufficient Gas
**Solution:**
1. Recompile: `npx hardhat clean && npx hardhat compile`
2. Adjust Gas Price: Modify gasPrice in hardhat.config.js

### Frontend Error: FhevmJS initialization failed
**Cause:** Network configuration or Gateway URL error
**Solution:** Check RPC_URL and GATEWAY_URL in frontend/.env

---

## Post-Deployment Checklist

- [ ] All 4 contracts successfully deployed
- [ ] PolicyEngine and ComplianceVerifier authorized
- [ ] Contract addresses saved to deployments/sepolia.json
- [ ] Frontend .env automatically updated with contract addresses
- [ ] WalletConnect Project ID configured
- [ ] Frontend starts normally
- [ ] Wallet can be connected
- [ ] KYC data can be submitted successfully
- [ ] Transactions visible on Etherscan

---

## Next Steps

1. **Test Functionality**
   - Submit multiple KYC identities
   - Test Policy evaluation
   - Test Reputation scoring
   - Test Compliance verification

2. **Contract Verification**
   - Verify all contracts on Etherscan
   - Add contract descriptions and documentation

3. **Security Audit**
   - Review contract code
   - Test edge cases
   - Check access controls

4. **Performance Optimization**
   - Monitor Gas usage
   - Optimize encryption flow
   - Improve user experience

---

## Support

If you encounter issues, please check:
1. Contract compilation logs
2. Deployment transaction hash
3. Frontend browser console
4. Sepolia Etherscan transaction details

---

**Happy deploying!** 🚀
