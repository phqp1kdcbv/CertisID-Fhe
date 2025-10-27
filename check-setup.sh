#!/bin/bash

# FHE-KYC Environment Check Script
# Verifies that everything is ready for deployment

echo "═══════════════════════════════════════════════════════════════"
echo "  FHE-KYC Environment Check"
echo "═══════════════════════════════════════════════════════════════"
echo ""

ERRORS=0
WARNINGS=0

# Check if we're in the right directory
if [ ! -f "DEPLOYMENT-GUIDE.md" ]; then
    echo "❌ Error: Please run this script from the fhe-kyc root directory"
    exit 1
fi

echo "✅ Correct directory"
echo ""

# Check contracts .env
echo "📋 Checking Contracts Configuration..."
echo "─────────────────────────────────────────────────────────────────"
if [ -f "contracts/.env" ]; then
    echo "✅ contracts/.env exists"

    # Check if private key is set
    if grep -q "DEPLOYER_PRIVATE_KEY=your_private_key" contracts/.env; then
        echo "❌ Private key not configured in contracts/.env"
        ERRORS=$((ERRORS + 1))
    else
        echo "✅ Private key configured"
    fi

    # Check if RPC URL is set
    if grep -q "SEPOLIA_RPC_URL=" contracts/.env; then
        echo "✅ RPC URL configured"
    else
        echo "⚠️  RPC URL not set"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "❌ contracts/.env not found"
    echo "   Run: cp contracts/.env.example contracts/.env"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check frontend .env
echo "📋 Checking Frontend Configuration..."
echo "─────────────────────────────────────────────────────────────────"
if [ -f "frontend/.env" ]; then
    echo "✅ frontend/.env exists"

    # Check chain ID
    if grep -q "VITE_CHAIN_ID=11155111" frontend/.env; then
        echo "✅ Sepolia chain ID configured"
    else
        echo "⚠️  Chain ID not set to Sepolia (11155111)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "❌ frontend/.env not found"
    echo "   Run: cp frontend/.env.example frontend/.env"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check Node.js version
echo "📋 Checking Node.js..."
echo "─────────────────────────────────────────────────────────────────"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js installed: $NODE_VERSION"

    # Check if version is >= 18
    MAJOR_VERSION=$(echo $NODE_VERSION | sed 's/v\([0-9]*\).*/\1/')
    if [ "$MAJOR_VERSION" -ge 18 ]; then
        echo "✅ Node.js version is sufficient (>= 18)"
    else
        echo "⚠️  Node.js version should be >= 18"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "❌ Node.js not installed"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check npm
echo "📋 Checking npm..."
echo "─────────────────────────────────────────────────────────────────"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm installed: v$NPM_VERSION"
else
    echo "❌ npm not installed"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check contract dependencies
echo "📋 Checking Contract Dependencies..."
echo "─────────────────────────────────────────────────────────────────"
if [ -d "contracts/node_modules" ]; then
    echo "✅ Contract dependencies installed"
else
    echo "⚠️  Contract dependencies not installed"
    echo "   Run: cd contracts && npm install"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check frontend dependencies
echo "📋 Checking Frontend Dependencies..."
echo "─────────────────────────────────────────────────────────────────"
if [ -d "frontend/node_modules" ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "⚠️  Frontend dependencies not installed"
    echo "   Run: cd frontend && npm install"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check FHE SDK fixes
echo "📋 Checking FHE SDK Integration..."
echo "─────────────────────────────────────────────────────────────────"
if grep -q "relayer-sdk-js/0.3.0" frontend/index.html; then
    echo "✅ FHE SDK CDN script present"
else
    echo "❌ FHE SDK CDN script missing from frontend/index.html"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "initializeFHE" frontend/src/lib/fhe.ts; then
    echo "✅ FHE initialization function updated"
else
    echo "❌ FHE SDK not updated to new API"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════════"
echo "  Check Summary"
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ All checks passed! You're ready to deploy."
    echo ""
    echo "🚀 To deploy, run:"
    echo "   ./deploy.sh"
    echo ""
    echo "   OR manually:"
    echo "   cd contracts && npm run deploy:sepolia"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  $WARNINGS warning(s) found, but you can proceed"
    echo ""
    echo "🚀 To deploy, run:"
    echo "   ./deploy.sh"
    exit 0
else
    echo "❌ $ERRORS error(s) found. Please fix them before deploying."
    echo "⚠️  $WARNINGS warning(s) found."
    echo ""
    echo "📚 See DEPLOYMENT-GUIDE.md for help"
    exit 1
fi
