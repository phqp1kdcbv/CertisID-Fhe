# FHE Private KYC & Reputation Platform - Frontend

A privacy-preserving identity verification and reputation platform using Fully Homomorphic Encryption (FHE) with Zama's fhEVM technology.

## 🚀 Features

- **Private KYC Verification**: Encrypted identity verification without data exposure
- **Qualification Gating**: Access control based on encrypted credentials
- **Reputation Scoring**: Private reputation accumulation and verification
- **Compliance Reporting**: Regulatory compliance without privacy compromise
- **Cross-platform Identity**: Portable encrypted identity across services
- **Policy Evaluation**: Dynamic policy checks on encrypted data
- **Attestation System**: Verifiable compliance proofs

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **UI Components**: Shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Web3**: Wagmi v2 + Viem + RainbowKit
- **Encryption**: Zama relayer SDK (`relayer-sdk-js` 0.2.0)
- **Network**: Ethereum Sepolia Testnet

## 📋 Prerequisites

- Node.js v18+ and npm
- Deployed smart contracts on Sepolia (see `../contracts/`)
- WalletConnect Project ID (for RainbowKit)

## 🔧 Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables
# Edit .env with your contract addresses
```

## ⚙️ Environment Configuration

Create a `.env` file with the following variables:

```env
# Contract Addresses (auto-generated after deployment)
VITE_IDENTITY_REGISTRY_ADDRESS=0x...
VITE_POLICY_ENGINE_ADDRESS=0x...
VITE_REPUTATION_SCORE_ADDRESS=0x...
VITE_COMPLIANCE_VERIFIER_ADDRESS=0x...

# Network Configuration
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_GATEWAY_URL=https://gateway.sepolia.zama.ai

# Wallet Integration
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
```

**Note**: The `.env` file is automatically generated after deploying contracts via the deployment script.

## 🚀 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:5173`

## 📦 Project Structure

```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Navigation.tsx  # Main navigation
│   │   ├── IdentityCard.tsx
│   │   ├── PolicyCard.tsx
│   │   └── ui/             # Shadcn UI components
│   ├── pages/              # Application pages
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   ├── identity/       # Identity management
│   │   ├── policies/       # Policy evaluation
│   │   ├── reputation/     # Reputation scoring
│   │   └── compliance/     # Compliance verification
│   ├── hooks/              # Custom React hooks
│   │   ├── useContracts.ts # Contract interaction
│   │   ├── useIdentity.ts  # Identity management
│   │   ├── usePolicy.ts    # Policy evaluation
│   │   └── useFHE.ts       # FHE encryption
│   ├── utils/              # Utility functions
│   │   ├── contracts.ts    # Contract utilities
│   │   ├── fhe.ts          # FHE encryption helpers
│   │   └── formatters.ts   # Data formatters
│   ├── contracts/          # Contract ABIs (auto-copied)
│   │   ├── IdentityRegistry.json
│   │   ├── PolicyEngine.json
│   │   ├── ReputationScore.json
│   │   └── ComplianceVerifier.json
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── .env                    # Environment variables (generated)
├── package.json
└── vite.config.ts
```

## 🎨 Design System

The application follows modern Web3 design principles:

- **Colors**: High contrast neutral tones with accent colors
- **Typography**: System fonts for optimal readability
- **Components**: Clean, accessible interfaces
- **Layout**: Responsive card-based design
- **Dark Mode**: Full dark mode support

## 🔐 FHE Integration

### Encryption Flow

1. **User Input**: Enter sensitive data (age, country, risk score, etc.)
2. **FHE Encryption**: Data encrypted using Zama relayer SDK before blockchain submission
3. **On-Chain Storage**: Encrypted values stored as `euint8`, `euint16`, `euint32`
4. **Privacy Preserved**: Data remains encrypted throughout entire lifecycle

### Encrypted Data Types

- `euint8`: Age, KYC level, risk score, boolean flags
- `euint16`: Country code, reputation scores
- `euint32`: Document hashes, interaction counts

## 📱 Key Features

### Identity Management
- Submit encrypted identity data
- Update identity information
- Revoke identity
- View encrypted identity status

### Policy Evaluation
- Create custom verification policies
- Evaluate encrypted credentials against policies
- Claim policy results with decryption
- View policy history

### Reputation System
- Initialize reputation profiles
- Update trust and activity scores
- Record encrypted interactions
- View reputation metrics

### Compliance Verification
- Request compliance attestations
- Create compliance requirements
- Verify attestation validity
- Revoke attestations

## 🔗 Smart Contract Integration

The frontend interacts with four main contracts:

1. **IdentityRegistry**: Identity storage and management
2. **PolicyEngine**: Dynamic policy evaluation
3. **ReputationScore**: Reputation tracking
4. **ComplianceVerifier**: Attestation management

All contract addresses must be configured in `.env` before running the application.

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables

When deploying, ensure all environment variables from `.env` are configured in your hosting platform.

## 🧪 Testing

```bash
# Run tests (if configured)
npm test

# Run linter
npm run lint
```

## 📝 Development Workflow

1. **Deploy Contracts**: Deploy smart contracts to Sepolia (see `../contracts/`)
2. **Configure Environment**: `.env` is auto-generated with contract addresses
3. **Install Dependencies**: `npm install`
4. **Start Development**: `npm run dev`
5. **Connect Wallet**: Use Sepolia testnet
6. **Test Features**: Submit identity, evaluate policies, check reputation

## 🆘 Troubleshooting

### Issue: "Contract addresses not configured"
**Solution**: Ensure contracts are deployed and `.env` has valid addresses

### Issue: "Wallet connection failed"
**Solution**: Check that you're on Sepolia network and have test ETH

### Issue: "FHE encryption error"
**Solution**: Verify the relayer SDK is properly initialized and network is accessible

### Issue: "Transaction failed"
**Solution**: Ensure you have sufficient Sepolia ETH for gas fees

## 🔒 Security Notes

- Never commit `.env` file to version control
- Use test accounts only for Sepolia testnet
- Verify contract addresses before transactions
- Keep WalletConnect Project ID secure

## 📚 Resources

- [Zama fhEVM Documentation](https://docs.zama.ai/fhevm)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [Wagmi Documentation](https://wagmi.sh/)
- [React Documentation](https://react.dev/)

## 🤝 Contributing

1. Follow existing code style
2. Use TypeScript for type safety
3. Write accessible components
4. Test on Sepolia before submitting

## 📄 License

MIT License - See LICENSE file for details

---

Built with ❤️ using Zama FHE technology
