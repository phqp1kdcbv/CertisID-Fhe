const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  FHE-KYC Contract Deployment");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;

  console.log("📋 Deployment Information:");
  console.log("  Network:", network);
  console.log("  Deployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("  Balance:", hre.ethers.formatEther(balance), "ETH");

  if (balance < hre.ethers.parseEther("0.01")) {
    console.error("\n❌ Error: Insufficient balance. Need at least 0.01 ETH for deployment.");
    console.log("   Get Sepolia ETH from:");
    console.log("   - https://sepoliafaucet.com/");
    console.log("   - https://www.alchemy.com/faucets/ethereum-sepolia");
    process.exit(1);
  }

  console.log("\n" + "─".repeat(67));
  console.log("Deploying Contracts...");
  console.log("─".repeat(67) + "\n");

  // Deploy IdentityRegistry
  console.log("📦 Deploying IdentityRegistry...");
  const IdentityRegistry = await hre.ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  const identityRegistryAddress = await identityRegistry.getAddress();
  console.log("   ✅ IdentityRegistry deployed to:", identityRegistryAddress);

  // Deploy PolicyEngine
  console.log("\n📦 Deploying PolicyEngine...");
  const PolicyEngine = await hre.ethers.getContractFactory("PolicyEngine");
  const policyEngine = await PolicyEngine.deploy(identityRegistryAddress);
  await policyEngine.waitForDeployment();
  const policyEngineAddress = await policyEngine.getAddress();
  console.log("   ✅ PolicyEngine deployed to:", policyEngineAddress);

  // Deploy ReputationScore
  console.log("\n📦 Deploying ReputationScore...");
  const ReputationScore = await hre.ethers.getContractFactory("ReputationScore");
  const reputationScore = await ReputationScore.deploy();
  await reputationScore.waitForDeployment();
  const reputationScoreAddress = await reputationScore.getAddress();
  console.log("   ✅ ReputationScore deployed to:", reputationScoreAddress);

  // Deploy ComplianceVerifier
  console.log("\n📦 Deploying ComplianceVerifier...");
  const ComplianceVerifier = await hre.ethers.getContractFactory("ComplianceVerifier");
  const complianceVerifier = await ComplianceVerifier.deploy(identityRegistryAddress, policyEngineAddress);
  await complianceVerifier.waitForDeployment();
  const complianceVerifierAddress = await complianceVerifier.getAddress();
  console.log("   ✅ ComplianceVerifier deployed to:", complianceVerifierAddress);

  console.log("\n" + "─".repeat(67));
  console.log("Post-Deployment Configuration...");
  console.log("─".repeat(67) + "\n");

  // Authorize PolicyEngine
  console.log("🔗 Authorizing PolicyEngine...");
  const tx1 = await identityRegistry.setVerifier(policyEngineAddress, true);
  await tx1.wait();
  console.log("   ✅ PolicyEngine authorized");

  // Authorize ComplianceVerifier
  console.log("🔗 Authorizing ComplianceVerifier...");
  const tx2 = await identityRegistry.setVerifier(complianceVerifierAddress, true);
  await tx2.wait();
  console.log("   ✅ ComplianceVerifier authorized");

  console.log("\n" + "═".repeat(67));
  console.log("  Deployment Summary");
  console.log("═".repeat(67) + "\n");

  const deploymentInfo = {
    network: network,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      IdentityRegistry: identityRegistryAddress,
      PolicyEngine: policyEngineAddress,
      ReputationScore: reputationScoreAddress,
      ComplianceVerifier: complianceVerifierAddress,
    }
  };

  console.log("📄 Contract Addresses:");
  console.log("   IdentityRegistry:     ", identityRegistryAddress);
  console.log("   PolicyEngine:         ", policyEngineAddress);
  console.log("   ReputationScore:      ", reputationScoreAddress);
  console.log("   ComplianceVerifier:   ", complianceVerifierAddress);

  // Save deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${network}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment saved to:", deploymentFile);

  // Update frontend .env
  const frontendEnvPath = path.join(__dirname, "..", "..", "frontend", ".env");
  let envContent = "";

  const envExamplePath = path.join(__dirname, "..", "..", "frontend", ".env.example");
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, "utf8");
  }

  envContent = envContent.replace(/VITE_IDENTITY_REGISTRY_ADDRESS=.*/, `VITE_IDENTITY_REGISTRY_ADDRESS=${identityRegistryAddress}`);
  envContent = envContent.replace(/VITE_POLICY_ENGINE_ADDRESS=.*/, `VITE_POLICY_ENGINE_ADDRESS=${policyEngineAddress}`);
  envContent = envContent.replace(/VITE_REPUTATION_SCORE_ADDRESS=.*/, `VITE_REPUTATION_SCORE_ADDRESS=${reputationScoreAddress}`);
  envContent = envContent.replace(/VITE_COMPLIANCE_VERIFIER_ADDRESS=.*/, `VITE_COMPLIANCE_VERIFIER_ADDRESS=${complianceVerifierAddress}`);

  fs.writeFileSync(frontendEnvPath, envContent);
  console.log("🔄 Frontend .env updated");

  console.log("\n" + "═".repeat(67));
  console.log("  Next Steps");
  console.log("═".repeat(67) + "\n");
  console.log("1️⃣  cd ../frontend && npm run dev");
  console.log("2️⃣  Connect wallet to Sepolia");
  console.log("3️⃣  Submit KYC data");
  console.log("\n✅ Deployment Complete!\n");
}

main().then(() => process.exit(0)).catch((error) => {
  console.error("\n❌ Deployment Failed:", error);
  process.exit(1);
});
