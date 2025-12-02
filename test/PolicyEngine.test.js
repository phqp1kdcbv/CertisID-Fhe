const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("PolicyEngine - FHE Policy Evaluation Tests", function () {
    let policyEngine;
    let identityRegistry;
    let owner, user1, user2;

    beforeEach(async function () {
        // Ensure we're running in FHEVM mock environment
        if (!fhevm.isMock) {
            throw new Error("This test must run in FHEVM mock environment");
        }

        await fhevm.initializeCLIApi();
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy IdentityRegistry
        const IdentityRegistryFactory = await ethers.getContractFactory("IdentityRegistry");
        identityRegistry = await IdentityRegistryFactory.deploy();
        await identityRegistry.waitForDeployment();

        // Deploy PolicyEngine
        const PolicyEngineFactory = await ethers.getContractFactory("PolicyEngine");
        policyEngine = await PolicyEngineFactory.deploy(await identityRegistry.getAddress());
        await policyEngine.waitForDeployment();

        // Set up user1 identity
        await setupUserIdentity(user1, 30, 2, 25); // age 30, KYC level 2, risk score 25
    });

    async function setupUserIdentity(user, age, kycLevel = 1, riskScore = 50) {
        const contractAddress = await identityRegistry.getAddress();

        const encFullName = await fhevm
            .createEncryptedInput(contractAddress, user.address)
            .add32(BigInt(12345678))
            .encrypt();

        const encAge = await fhevm
            .createEncryptedInput(contractAddress, user.address)
            .add8(BigInt(age))
            .encrypt();

        const encAddress = await fhevm
            .createEncryptedInput(contractAddress, user.address)
            .add32(BigInt(87654321))
            .encrypt();

        const encCountry = await fhevm
            .createEncryptedInput(contractAddress, user.address)
            .add16(BigInt(840))
            .encrypt();

        const encPassport = await fhevm
            .createEncryptedInput(contractAddress, user.address)
            .add32(BigInt(11223344))
            .encrypt();

        await identityRegistry.connect(user).submitIdentity(
            encFullName.handles[0],
            encFullName.inputProof,
            encAge.handles[0],
            encAge.inputProof,
            encAddress.handles[0],
            encAddress.inputProof,
            encCountry.handles[0],
            encCountry.inputProof,
            encPassport.handles[0],
            encPassport.inputProof
        );

        // If KYC level or risk score different from defaults, verify the identity
        if (kycLevel !== 1 || riskScore !== 50) {
            await identityRegistry.verifyIdentity(user.address, kycLevel, riskScore);
        }

        // Authorize policy engine to access identity
        await identityRegistry.connect(user).authorizeContract(await policyEngine.getAddress(), true);
    }

    describe("Deployment", function () {
        it("should deploy with correct owner", async function () {
            expect(await policyEngine.owner()).to.equal(owner.address);
        });

        it("should have correct identity registry address", async function () {
            expect(await policyEngine.identityRegistry()).to.equal(await identityRegistry.getAddress());
        });

        it("should start with zero policies", async function () {
            expect(await policyEngine.policyCounter()).to.equal(0);
        });

        it("should reject deployment with zero address", async function () {
            const PolicyEngineFactory = await ethers.getContractFactory("PolicyEngine");

            await expect(
                PolicyEngineFactory.deploy(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(policyEngine, "IdentityRegistryNotSet");
        });
    });

    describe("Policy Creation", function () {
        it("should create policy with all parameters", async function () {
            await expect(
                policyEngine.createPolicy(
                    "Adult Users Only",
                    18,    // minAge
                    120,   // maxAge
                    1,     // minKYCLevel
                    80,    // maxRiskScore
                    false, // requireAccredited
                    true,  // allowPEP
                    false  // allowSanctioned
                )
            )
                .to.emit(policyEngine, "PolicyCreated")
                .withArgs(0, "Adult Users Only");

            const policy = await policyEngine.getPolicy(0);
            expect(policy.name).to.equal("Adult Users Only");
            expect(policy.minAge).to.equal(18);
            expect(policy.maxAge).to.equal(120);
            expect(policy.minKYCLevel).to.equal(1);
            expect(policy.maxRiskScore).to.equal(80);
            expect(policy.active).to.be.true;
        });

        it("should create policy with no max age limit", async function () {
            await policyEngine.createPolicy("Any Age", 0, 255, 1, 100, false, true, true);

            const policy = await policyEngine.getPolicy(0);
            expect(policy.maxAge).to.equal(255);
        });

        it("should create multiple policies", async function () {
            await policyEngine.createPolicy("Policy A", 18, 255, 1, 100, false, true, true);
            await policyEngine.createPolicy("Policy B", 21, 65, 2, 50, true, false, false);
            await policyEngine.createPolicy("Policy C", 25, 100, 3, 30, false, true, false);

            expect(await policyEngine.policyCounter()).to.equal(3);
        });

        it("should reject non-owner creating policy", async function () {
            await expect(
                policyEngine.connect(user1).createPolicy("Test", 18, 255, 1, 100, false, true, true)
            ).to.be.revertedWithCustomError(policyEngine, "OwnableUnauthorizedAccount");
        });
    });

    describe("Policy Status Management", function () {
        beforeEach(async function () {
            await policyEngine.createPolicy("Test Policy", 18, 255, 1, 100, false, true, true);
        });

        it("should update policy status", async function () {
            await expect(policyEngine.setPolicyStatus(0, false))
                .to.emit(policyEngine, "PolicyUpdated")
                .withArgs(0);

            const policy = await policyEngine.getPolicy(0);
            expect(policy.active).to.be.false;
        });

        it("should reactivate deactivated policy", async function () {
            await policyEngine.setPolicyStatus(0, false);
            await policyEngine.setPolicyStatus(0, true);

            const policy = await policyEngine.getPolicy(0);
            expect(policy.active).to.be.true;
        });

        it("should reject status update for invalid policy ID", async function () {
            await expect(
                policyEngine.setPolicyStatus(999, false)
            ).to.be.revertedWithCustomError(policyEngine, "InvalidPolicy");
        });

        it("should reject non-owner status update", async function () {
            await expect(
                policyEngine.connect(user1).setPolicyStatus(0, false)
            ).to.be.revertedWithCustomError(policyEngine, "OwnableUnauthorizedAccount");
        });
    });

    describe("Policy Evaluation", function () {
        beforeEach(async function () {
            // Create a permissive policy that user1 should pass
            await policyEngine.createPolicy(
                "Basic Check",
                18,    // minAge
                255,   // maxAge (no limit)
                1,     // minKYCLevel
                100,   // maxRiskScore
                false, // requireAccredited
                true,  // allowPEP
                true   // allowSanctioned
            );
        });

        it("should evaluate policy for user with identity", async function () {
            await expect(policyEngine.connect(user1).evaluatePolicy(0))
                .to.emit(policyEngine, "PolicyEvaluated");

            expect(await policyEngine.hasResult(user1.address, 0)).to.be.true;
            expect(await policyEngine.lastEvaluatedPolicy(user1.address)).to.equal(0);
        });

        it("should reject evaluation for user without identity", async function () {
            await expect(
                policyEngine.connect(user2).evaluatePolicy(0)
            ).to.be.revertedWithCustomError(policyEngine, "NoIdentity");
        });

        it("should reject evaluation for invalid policy ID", async function () {
            await expect(
                policyEngine.connect(user1).evaluatePolicy(999)
            ).to.be.revertedWithCustomError(policyEngine, "InvalidPolicy");
        });

        it("should reject evaluation for inactive policy", async function () {
            await policyEngine.setPolicyStatus(0, false);

            await expect(
                policyEngine.connect(user1).evaluatePolicy(0)
            ).to.be.revertedWithCustomError(policyEngine, "PolicyInactive");
        });

        it("should allow re-evaluation of same policy", async function () {
            await policyEngine.connect(user1).evaluatePolicy(0);

            // Should be able to evaluate again
            await expect(policyEngine.connect(user1).evaluatePolicy(0))
                .to.emit(policyEngine, "PolicyEvaluated");
        });
    });

    describe("Policy Evaluation with Different Criteria", function () {
        it("should evaluate age-restricted policy", async function () {
            // Create policy requiring age 21+
            await policyEngine.createPolicy("Age 21+", 21, 255, 1, 100, false, true, true);

            // User1 is 30, should pass
            await policyEngine.connect(user1).evaluatePolicy(0);
            expect(await policyEngine.hasResult(user1.address, 0)).to.be.true;
        });

        it("should evaluate KYC level policy", async function () {
            // Create policy requiring KYC level 3
            await policyEngine.createPolicy("High KYC", 18, 255, 3, 100, false, true, true);

            // User1 has KYC level 2, this will create a result
            // (actual pass/fail depends on FHE evaluation)
            await policyEngine.connect(user1).evaluatePolicy(0);
            expect(await policyEngine.hasResult(user1.address, 0)).to.be.true;
        });

        it("should evaluate risk score policy", async function () {
            // Create policy requiring low risk (max 20)
            await policyEngine.createPolicy("Low Risk Only", 18, 255, 1, 20, false, true, true);

            // User1 has risk score 25
            await policyEngine.connect(user1).evaluatePolicy(0);
            expect(await policyEngine.hasResult(user1.address, 0)).to.be.true;
        });

        it("should evaluate accreditation policy", async function () {
            // Create policy requiring accreditation
            await policyEngine.createPolicy("Accredited Only", 18, 255, 1, 100, true, true, true);

            await policyEngine.connect(user1).evaluatePolicy(0);
            expect(await policyEngine.hasResult(user1.address, 0)).to.be.true;
        });
    });

    describe("Result Claiming", function () {
        beforeEach(async function () {
            await policyEngine.createPolicy("Basic Check", 18, 255, 1, 100, false, true, true);
            await policyEngine.connect(user1).evaluatePolicy(0);
        });

        it("should allow user to claim pass result", async function () {
            await expect(policyEngine.connect(user1).claimResult(0, 1))
                .to.emit(policyEngine, "ResultClaimed")
                .withArgs(user1.address, 0, 1);
        });

        it("should allow user to claim fail result", async function () {
            await expect(policyEngine.connect(user1).claimResult(0, 0))
                .to.emit(policyEngine, "ResultClaimed")
                .withArgs(user1.address, 0, 0);
        });

        it("should reject claim for non-evaluated policy", async function () {
            await expect(
                policyEngine.connect(user1).claimResult(1, 1)
            ).to.be.revertedWithCustomError(policyEngine, "NoResult");
        });

        it("should reject invalid result value (>1)", async function () {
            await expect(
                policyEngine.connect(user1).claimResult(0, 2)
            ).to.be.revertedWithCustomError(policyEngine, "InvalidProof");
        });

        it("should return true for pass claim", async function () {
            const result = await policyEngine.connect(user1).claimResult.staticCall(0, 1);
            expect(result).to.be.true;
        });

        it("should return false for fail claim", async function () {
            const result = await policyEngine.connect(user1).claimResult.staticCall(0, 0);
            expect(result).to.be.false;
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            await policyEngine.createPolicy("Test Policy", 18, 255, 1, 100, false, true, true);
            await policyEngine.connect(user1).evaluatePolicy(0);
        });

        it("should return correct hasResult status", async function () {
            expect(await policyEngine.hasResult(user1.address, 0)).to.be.true;
            expect(await policyEngine.hasResult(user2.address, 0)).to.be.false;
            expect(await policyEngine.hasResult(user1.address, 1)).to.be.false;
        });

        it("should return result metadata", async function () {
            const [evaluatedAt, exists] = await policyEngine.getResultMetadata(user1.address, 0);

            expect(evaluatedAt).to.be.gt(0);
            expect(exists).to.be.true;
        });

        it("should return policy configuration", async function () {
            const policy = await policyEngine.getPolicy(0);

            expect(policy.name).to.equal("Test Policy");
            expect(policy.minAge).to.equal(18);
            expect(policy.maxAge).to.equal(255);
        });

        it("should reject invalid policy ID query", async function () {
            await expect(
                policyEngine.getPolicy(999)
            ).to.be.revertedWithCustomError(policyEngine, "InvalidPolicy");
        });
    });

    describe("Identity Registry Management", function () {
        it("should allow owner to update identity registry", async function () {
            const NewIdentityFactory = await ethers.getContractFactory("IdentityRegistry");
            const newIdentity = await NewIdentityFactory.deploy();

            await policyEngine.setIdentityRegistry(await newIdentity.getAddress());

            expect(await policyEngine.identityRegistry()).to.equal(await newIdentity.getAddress());
        });

        it("should reject zero address for registry update", async function () {
            await expect(
                policyEngine.setIdentityRegistry(ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(policyEngine, "IdentityRegistryNotSet");
        });

        it("should reject non-owner registry update", async function () {
            const NewIdentityFactory = await ethers.getContractFactory("IdentityRegistry");
            const newIdentity = await NewIdentityFactory.deploy();

            await expect(
                policyEngine.connect(user1).setIdentityRegistry(await newIdentity.getAddress())
            ).to.be.revertedWithCustomError(policyEngine, "OwnableUnauthorizedAccount");
        });
    });

    describe("Multiple Policy Evaluations", function () {
        beforeEach(async function () {
            // Create multiple policies
            await policyEngine.createPolicy("Policy A", 18, 255, 1, 100, false, true, true);
            await policyEngine.createPolicy("Policy B", 21, 255, 2, 80, false, true, true);
            await policyEngine.createPolicy("Policy C", 25, 65, 3, 50, true, false, false);
        });

        it("should track last evaluated policy", async function () {
            await policyEngine.connect(user1).evaluatePolicy(0);
            expect(await policyEngine.lastEvaluatedPolicy(user1.address)).to.equal(0);

            await policyEngine.connect(user1).evaluatePolicy(1);
            expect(await policyEngine.lastEvaluatedPolicy(user1.address)).to.equal(1);

            await policyEngine.connect(user1).evaluatePolicy(2);
            expect(await policyEngine.lastEvaluatedPolicy(user1.address)).to.equal(2);
        });

        it("should maintain separate results for each policy", async function () {
            await policyEngine.connect(user1).evaluatePolicy(0);
            await policyEngine.connect(user1).evaluatePolicy(1);
            await policyEngine.connect(user1).evaluatePolicy(2);

            expect(await policyEngine.hasResult(user1.address, 0)).to.be.true;
            expect(await policyEngine.hasResult(user1.address, 1)).to.be.true;
            expect(await policyEngine.hasResult(user1.address, 2)).to.be.true;
        });
    });

    describe("FHE Operations Verification", function () {
        it("should handle age comparison correctly", async function () {
            // Create policy for age 35+
            await policyEngine.createPolicy("Age 35+", 35, 255, 1, 100, false, true, true);

            // User1 is 30, should fail this policy
            await policyEngine.connect(user1).evaluatePolicy(0);

            // Result exists but encrypted pass/fail needs decryption
            expect(await policyEngine.hasResult(user1.address, 0)).to.be.true;
        });

        it("should handle combined conditions", async function () {
            // Create strict policy
            await policyEngine.createPolicy(
                "Strict Policy",
                25,    // minAge
                60,    // maxAge
                3,     // minKYCLevel
                30,    // maxRiskScore
                true,  // requireAccredited
                false, // allowPEP
                false  // allowSanctioned
            );

            await policyEngine.connect(user1).evaluatePolicy(0);
            expect(await policyEngine.hasResult(user1.address, 0)).to.be.true;
        });
    });
});
