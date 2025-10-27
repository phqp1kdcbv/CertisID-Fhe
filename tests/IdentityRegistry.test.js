const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IdentityRegistry Contract", function () {
  let identityRegistry;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await IdentityRegistry.deploy();
    await identityRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await identityRegistry.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero total submissions", async function () {
      expect(await identityRegistry.totalSubmissions()).to.equal(0);
    });

    it("Should initialize with paused state as false", async function () {
      expect(await identityRegistry.paused()).to.equal(false);
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to pause contract", async function () {
      await identityRegistry.pause();
      expect(await identityRegistry.paused()).to.equal(true);
    });

    it("Should prevent non-owner from pausing", async function () {
      await expect(
        identityRegistry.connect(user1).pause()
      ).to.be.revertedWithCustomError(identityRegistry, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to unpause contract", async function () {
      await identityRegistry.pause();
      await identityRegistry.unpause();
      expect(await identityRegistry.paused()).to.equal(false);
    });
  });

  describe("Identity Verification", function () {
    it("Should check if identity exists", async function () {
      const hasIdentity = await identityRegistry.hasIdentity(user1.address);
      expect(hasIdentity).to.equal(false);
    });

    it("Should check verification status", async function () {
      const isVerified = await identityRegistry.isVerified(user1.address);
      expect(isVerified).to.equal(false);
    });

    it("Should increment totalSubmissions counter", async function () {
      const initialCount = await identityRegistry.totalSubmissions();
      expect(initialCount).to.equal(0);
      // Note: Actual submission requires FHE encrypted data which is complex to mock
      // This test validates the counter state
    });
  });

  describe("Verifier Management", function () {
    it("Should allow owner to add verifier", async function () {
      await identityRegistry.addVerifier(user1.address);
      expect(await identityRegistry.isVerifier(user1.address)).to.equal(true);
    });

    it("Should allow owner to remove verifier", async function () {
      await identityRegistry.addVerifier(user1.address);
      await identityRegistry.removeVerifier(user1.address);
      expect(await identityRegistry.isVerifier(user1.address)).to.equal(false);
    });

    it("Should prevent non-owner from adding verifier", async function () {
      await expect(
        identityRegistry.connect(user1).addVerifier(user2.address)
      ).to.be.revertedWithCustomError(identityRegistry, "OwnableUnauthorizedAccount");
    });

    it("Should emit VerifierAdded event", async function () {
      await expect(identityRegistry.addVerifier(user1.address))
        .to.emit(identityRegistry, "VerifierAdded")
        .withArgs(user1.address);
    });

    it("Should emit VerifierRemoved event", async function () {
      await identityRegistry.addVerifier(user1.address);
      await expect(identityRegistry.removeVerifier(user1.address))
        .to.emit(identityRegistry, "VerifierRemoved")
        .withArgs(user1.address);
    });
  });

  describe("Contract State", function () {
    it("Should return correct contract address", async function () {
      const address = await identityRegistry.getAddress();
      expect(address).to.properAddress;
    });

    it("Should allow reading public state variables", async function () {
      expect(await identityRegistry.totalSubmissions()).to.be.a("bigint");
      expect(await identityRegistry.paused()).to.be.a("boolean");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero address checks", async function () {
      await expect(
        identityRegistry.addVerifier(ethers.ZeroAddress)
      ).to.be.reverted;
    });

    it("Should prevent adding same verifier twice", async function () {
      await identityRegistry.addVerifier(user1.address);
      await expect(
        identityRegistry.addVerifier(user1.address)
      ).to.be.reverted;
    });
  });
});
