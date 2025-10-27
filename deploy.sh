#!/bin/bash

# FHE-KYC Quick Deployment Script
# This script automates the entire deployment process

set -e  # Exit on error

echo "═══════════════════════════════════════════════════════════════"
echo "  FHE-KYC Quick Deployment Script"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if we're in the right directory
if [ ! -f "DEPLOYMENT-GUIDE.md" ]; then
    echo "❌ Error: Please run this script from the fhe-kyc root directory"
    exit 1
fi

# Step 1: Deploy contracts
echo "📋 Step 1: Deploying Smart Contracts..."
echo "─────────────────────────────────────────────────────────────────"
cd contracts

if [ ! -f ".env" ]; then
    echo "❌ Error: contracts/.env file not found!"
    echo "   Please create it from .env.example and add your private key"
    exit 1
fi

echo "🔨 Installing contract dependencies..."
npm install --silent

echo "🚀 Deploying contracts to Sepolia..."
npm run deploy:sepolia

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Contract deployment failed!"
    echo "   Common issues:"
    echo "   - Insufficient Sepolia ETH (need at least 0.05 ETH)"
    echo "   - Invalid private key in .env"
    echo "   - Network connection issues"
    echo ""
    echo "   Get Sepolia ETH from: https://sepoliafaucet.com/"
    exit 1
fi

cd ..

echo ""
echo "✅ Contracts deployed successfully!"
echo ""

# Step 2: Setup frontend
echo "📋 Step 2: Setting Up Frontend..."
echo "─────────────────────────────────────────────────────────────────"
cd frontend

echo "📦 Installing frontend dependencies..."
npm install --silent

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ Deployment Complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📄 Deployment artifacts saved to: contracts/deployments/sepolia.json"
echo "🔄 Frontend .env updated with contract addresses"
echo ""
echo "🚀 Next Steps:"
echo "   1. cd frontend"
echo "   2. npm run dev"
echo "   3. Open http://localhost:5173"
echo "   4. Connect wallet to Sepolia"
echo "   5. Submit KYC data"
echo ""
echo "📚 Full guide: DEPLOYMENT-GUIDE.md"
echo ""
