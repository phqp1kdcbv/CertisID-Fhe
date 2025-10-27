#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "  FHE-KYC Quick Start Setup"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "✅ .env created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your DEPLOYER_PRIVATE_KEY"
    echo "   Run: nano .env"
    echo ""
    exit 1
fi

# Check if private key is configured
if grep -q "your_private_key_here" .env; then
    echo "❌ Private key not configured!"
    echo "   Please edit .env and set DEPLOYER_PRIVATE_KEY"
    echo "   Run: nano .env"
    echo ""
    exit 1
fi

echo "✅ Configuration found"
echo ""

# Check balance
echo "🔍 Checking account balance..."
npx hardhat run scripts/check-balance.js --network sepolia
echo ""

read -p "Continue with deployment? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "🚀 Starting deployment..."
echo ""

npx hardhat run scripts/deploy.js --network sepolia

if [ $? -eq 0 ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  ✅ Deployment Complete!"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "Next steps:"
    echo "1. cd ../frontend"
    echo "2. Edit .env and add VITE_WALLETCONNECT_PROJECT_ID"
    echo "3. npm run dev"
    echo ""
else
    echo ""
    echo "❌ Deployment failed"
    echo "Check the error messages above"
    exit 1
fi
