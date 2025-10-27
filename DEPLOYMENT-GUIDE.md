# FHE-KYC Deployment Guide

## 📋 Prerequisites Checklist

- [x] ✅ Environment files created (`.env` in both contracts/ and frontend/)
- [x] ✅ Private key configured in `contracts/.env`
- [x] ✅ FHE SDK fixes applied
- [ ] ⚠️ Sepolia ETH in deployer wallet (at least 0.05 ETH)

---

## 🚀 Quick Start Deployment

### Step 1: Get Sepolia ETH

Your deployer address will be displayed when you run the deployment script. Get Sepolia ETH from these faucets:

- **Sepolia Faucet**: https://sepoliafaucet.com/
- **Alchemy Faucet**: https://www.alchemy.com/faucets/ethereum-sepolia
- **QuickNode Faucet**: https://faucet.quicknode.com/ethereum/sepolia

Recommended: Get **0.05 ETH** to ensure smooth deployment.

---

### Step 2: Deploy Smart Contracts

```bash
cd contracts
npm run deploy:sepolia
```

**What happens**:
1. ✅ Validates deployer balance (minimum 0.01 ETH)
2. ✅ Deploys 4 contracts:
   - IdentityRegistry
   - PolicyEngine
   - ReputationScore
   - ComplianceVerifier
3. ✅ Configures contract permissions
4. ✅ Saves deployment info to `deployments/sepolia.json`
5. ✅ **Automatically updates** `frontend/.env` with contract addresses

**Expected Output**:
```
═══════════════════════════════════════════════════════════════
  FHE-KYC Contract Deployment
═══════════════════════════════════════════════════════════════

📋 Deployment Information:
  Network: sepolia
  Deployer: 0x...
  Balance: 0.05 ETH

📦 Deploying IdentityRegistry...
   ✅ IdentityRegistry deployed to: 0x...

📦 Deploying PolicyEngine...
   ✅ PolicyEngine deployed to: 0x...

📦 Deploying ReputationScore...
   ✅ ReputationScore deployed to: 0x...

📦 Deploying ComplianceVerifier...
   ✅ ComplianceVerifier deployed to: 0x...

🔗 Authorizing PolicyEngine...
   ✅ PolicyEngine authorized

🔗 Authorizing ComplianceVerifier...
   ✅ ComplianceVerifier authorized

═══════════════════════════════════════════════════════════════
  Deployment Summary
═══════════════════════════════════════════════════════════════

📄 Contract Addresses:
   IdentityRegistry:      0x...
   PolicyEngine:          0x...
   ReputationScore:       0x...
   ComplianceVerifier:    0x...

💾 Deployment saved to: deployments/sepolia.json
🔄 Frontend .env updated

✅ Deployment Complete!
```

---

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

### Step 4: Start Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:5173**

---

## 🔧 Configuration Files

### 1. `/contracts/.env`
```env
DEPLOYER_PRIVATE_KEY=a4f1e93c9e8b6a7c3d2f5e9b4d8a1c6e7b3f9d5a2c8e4b6d1a7c3e5f8b2d4a6c
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
ETHERSCAN_API_KEY=
```

**Status**: ✅ Already configured with your private key

---

### 2. `/frontend/.env`
```env
# These will be auto-filled after deployment ✅
VITE_IDENTITY_REGISTRY_ADDRESS=0x...
VITE_POLICY_ENGINE_ADDRESS=0x...
VITE_REPUTATION_SCORE_ADDRESS=0x...
VITE_COMPLIANCE_VERIFIER_ADDRESS=0x...

# Network config (already set)
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_GATEWAY_URL=https://gateway.sepolia.zama.ai

# Optional WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=
```

**Status**: ✅ Created, will be updated after contract deployment

---

## 📝 Deployment Checklist

### Before Deployment
- [x] ✅ Fix FHE SDK integration (completed)
- [x] ✅ Create `.env` files (completed)
- [x] ✅ Configure private key (completed)
- [ ] ⚠️ Get Sepolia ETH (0.05 ETH recommended)
- [ ] ⚠️ Verify RPC URL is working

