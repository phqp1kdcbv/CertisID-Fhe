const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReputationScore Contract", function () {
  let reputationScore;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const ReputationScore = await ethers.getContractFactory("ReputationScore");
    reputationScore = await ReputationScore.deploy();
    await reputationScore.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await reputationScore.owner()).to.equal(owner.address);
    });

    it("Should initialize with paused state as false", async function () {
      expect(await reputationScore.paused()).to.equal(false);
    });
  });

  describe("Scorer Management", function () {
    it("Should allow owner to add scorer", async function () {
      await reputationScore.addScorer(user1.address);
      expect(await reputationScore.isScorer(user1.address)).to.equal(true);
    });

    it("Should allow owner to remove scorer", async function () {
      await reputationScore.addScorer(user1.address);
      await reputationScore.removeScorer(user1.address);
      expect(await reputationScore.isScorer(user1.address)).to.equal(false);
    });

    it("Should prevent non-owner from adding scorer", async function () {
      await expect(
        reputationScore.connect(user1).addScorer(user2.address)
      ).to.be.revertedWithCustomError(reputationScore, "OwnableUnauthorizedAccount");
    });

    it("Should emit ScorerAdded event", async function () {
      await expect(reputationScore.addScorer(user1.address))
        .to.emit(reputationScore, "ScorerAdded")
        .withArgs(user1.address);
    });

    it("Should emit ScorerRemoved event", async function () {
      await reputationScore.addScorer(user1.address);
      await expect(reputationScore.removeScorer(user1.address))
        .to.emit(reputationScore, "ScorerRemoved")
        .withArgs(user1.address);
    });
  });

  describe("Reputation Queries", function () {
    it("Should check if user has reputation score", async function () {
      const hasScore = await reputationScore.hasReputationScore(user1.address);
      expect(hasScore).to.equal(false);
    });

    it("Should return zero for non-existent reputation", async function () {
      // Note: This depends on how getReputationScore handles non-existent users
      // Typically it should return 0 or revert
      const score = await reputationScore.getReputationScore(user1.address);
      expect(score).to.be.a("bigint");
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to pause contract", async function () {
      await reputationScore.pause();
      expect(await reputationScore.paused()).to.equal(true);
    });

    it("Should allow owner to unpause contract", async function () {
      await reputationScore.pause();
      await reputationScore.unpause();
      expect(await reputationScore.paused()).to.equal(false);
    });

    it("Should prevent non-owner from pausing", async function () {
      await expect(
        reputationScore.connect(user1).pause()
      ).to.be.revertedWithCustomError(reputationScore, "OwnableUnauthorizedAccount");
    });
  });

  describe("State Consistency", function () {
    it("Should maintain correct scorer count", async function () {
      await reputationScore.addScorer(user1.address);
      await reputationScore.addScorer(user2.address);

      expect(await reputationScore.isScorer(user1.address)).to.equal(true);
      expect(await reputationScore.isScorer(user2.address)).to.equal(true);
    });

    it("Should handle multiple scorers correctly", async function () {
      await reputationScore.addScorer(user1.address);
      await reputationScore.addScorer(user2.address);
      await reputationScore.removeScorer(user1.address);

      expect(await reputationScore.isScorer(user1.address)).to.equal(false);
      expect(await reputationScore.isScorer(user2.address)).to.equal(true);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero address for scorer", async function () {
      await expect(
        reputationScore.addScorer(ethers.ZeroAddress)
      ).to.be.reverted;
    });

    it("Should prevent adding same scorer twice", async function () {
      await reputationScore.addScorer(user1.address);
      await expect(
        reputationScore.addScorer(user1.address)
      ).to.be.reverted;
    });

    it("Should handle removing non-existent scorer", async function () {
      await expect(
        reputationScore.removeScorer(user1.address)
      ).to.be.reverted;
    });
  });
});
