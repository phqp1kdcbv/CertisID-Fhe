const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("ReputationScore - FHE Reputation Management Tests", function () {
    let reputationScore;
    let owner, user1, user2, scorer;

    beforeEach(async function () {
        // Ensure we're running in FHEVM mock environment
        if (!fhevm.isMock) {
            throw new Error("This test must run in FHEVM mock environment");
        }

        await fhevm.initializeCLIApi();
        [owner, user1, user2, scorer] = await ethers.getSigners();

        // Deploy ReputationScore
        const ReputationScoreFactory = await ethers.getContractFactory("ReputationScore");
        reputationScore = await ReputationScoreFactory.deploy();
        await reputationScore.waitForDeployment();
    });

    describe("Deployment", function () {
        it("should deploy with correct owner", async function () {
            expect(await reputationScore.owner()).to.equal(owner.address);
        });

        it("should set owner as authorized scorer", async function () {
            expect(await reputationScore.authorizedScorers(owner.address)).to.be.true;
        });

        it("should start with zero reputation accounts", async function () {
            expect(await reputationScore.totalReputationAccounts()).to.equal(0);
        });

        it("should have correct MAX_SCORE_CHANGE constant", async function () {
            expect(await reputationScore.MAX_SCORE_CHANGE()).to.equal(1000);
        });
    });

    describe("Scorer Management", function () {
        it("should allow owner to add scorer", async function () {
            await expect(reputationScore.setScorer(scorer.address, true))
                .to.emit(reputationScore, "ScorerUpdated")
                .withArgs(scorer.address, true);

            expect(await reputationScore.authorizedScorers(scorer.address)).to.be.true;
        });

        it("should allow owner to remove scorer", async function () {
            await reputationScore.setScorer(scorer.address, true);
            await reputationScore.setScorer(scorer.address, false);

            expect(await reputationScore.authorizedScorers(scorer.address)).to.be.false;
        });

        it("should reject non-owner setting scorer", async function () {
            await expect(
                reputationScore.connect(user1).setScorer(scorer.address, true)
            ).to.be.revertedWithCustomError(reputationScore, "OwnableUnauthorizedAccount");
        });
    });

    describe("Reputation Initialization", function () {
        it("should initialize reputation with encrypted score", async function () {
            const contractAddress = await reputationScore.getAddress();
            const initialScore = 5000;

            // Create encrypted input for initial score
            const encScore = await fhevm
                .createEncryptedInput(contractAddress, owner.address)
                .add16(BigInt(initialScore))
                .encrypt();

            await expect(
                reputationScore.connect(owner).initializeReputation(
                    user1.address,
                    encScore.handles[0],
                    encScore.inputProof
                )
            ).to.emit(reputationScore, "ReputationCreated");

            expect(await reputationScore.hasReputation(user1.address)).to.be.true;
            expect(await reputationScore.totalReputationAccounts()).to.equal(1);
        });

        it("should reject duplicate reputation initialization", async function () {
            const contractAddress = await reputationScore.getAddress();

            // First initialization
            const encScore1 = await fhevm
                .createEncryptedInput(contractAddress, owner.address)
                .add16(BigInt(5000))
                .encrypt();

            await reputationScore.connect(owner).initializeReputation(
                user1.address,
                encScore1.handles[0],
                encScore1.inputProof
            );

            // Second initialization should fail
            const encScore2 = await fhevm
                .createEncryptedInput(contractAddress, owner.address)
                .add16(BigInt(6000))
                .encrypt();

            await expect(
                reputationScore.connect(owner).initializeReputation(
                    user1.address,
                    encScore2.handles[0],
                    encScore2.inputProof
                )
            ).to.be.revertedWithCustomError(reputationScore, "ReputationAlreadyExists");
        });

        it("should reject initialization from unauthorized scorer", async function () {
            const contractAddress = await reputationScore.getAddress();

            const encScore = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add16(BigInt(5000))
                .encrypt();

            await expect(
                reputationScore.connect(user1).initializeReputation(
                    user2.address,
                    encScore.handles[0],
                    encScore.inputProof
                )
            ).to.be.revertedWithCustomError(reputationScore, "UnauthorizedScorer");
        });
    });

    describe("Trust Score Updates", function () {
        beforeEach(async function () {
            // Initialize reputation for user1
            const contractAddress = await reputationScore.getAddress();

            const encScore = await fhevm
                .createEncryptedInput(contractAddress, owner.address)
                .add16(BigInt(5000))
                .encrypt();

            await reputationScore.connect(owner).initializeReputation(
                user1.address,
                encScore.handles[0],
                encScore.inputProof
            );

            // Add scorer
            await reputationScore.setScorer(scorer.address, true);
        });

        it("should update trust score with encrypted value", async function () {
            const contractAddress = await reputationScore.getAddress();
            const scoreChange = 500;

            const encChange = await fhevm
                .createEncryptedInput(contractAddress, scorer.address)
                .add16(BigInt(scoreChange))
                .encrypt();

            await expect(
                reputationScore.connect(scorer).updateTrustScore(
                    user1.address,
                    encChange.handles[0],
                    encChange.inputProof
                )
            ).to.emit(reputationScore, "ReputationUpdated");
        });

        it("should reject trust score update for non-existent reputation", async function () {
            const contractAddress = await reputationScore.getAddress();

            const encChange = await fhevm
                .createEncryptedInput(contractAddress, scorer.address)
                .add16(BigInt(500))
                .encrypt();

            await expect(
                reputationScore.connect(scorer).updateTrustScore(
                    user2.address,
                    encChange.handles[0],
                    encChange.inputProof
                )
            ).to.be.revertedWithCustomError(reputationScore, "ReputationNotFound");
        });

        it("should reject trust score update from unauthorized scorer", async function () {
            const contractAddress = await reputationScore.getAddress();

            const encChange = await fhevm
                .createEncryptedInput(contractAddress, user2.address)
                .add16(BigInt(500))
                .encrypt();

            await expect(
                reputationScore.connect(user2).updateTrustScore(
                    user1.address,
                    encChange.handles[0],
                    encChange.inputProof
                )
            ).to.be.revertedWithCustomError(reputationScore, "UnauthorizedScorer");
        });
    });

    describe("Activity Score Updates", function () {
        beforeEach(async function () {
            // Initialize reputation for user1
            const contractAddress = await reputationScore.getAddress();

            const encScore = await fhevm
                .createEncryptedInput(contractAddress, owner.address)
                .add16(BigInt(5000))
                .encrypt();

            await reputationScore.connect(owner).initializeReputation(
                user1.address,
                encScore.handles[0],
                encScore.inputProof
            );

            await reputationScore.setScorer(scorer.address, true);
        });

        it("should update activity score with encrypted value", async function () {
            const contractAddress = await reputationScore.getAddress();
            const scoreChange = 300;

            const encChange = await fhevm
                .createEncryptedInput(contractAddress, scorer.address)
                .add16(BigInt(scoreChange))
                .encrypt();

            await expect(
                reputationScore.connect(scorer).updateActivityScore(
                    user1.address,
                    encChange.handles[0],
                    encChange.inputProof
                )
            ).to.emit(reputationScore, "ReputationUpdated");
        });

        it("should reject activity score update for non-existent reputation", async function () {
            const contractAddress = await reputationScore.getAddress();

            const encChange = await fhevm
                .createEncryptedInput(contractAddress, scorer.address)
                .add16(BigInt(300))
                .encrypt();

            await expect(
                reputationScore.connect(scorer).updateActivityScore(
                    user2.address,
                    encChange.handles[0],
                    encChange.inputProof
                )
            ).to.be.revertedWithCustomError(reputationScore, "ReputationNotFound");
        });
    });

    describe("Interaction Recording", function () {
        beforeEach(async function () {
            // Initialize reputation for user1
            const contractAddress = await reputationScore.getAddress();

            const encScore = await fhevm
                .createEncryptedInput(contractAddress, owner.address)
                .add16(BigInt(5000))
                .encrypt();

            await reputationScore.connect(owner).initializeReputation(
                user1.address,
                encScore.handles[0],
                encScore.inputProof
            );

            await reputationScore.setScorer(scorer.address, true);
        });

        it("should record interaction", async function () {
            await expect(
                reputationScore.connect(scorer).recordInteraction(user1.address)
            ).to.emit(reputationScore, "InteractionRecorded");
        });

        it("should record multiple interactions", async function () {
            await reputationScore.connect(scorer).recordInteraction(user1.address);
            await reputationScore.connect(scorer).recordInteraction(user1.address);
            await reputationScore.connect(scorer).recordInteraction(user1.address);

            // Each call should emit event
        });

        it("should reject interaction recording for non-existent reputation", async function () {
            await expect(
                reputationScore.connect(scorer).recordInteraction(user2.address)
            ).to.be.revertedWithCustomError(reputationScore, "ReputationNotFound");
        });

        it("should reject interaction recording from unauthorized scorer", async function () {
            await expect(
                reputationScore.connect(user2).recordInteraction(user1.address)
            ).to.be.revertedWithCustomError(reputationScore, "UnauthorizedScorer");
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            // Initialize reputation for user1
            const contractAddress = await reputationScore.getAddress();

            const encScore = await fhevm
                .createEncryptedInput(contractAddress, owner.address)
                .add16(BigInt(5000))
                .encrypt();

            await reputationScore.connect(owner).initializeReputation(
                user1.address,
                encScore.handles[0],
                encScore.inputProof
            );
        });

        it("should return correct hasReputation status", async function () {
            expect(await reputationScore.hasReputation(user1.address)).to.be.true;
            expect(await reputationScore.hasReputation(user2.address)).to.be.false;
        });

        it("should return reputation metadata", async function () {
            const [createdAt, lastUpdated] = await reputationScore.getReputationMetadata(user1.address);

            expect(createdAt).to.be.gt(0);
            expect(lastUpdated).to.be.gte(createdAt);
        });

        it("should revert metadata query for non-existent reputation", async function () {
            await expect(
                reputationScore.getReputationMetadata(user2.address)
            ).to.be.revertedWithCustomError(reputationScore, "ReputationNotFound");
        });

        it("should allow user to get own encrypted reputation", async function () {
            // User should be able to get their own encrypted data
            const [totalScore, trustScore, activityScore] = await reputationScore.connect(user1).getEncryptedReputation(user1.address);

            // Just verify the call succeeds (encrypted values can't be directly compared)
            expect(totalScore).to.not.be.undefined;
            expect(trustScore).to.not.be.undefined;
            expect(activityScore).to.not.be.undefined;
        });

        it("should allow authorized scorer to get encrypted reputation", async function () {
            await reputationScore.setScorer(scorer.address, true);

            const [totalScore, trustScore, activityScore] = await reputationScore.connect(scorer).getEncryptedReputation(user1.address);

            expect(totalScore).to.not.be.undefined;
        });

        it("should reject unauthorized access to encrypted reputation", async function () {
            await expect(
                reputationScore.connect(user2).getEncryptedReputation(user1.address)
            ).to.be.revertedWithCustomError(reputationScore, "UnauthorizedScorer");
        });
    });

    describe("Combined Operations", function () {
        it("should handle full reputation lifecycle", async function () {
            const contractAddress = await reputationScore.getAddress();

            // 1. Initialize reputation
            const encScore = await fhevm
                .createEncryptedInput(contractAddress, owner.address)
                .add16(BigInt(5000))
                .encrypt();

            await reputationScore.connect(owner).initializeReputation(
                user1.address,
                encScore.handles[0],
                encScore.inputProof
            );

            expect(await reputationScore.hasReputation(user1.address)).to.be.true;

            // 2. Update trust score
            const encTrustChange = await fhevm
                .createEncryptedInput(contractAddress, owner.address)
                .add16(BigInt(500))
                .encrypt();

            await reputationScore.connect(owner).updateTrustScore(
                user1.address,
                encTrustChange.handles[0],
                encTrustChange.inputProof
            );

            // 3. Update activity score
            const encActivityChange = await fhevm
                .createEncryptedInput(contractAddress, owner.address)
                .add16(BigInt(300))
                .encrypt();

            await reputationScore.connect(owner).updateActivityScore(
                user1.address,
                encActivityChange.handles[0],
                encActivityChange.inputProof
            );

            // 4. Record interactions
            await reputationScore.connect(owner).recordInteraction(user1.address);
            await reputationScore.connect(owner).recordInteraction(user1.address);

            // 5. Verify metadata was updated
            const [createdAt, lastUpdated] = await reputationScore.getReputationMetadata(user1.address);
            expect(lastUpdated).to.be.gte(createdAt);
        });
    });
});
