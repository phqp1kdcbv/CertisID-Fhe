# 🚀 Quick Deployment Reference

## Three Steps to Deploy

### 1. Configure .env
```bash
cp .env.example .env
# Edit .env and fill in your private key
```

### 2. Check Balance
```bash
npx hardhat run scripts/check-balance.js --network sepolia
```

### 3. Deploy Contracts
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## Or Use One-Click Script
```bash
./scripts/quick-start.sh
```

## Get Test ETH
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

## Full Documentation
See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions
