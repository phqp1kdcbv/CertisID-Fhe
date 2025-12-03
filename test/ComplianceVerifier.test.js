const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("ComplianceVerifier - Compliance Attestation Tests", function () {
    let complianceVerifier;
    let identityRegistry;
    let policyEngine;
    let owner, user1, user2, officer;

    beforeEach(async function () {
        // Ensure we're running in FHEVM mock environment
        if (!fhevm.isMock) {
            throw new Error("This test must run in FHEVM mock environment");
        }

        await fhevm.initializeCLIApi();
        [owner, user1, user2, officer] = await ethers.getSigners();

        // Deploy IdentityRegistry
        const IdentityRegistryFactory = await ethers.getContractFactory("IdentityRegistry");
        identityRegistry = await IdentityRegistryFactory.deploy();
        await identityRegistry.waitForDeployment();

        // Deploy PolicyEngine
        const PolicyEngineFactory = await ethers.getContractFactory("PolicyEngine");
        policyEngine = await PolicyEngineFactory.deploy(await identityRegistry.getAddress());
        await policyEngine.waitForDeployment();

        // Deploy ComplianceVerifier
        const ComplianceVerifierFactory = await ethers.getContractFactory("ComplianceVerifier");
        complianceVerifier = await ComplianceVerifierFactory.deploy(
            await identityRegistry.getAddress(),
            await policyEngine.getAddress()
        );
        await complianceVerifier.waitForDeployment();

        // Authorize user1 in identity registry for policy engine access
        await setupUserIdentity(user1);
    });

    async function setupUserIdentity(user) {
        const contractAddress = await identityRegistry.getAddress();

        const encFullName = await fhevm
            .createEncryptedInput(contractAddress, user.address)
            .add32(BigInt(12345678))
            .encrypt();

        const encAge = await fhevm
            .createEncryptedInput(contractAddress, user.address)
            .add8(BigInt(30))
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

        // Authorize policy engine to access identity
        await identityRegistry.connect(user).authorizeContract(await policyEngine.getAddress(), true);
    }

    describe("Deployment", function () {
        it("should deploy with correct owner", async function () {
            expect(await complianceVerifier.owner()).to.equal(owner.address);
        });

        it("should set owner as compliance officer", async function () {
            expect(await complianceVerifier.complianceOfficers(owner.address)).to.be.true;
        });

        it("should have correct registry addresses", async function () {
            expect(await complianceVerifier.identityRegistry()).to.equal(await identityRegistry.getAddress());
            expect(await complianceVerifier.policyEngine()).to.equal(await policyEngine.getAddress());
        });

        it("should start with zero requirements", async function () {
            expect(await complianceVerifier.requirementCounter()).to.equal(0);
        });

        it("should start with zero attestations", async function () {
            expect(await complianceVerifier.totalAttestations()).to.equal(0);
        });

        it("should reject deployment with zero addresses", async function () {
            const ComplianceVerifierFactory = await ethers.getContractFactory("ComplianceVerifier");

            await expect(
                ComplianceVerifierFactory.deploy(ethers.ZeroAddress, await policyEngine.getAddress())
            ).to.be.revertedWithCustomError(complianceVerifier, "InvalidRegistries");

            await expect(
                ComplianceVerifierFactory.deploy(await identityRegistry.getAddress(), ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(complianceVerifier, "InvalidRegistries");
        });
    });

    describe("Compliance Officer Management", function () {
        it("should allow owner to add compliance officer", async function () {
            await expect(complianceVerifier.setComplianceOfficer(officer.address, true))
                .to.emit(complianceVerifier, "ComplianceOfficerUpdated")
                .withArgs(officer.address, true);

            expect(await complianceVerifier.complianceOfficers(officer.address)).to.be.true;
        });

        it("should allow owner to remove compliance officer", async function () {
            await complianceVerifier.setComplianceOfficer(officer.address, true);
            await complianceVerifier.setComplianceOfficer(officer.address, false);

            expect(await complianceVerifier.complianceOfficers(officer.address)).to.be.false;
        });

        it("should reject non-owner setting compliance officer", async function () {
            await expect(
                complianceVerifier.connect(user1).setComplianceOfficer(officer.address, true)
            ).to.be.revertedWithCustomError(complianceVerifier, "OwnableUnauthorizedAccount");
        });
    });

    describe("Requirement Management", function () {
        it("should create requirement with identity only", async function () {
            await expect(
                complianceVerifier.createRequirement(
                    "Basic KYC",
                    true,   // requireIdentity
                    false,  // requirePolicyPass
                    0,      // requiredPolicyId (unused)
                    86400   // validityPeriod (1 day)
                )
            )
                .to.emit(complianceVerifier, "RequirementCreated")
                .withArgs(0, "Basic KYC");

            const requirement = await complianceVerifier.getRequirement(0);
            expect(requirement.name).to.equal("Basic KYC");
            expect(requirement.requireIdentity).to.be.true;
            expect(requirement.requirePolicyPass).to.be.false;
            expect(requirement.active).to.be.true;
        });

        it("should create requirement with policy check", async function () {
            // First create a policy
            await policyEngine.createPolicy(
                "Age 18+",
                18,   // minAge
                255,  // maxAge (no limit)
                1,    // minKYCLevel
                100,  // maxRiskScore
                false, // requireAccredited
                true,  // allowPEP
                false  // allowSanctioned
            );

            await complianceVerifier.createRequirement(
                "Adult User",
                true,   // requireIdentity
                true,   // requirePolicyPass
                0,      // requiredPolicyId
                604800  // validityPeriod (7 days)
            );

            const requirement = await complianceVerifier.getRequirement(0);
            expect(requirement.requirePolicyPass).to.be.true;
            expect(requirement.requiredPolicyId).to.equal(0);
        });

        it("should update requirement status", async function () {
            await complianceVerifier.createRequirement("Test", true, false, 0, 86400);

            await expect(complianceVerifier.setRequirementStatus(0, false))
                .to.emit(complianceVerifier, "RequirementUpdated")
                .withArgs(0);

            const requirement = await complianceVerifier.getRequirement(0);
            expect(requirement.active).to.be.false;
        });

        it("should reject non-owner creating requirement", async function () {
            await expect(
                complianceVerifier.connect(user1).createRequirement("Test", true, false, 0, 86400)
            ).to.be.revertedWithCustomError(complianceVerifier, "OwnableUnauthorizedAccount");
        });

        it("should reject invalid requirement ID for status update", async function () {
            await expect(
                complianceVerifier.setRequirementStatus(999, false)
            ).to.be.revertedWithCustomError(complianceVerifier, "InvalidRequirement");
        });
    });

    describe("Attestation Requests", function () {
        beforeEach(async function () {
            // Create a basic requirement
            await complianceVerifier.createRequirement(
                "Basic KYC",
                true,
                false,
                0,
                86400
            );
        });

        it("should issue attestation for user with identity", async function () {
            await expect(
                complianceVerifier.connect(user1).requestAttestation(0)
            ).to.emit(complianceVerifier, "AttestationIssued");

            expect(await complianceVerifier.hasValidAttestation(user1.address, 0)).to.be.true;
            expect(await complianceVerifier.totalAttestations()).to.equal(1);
        });

        it("should reject attestation for user without identity", async function () {
            await expect(
                complianceVerifier.connect(user2).requestAttestation(0)
            ).to.be.revertedWithCustomError(complianceVerifier, "NoIdentity");
        });

        it("should reject attestation for invalid requirement ID", async function () {
            await expect(
                complianceVerifier.connect(user1).requestAttestation(999)
            ).to.be.revertedWithCustomError(complianceVerifier, "InvalidRequirement");
        });

        it("should reject attestation for inactive requirement", async function () {
            await complianceVerifier.setRequirementStatus(0, false);

            await expect(
                complianceVerifier.connect(user1).requestAttestation(0)
            ).to.be.revertedWithCustomError(complianceVerifier, "RequirementInactive");
        });

        it("should require policy evaluation when configured", async function () {
            // Create policy
            await policyEngine.createPolicy("Age 18+", 18, 255, 1, 100, false, true, false);

            // Create requirement with policy check
            await complianceVerifier.createRequirement("Adult User", true, true, 0, 86400);

            // Should fail without policy evaluation
            await expect(
                complianceVerifier.connect(user1).requestAttestation(1)
            ).to.be.revertedWithCustomError(complianceVerifier, "PolicyNotEvaluated");

            // Evaluate policy
            await policyEngine.connect(user1).evaluatePolicy(0);

            // Now should succeed
            await expect(
                complianceVerifier.connect(user1).requestAttestation(1)
            ).to.emit(complianceVerifier, "AttestationIssued");
        });
    });

    describe("Attestation Revocation", function () {
        beforeEach(async function () {
            await complianceVerifier.createRequirement("Basic KYC", true, false, 0, 86400);
            await complianceVerifier.connect(user1).requestAttestation(0);
            await complianceVerifier.setComplianceOfficer(officer.address, true);
        });

        it("should allow compliance officer to revoke attestation", async function () {
            await expect(
                complianceVerifier.connect(officer).revokeAttestation(user1.address, 0)
            )
                .to.emit(complianceVerifier, "AttestationRevoked")
                .withArgs(user1.address, 0);

            expect(await complianceVerifier.hasValidAttestation(user1.address, 0)).to.be.false;
        });

        it("should allow owner to revoke attestation", async function () {
            await complianceVerifier.connect(owner).revokeAttestation(user1.address, 0);

            expect(await complianceVerifier.hasValidAttestation(user1.address, 0)).to.be.false;
        });

        it("should reject revocation from non-officer", async function () {
            await expect(
                complianceVerifier.connect(user2).revokeAttestation(user1.address, 0)
            ).to.be.revertedWithCustomError(complianceVerifier, "UnauthorizedOfficer");
        });

        it("should reject revocation of non-existent attestation", async function () {
            await expect(
                complianceVerifier.connect(officer).revokeAttestation(user2.address, 0)
            ).to.be.revertedWithCustomError(complianceVerifier, "NoAttestation");
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            await complianceVerifier.createRequirement("Basic KYC", true, false, 0, 86400);
            await complianceVerifier.connect(user1).requestAttestation(0);
        });

        it("should return correct attestation validity", async function () {
            expect(await complianceVerifier.hasValidAttestation(user1.address, 0)).to.be.true;
            expect(await complianceVerifier.hasValidAttestation(user2.address, 0)).to.be.false;
        });

        it("should return attestation metadata", async function () {
            const [issuedAt, expiresAt, isValid] = await complianceVerifier.getAttestationMetadata(user1.address, 0);

            expect(issuedAt).to.be.gt(0);
            expect(expiresAt).to.be.gt(issuedAt);
            expect(isValid).to.be.true;
        });

        it("should return requirement configuration", async function () {
            const requirement = await complianceVerifier.getRequirement(0);

            expect(requirement.name).to.equal("Basic KYC");
            expect(requirement.requireIdentity).to.be.true;
            expect(requirement.validityPeriod).to.equal(86400);
        });

        it("should reject invalid requirement ID query", async function () {
            await expect(
                complianceVerifier.getRequirement(999)
            ).to.be.revertedWithCustomError(complianceVerifier, "InvalidRequirement");
        });
    });

    describe("Registry Updates", function () {
        it("should allow owner to update registries", async function () {
            // Deploy new registries
            const NewIdentityFactory = await ethers.getContractFactory("IdentityRegistry");
            const newIdentity = await NewIdentityFactory.deploy();

            const NewPolicyFactory = await ethers.getContractFactory("PolicyEngine");
            const newPolicy = await NewPolicyFactory.deploy(await newIdentity.getAddress());

            await complianceVerifier.updateRegistries(
                await newIdentity.getAddress(),
                await newPolicy.getAddress()
            );

            expect(await complianceVerifier.identityRegistry()).to.equal(await newIdentity.getAddress());
            expect(await complianceVerifier.policyEngine()).to.equal(await newPolicy.getAddress());
        });

        it("should reject zero addresses for registry update", async function () {
            await expect(
                complianceVerifier.updateRegistries(ethers.ZeroAddress, await policyEngine.getAddress())
            ).to.be.revertedWithCustomError(complianceVerifier, "InvalidRegistries");
        });

        it("should reject non-owner updating registries", async function () {
            await expect(
                complianceVerifier.connect(user1).updateRegistries(
                    await identityRegistry.getAddress(),
                    await policyEngine.getAddress()
                )
            ).to.be.revertedWithCustomError(complianceVerifier, "OwnableUnauthorizedAccount");
        });
    });

    describe("Attestation Expiry", function () {
        it("should detect expired attestation", async function () {
            // Create requirement with very short validity (1 second)
            await complianceVerifier.createRequirement("Short Lived", true, false, 0, 1);
            await complianceVerifier.connect(user1).requestAttestation(0);

            expect(await complianceVerifier.hasValidAttestation(user1.address, 0)).to.be.true;

            // Advance time beyond expiry
            await ethers.provider.send("evm_increaseTime", [2]);
            await ethers.provider.send("evm_mine", []);

            expect(await complianceVerifier.hasValidAttestation(user1.address, 0)).to.be.false;
        });
    });

    describe("Multiple Requirements", function () {
        it("should handle multiple requirements per user", async function () {
            // Create multiple requirements
            await complianceVerifier.createRequirement("Basic KYC", true, false, 0, 86400);
            await complianceVerifier.createRequirement("Enhanced Due Diligence", true, false, 0, 172800);

            // Request both attestations
            await complianceVerifier.connect(user1).requestAttestation(0);
            await complianceVerifier.connect(user1).requestAttestation(1);

            expect(await complianceVerifier.hasValidAttestation(user1.address, 0)).to.be.true;
            expect(await complianceVerifier.hasValidAttestation(user1.address, 1)).to.be.true;
            expect(await complianceVerifier.totalAttestations()).to.equal(2);
        });
    });
});
