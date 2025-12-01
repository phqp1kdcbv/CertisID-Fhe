const hre = require("hardhat");

async function main() {
  console.log("\n🔍 Checking Deployer Account...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceETH = hre.ethers.formatEther(balance);
  
  console.log("Balance:", balanceETH, "ETH");
  console.log("Network:", hre.network.name);

  const minRequired = hre.ethers.parseEther("0.05");
  
  if (balance < minRequired) {
    console.log("\n❌ Insufficient balance!");
    console.log("Required: 0.05 ETH");
    console.log("Need:", hre.ethers.formatEther(minRequired - balance), "more ETH");
    console.log("\nGet Sepolia ETH from:");
    console.log("- https://sepoliafaucet.com/");
    console.log("- https://www.alchemy.com/faucets/ethereum-sepolia");
  } else {
    console.log("\n✅ Balance sufficient for deployment!");
  }
  console.log("");
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
