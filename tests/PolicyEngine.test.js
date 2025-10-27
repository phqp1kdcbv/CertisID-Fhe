const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PolicyEngine Contract", function () {
  let policyEngine;
  let identityRegistry;
  let owner;
  let policyAdmin;
  let user1;

  beforeEach(async function () {
    [owner, policyAdmin, user1] = await ethers.getSigners();

    // Deploy IdentityRegistry first
    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await IdentityRegistry.deploy();
    await identityRegistry.waitForDeployment();

    // Deploy PolicyEngine
    const PolicyEngine = await ethers.getContractFactory("PolicyEngine");
    policyEngine = await PolicyEngine.deploy(await identityRegistry.getAddress());
    await policyEngine.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await policyEngine.owner()).to.equal(owner.address);
    });

    it("Should set the correct identity registry address", async function () {
      expect(await policyEngine.identityRegistry()).to.equal(
        await identityRegistry.getAddress()
      );
    });

    it("Should initialize with zero policies", async function () {
      expect(await policyEngine.totalPolicies()).to.equal(0);
    });
  });

  describe("Policy Management", function () {
    it("Should allow owner to add policy admin", async function () {
      await policyEngine.addPolicyAdmin(policyAdmin.address);
      expect(await policyEngine.isPolicyAdmin(policyAdmin.address)).to.equal(true);
    });

    it("Should allow owner to remove policy admin", async function () {
      await policyEngine.addPolicyAdmin(policyAdmin.address);
      await policyEngine.removePolicyAdmin(policyAdmin.address);
      expect(await policyEngine.isPolicyAdmin(policyAdmin.address)).to.equal(false);
    });

    it("Should prevent non-owner from adding policy admin", async function () {
      await expect(
        policyEngine.connect(user1).addPolicyAdmin(policyAdmin.address)
      ).to.be.revertedWithCustomError(policyEngine, "OwnableUnauthorizedAccount");
    });

    it("Should emit PolicyAdminAdded event", async function () {
      await expect(policyEngine.addPolicyAdmin(policyAdmin.address))
        .to.emit(policyEngine, "PolicyAdminAdded")
        .withArgs(policyAdmin.address);
    });

    it("Should emit PolicyAdminRemoved event", async function () {
      await policyEngine.addPolicyAdmin(policyAdmin.address);
      await expect(policyEngine.removePolicyAdmin(policyAdmin.address))
        .to.emit(policyEngine, "PolicyAdminRemoved")
        .withArgs(policyAdmin.address);
    });
  });

  describe("Policy Queries", function () {
    it("Should check if policy exists", async function () {
      const exists = await policyEngine.policyExists(1);
      expect(exists).to.equal(false);
    });

    it("Should return total policies count", async function () {
      const count = await policyEngine.totalPolicies();
      expect(count).to.be.a("bigint");
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to pause contract", async function () {
      await policyEngine.pause();
      expect(await policyEngine.paused()).to.equal(true);
    });

    it("Should allow owner to unpause contract", async function () {
      await policyEngine.pause();
      await policyEngine.unpause();
      expect(await policyEngine.paused()).to.equal(false);
    });

    it("Should prevent non-owner from pausing", async function () {
      await expect(
        policyEngine.connect(user1).pause()
      ).to.be.revertedWithCustomError(policyEngine, "OwnableUnauthorizedAccount");
    });
  });

  describe("Integration", function () {
    it("Should correctly reference identity registry", async function () {
      const registryAddress = await policyEngine.identityRegistry();
      expect(registryAddress).to.equal(await identityRegistry.getAddress());
    });

    it("Should maintain state consistency", async function () {
      expect(await policyEngine.totalPolicies()).to.equal(0);
      expect(await policyEngine.paused()).to.equal(false);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero address for policy admin", async function () {
      await expect(
        policyEngine.addPolicyAdmin(ethers.ZeroAddress)
      ).to.be.reverted;
    });

    it("Should prevent adding same admin twice", async function () {
      await policyEngine.addPolicyAdmin(policyAdmin.address);
      await expect(
        policyEngine.addPolicyAdmin(policyAdmin.address)
      ).to.be.reverted;
    });
  });
});
