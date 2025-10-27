const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ComplianceVerifier Contract", function () {
  let complianceVerifier;
  let identityRegistry;
  let policyEngine;
  let owner;
  let auditor;
  let user1;

  beforeEach(async function () {
    [owner, auditor, user1] = await ethers.getSigners();

    // Deploy dependencies
    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await IdentityRegistry.deploy();
    await identityRegistry.waitForDeployment();

    const PolicyEngine = await ethers.getContractFactory("PolicyEngine");
    policyEngine = await PolicyEngine.deploy(await identityRegistry.getAddress());
    await policyEngine.waitForDeployment();

    // Deploy ComplianceVerifier
    const ComplianceVerifier = await ethers.getContractFactory("ComplianceVerifier");
    complianceVerifier = await ComplianceVerifier.deploy(
      await identityRegistry.getAddress(),
      await policyEngine.getAddress()
    );
    await complianceVerifier.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await complianceVerifier.owner()).to.equal(owner.address);
    });

    it("Should set the correct identity registry", async function () {
      expect(await complianceVerifier.identityRegistry()).to.equal(
        await identityRegistry.getAddress()
      );
    });

    it("Should set the correct policy engine", async function () {
      expect(await complianceVerifier.policyEngine()).to.equal(
        await policyEngine.getAddress()
      );
    });

    it("Should initialize with zero total verifications", async function () {
      expect(await complianceVerifier.totalVerifications()).to.equal(0);
    });
  });

  describe("Auditor Management", function () {
    it("Should allow owner to add auditor", async function () {
      await complianceVerifier.addAuditor(auditor.address);
      expect(await complianceVerifier.isAuditor(auditor.address)).to.equal(true);
    });

    it("Should allow owner to remove auditor", async function () {
      await complianceVerifier.addAuditor(auditor.address);
      await complianceVerifier.removeAuditor(auditor.address);
      expect(await complianceVerifier.isAuditor(auditor.address)).to.equal(false);
    });

    it("Should prevent non-owner from adding auditor", async function () {
      await expect(
        complianceVerifier.connect(user1).addAuditor(auditor.address)
      ).to.be.revertedWithCustomError(complianceVerifier, "OwnableUnauthorizedAccount");
    });

    it("Should emit AuditorAdded event", async function () {
      await expect(complianceVerifier.addAuditor(auditor.address))
        .to.emit(complianceVerifier, "AuditorAdded")
        .withArgs(auditor.address);
    });

    it("Should emit AuditorRemoved event", async function () {
      await complianceVerifier.addAuditor(auditor.address);
      await expect(complianceVerifier.removeAuditor(auditor.address))
        .to.emit(complianceVerifier, "AuditorRemoved")
        .withArgs(auditor.address);
    });
  });

  describe("Verification Queries", function () {
    it("Should return total verifications count", async function () {
      const count = await complianceVerifier.totalVerifications();
      expect(count).to.be.a("bigint");
      expect(count).to.equal(0);
    });

    it("Should check compliance status", async function () {
      const isCompliant = await complianceVerifier.isCompliant(user1.address);
      expect(isCompliant).to.be.a("boolean");
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to pause contract", async function () {
      await complianceVerifier.pause();
      expect(await complianceVerifier.paused()).to.equal(true);
    });

    it("Should allow owner to unpause contract", async function () {
      await complianceVerifier.pause();
      await complianceVerifier.unpause();
      expect(await complianceVerifier.paused()).to.equal(false);
    });

    it("Should prevent non-owner from pausing", async function () {
      await expect(
        complianceVerifier.connect(user1).pause()
      ).to.be.revertedWithCustomError(complianceVerifier, "OwnableUnauthorizedAccount");
    });
  });

  describe("Integration", function () {
    it("Should correctly reference identity registry", async function () {
      const registryAddress = await complianceVerifier.identityRegistry();
      expect(registryAddress).to.equal(await identityRegistry.getAddress());
    });

    it("Should correctly reference policy engine", async function () {
      const engineAddress = await complianceVerifier.policyEngine();
      expect(engineAddress).to.equal(await policyEngine.getAddress());
    });

    it("Should maintain state consistency", async function () {
      expect(await complianceVerifier.totalVerifications()).to.equal(0);
      expect(await complianceVerifier.paused()).to.equal(false);
    });
  });

  describe("Multi-Contract Integration", function () {
    it("Should work with multiple auditors", async function () {
      await complianceVerifier.addAuditor(auditor.address);
      await complianceVerifier.addAuditor(user1.address);

      expect(await complianceVerifier.isAuditor(auditor.address)).to.equal(true);
      expect(await complianceVerifier.isAuditor(user1.address)).to.equal(true);
    });

    it("Should handle auditor removal correctly", async function () {
      await complianceVerifier.addAuditor(auditor.address);
      await complianceVerifier.addAuditor(user1.address);
      await complianceVerifier.removeAuditor(auditor.address);

      expect(await complianceVerifier.isAuditor(auditor.address)).to.equal(false);
      expect(await complianceVerifier.isAuditor(user1.address)).to.equal(true);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero address for auditor", async function () {
      await expect(
        complianceVerifier.addAuditor(ethers.ZeroAddress)
      ).to.be.reverted;
    });

    it("Should prevent adding same auditor twice", async function () {
      await complianceVerifier.addAuditor(auditor.address);
      await expect(
        complianceVerifier.addAuditor(auditor.address)
      ).to.be.reverted;
    });

    it("Should handle removing non-existent auditor", async function () {
      await expect(
        complianceVerifier.removeAuditor(auditor.address)
      ).to.be.reverted;
    });
  });
});