### During Deployment
- [ ] Run `npm run deploy:sepolia` in contracts/
- [ ] Wait for all 4 contracts to deploy
- [ ] Verify contract authorization completes
- [ ] Check `deployments/sepolia.json` is created
- [ ] Verify `frontend/.env` is updated

### After Deployment
- [ ] Run `npm install` in frontend/
- [ ] Run `npm run dev`
- [ ] Open http://localhost:5173
- [ ] Connect wallet to Sepolia
- [ ] Test KYC form submission

---

## 🛠️ Troubleshooting

### Issue: "Insufficient balance"
**Solution**: Get more Sepolia ETH from faucets (need at least 0.01 ETH, recommended 0.05 ETH)

### Issue: "Network connection failed"
**Solution**: Try alternative RPC URL in `.env`:
```env
SEPOLIA_RPC_URL=https://rpc.ankr.com/eth_sepolia
```

### Issue: "Transaction reverted"
**Solution**:
1. Check gas price is not too high
2. Verify deployer account has sufficient ETH
3. Check Sepolia network is not congested

### Issue: "Frontend can't connect to contracts"
**Solution**:
1. Verify `frontend/.env` has correct addresses
2. Restart dev server: `npm run dev`
3. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)

---

## 📊 Gas Estimation

Estimated gas costs for full deployment:

| Contract | Estimated Gas | ~Cost (at 10 gwei) |
|----------|---------------|---------------------|
| IdentityRegistry | ~2,500,000 | ~0.025 ETH |
| PolicyEngine | ~1,800,000 | ~0.018 ETH |
| ReputationScore | ~1,600,000 | ~0.016 ETH |
| ComplianceVerifier | ~2,000,000 | ~0.020 ETH |
| Authorization (x2) | ~100,000 | ~0.001 ETH |
| **Total** | **~8,000,000** | **~0.08 ETH** |

**Recommendation**: Have at least **0.1 ETH** in Sepolia to be safe.

---

## 🔍 Verify Deployment

After deployment, you can verify contracts on Sepolia Etherscan:

### Option 1: Manual Verification
Visit: https://sepolia.etherscan.io/address/{CONTRACT_ADDRESS}

### Option 2: Automated Verification (if you have Etherscan API key)
```bash
npx hardhat verify --network sepolia {CONTRACT_ADDRESS}
```

---

## 📁 Deployment Artifacts

After successful deployment, you'll have:

```
contracts/
├── .env                        ✅ Your private key
├── deployments/
│   └── sepolia.json           ✅ Deployment info
└── artifacts/                 ✅ Compiled contracts

frontend/
├── .env                        ✅ Contract addresses (auto-updated)
└── node_modules/              ✅ Dependencies
```

---

## 🚀 Production Deployment

### Vercel Frontend Deployment

1. **Build frontend**:
```bash
cd frontend
npm run build
```

2. **Deploy to Vercel**:
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Deploy
vercel --prod
```

3. **Set environment variables in Vercel**:
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all `VITE_*` variables from `.env`

---

## 🔐 Security Notes

### ⚠️ IMPORTANT
- **NEVER** commit `.env` files to Git
- **NEVER** share your private key
- `.env` files are in `.gitignore` by default
- Contract addresses are public and safe to share

### Best Practices
- Use different private keys for testnet and mainnet
- Keep at least 0.1 ETH in deployer wallet for gas
- Monitor contract transactions on Etherscan
- Regularly backup deployment files

---

## 📚 Additional Resources

- **Zama FHE Documentation**: https://docs.zama.ai/fhevm
- **Sepolia Faucets**: https://sepoliafaucet.com/
- **Hardhat Documentation**: https://hardhat.org/
- **RainbowKit Docs**: https://www.rainbowkit.com/

---

## ✅ Next Steps After Deployment

1. Test KYC submission with test data
2. Verify encrypted data storage on-chain
3. Test reputation scoring functionality
4. Test policy compliance checks
5. Deploy to production (Vercel)

---

**Deployment Ready!** 🎉

Run these commands to deploy:
```bash
cd contracts && npm run deploy:sepolia
cd ../frontend && npm install && npm run dev
```
