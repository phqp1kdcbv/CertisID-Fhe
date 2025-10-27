# FHE-KYC Quick Start

## ✅ Environment Status: READY

All fixes applied and environment configured!

---

## 🚀 3-Step Deployment

### 1️⃣ Check Setup (Optional)
```bash
./check-setup.sh
```

### 2️⃣ Get Sepolia ETH
Visit: https://sepoliafaucet.com/

Get at least **0.05 ETH** to your deployer wallet.

### 3️⃣ Deploy Everything
```bash
./deploy.sh
```

That's it! The script will:
- ✅ Deploy all 4 smart contracts
- ✅ Configure contract permissions
- ✅ Update frontend .env automatically
- ✅ Install frontend dependencies

---

## 🎯 After Deployment

Start the frontend:
```bash
cd frontend
npm run dev
```

Open: **http://localhost:5173**

---

## 📋 What's Been Fixed

✅ **FHE SDK Integration**
- Added CDN script to index.html
- Rewrote fhe.ts with new API
- Updated encryption return format
- Fixed contract call parameters

✅ **Environment Configuration**
- Created contracts/.env with your private key
- Created frontend/.env with network config
- Both files ready for deployment

✅ **Dependencies**
- Removed deprecated `fhevmjs`
- Removed unnecessary `@zama-fhe/oracle-solidity`
- Updated OpenZeppelin to 5.4.0
- All dependencies installed

---

## 📁 Files Created

```
fhe-kyc/
├── contracts/.env              ✅ Your private key
├── frontend/.env               ✅ Network config
├── DEPLOYMENT-GUIDE.md         📚 Full deployment guide
├── FIX-SUMMARY.md             📋 What was fixed
├── QUICK-START.md             ⚡ This file
├── deploy.sh                  🚀 Auto-deploy script
└── check-setup.sh             ✅ Environment check
```

---

## 🔧 Manual Deployment

If you prefer manual steps:

### Step 1: Deploy Contracts
```bash
cd contracts
npm run deploy:sepolia
```

### Step 2: Start Frontend
```bash
cd ../frontend
npm install
npm run dev
```

---

## 📊 Contract Addresses

After deployment, addresses will be saved in:
- `contracts/deployments/sepolia.json`
- `frontend/.env` (automatically updated)

You can find them by running:
```bash
cat contracts/deployments/sepolia.json
```

---

## 🧪 Testing the App

1. **Open** http://localhost:5173
2. **Connect** wallet (MetaMask/RainbowKit)
3. **Switch** to Sepolia network
4. **Fill** KYC form with test data:
   - Full Name: "John Doe"
   - Date of Birth: Any valid date
   - Nationality: Select any country
   - Address: "123 Main St, City, Country"
   - Passport: "ABC123456"
5. **Submit** and wait for confirmation

---

## 🎯 Expected Behavior

### ✅ What Should Work:
- FHE SDK loads from CDN
- Wallet connection via RainbowKit
- FHE encryption of form data
- Transaction submission to Sepolia
- On-chain encrypted data storage
- No console errors

### ❌ Common Issues:

**"Insufficient funds"**
→ Get more Sepolia ETH

**"Transaction failed"**
→ Check you're on Sepolia network

**"FHE SDK not loaded"**
→ Hard refresh browser (Cmd+Shift+R)

---

## 📚 Documentation

- **Full Guide**: [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)
- **Fix Details**: [FIX-SUMMARY.md](./FIX-SUMMARY.md)
- **Analysis Report**: [fhe-kyc-analysis-report.md](../fhe-kyc-analysis-report.md)

---

## 🔐 Security Reminders

- ✅ `.env` files are in `.gitignore`
- ✅ Never commit private keys
- ✅ Contract addresses are public (safe to share)
- ✅ Use different keys for testnet/mainnet

---

## 💡 Quick Commands

**Check environment**:
```bash
./check-setup.sh
```

**Deploy everything**:
```bash
./deploy.sh
```

**View contract addresses**:
```bash
cat contracts/deployments/sepolia.json
```

**Start dev server**:
```bash
cd frontend && npm run dev
```

**Build for production**:
```bash
cd frontend && npm run build
```

---

## 🎉 You're Ready!

Everything is configured and ready to deploy.

Just run:
```bash
./deploy.sh
```

---

**Need Help?** Check [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)
