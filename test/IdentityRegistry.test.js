const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("IdentityRegistry - FHE Identity Management Tests", function () {
    let identityRegistry;
    let owner, user1, user2, verifier;

    beforeEach(async function () {
        // Ensure we're running in FHEVM mock environment
        if (!fhevm.isMock) {
            throw new Error("This test must run in FHEVM mock environment");
        }

        await fhevm.initializeCLIApi();
        [owner, user1, user2, verifier] = await ethers.getSigners();

        // Deploy IdentityRegistry
        const IdentityRegistryFactory = await ethers.getContractFactory("IdentityRegistry");
        identityRegistry = await IdentityRegistryFactory.deploy();
        await identityRegistry.waitForDeployment();
    });

    describe("Deployment", function () {
        it("should deploy with correct owner", async function () {
            expect(await identityRegistry.owner()).to.equal(owner.address);
        });

        it("should start with zero total identities", async function () {
            expect(await identityRegistry.totalIdentities()).to.equal(0);
        });
    });

    describe("Verifier Management", function () {
        it("should allow owner to set verifier", async function () {
            await expect(identityRegistry.setVerifier(verifier.address, true))
                .to.emit(identityRegistry, "VerifierUpdated")
                .withArgs(verifier.address, true);

            expect(await identityRegistry.authorizedVerifiers(verifier.address)).to.be.true;
        });

        it("should allow owner to revoke verifier", async function () {
            await identityRegistry.setVerifier(verifier.address, true);
            await identityRegistry.setVerifier(verifier.address, false);

            expect(await identityRegistry.authorizedVerifiers(verifier.address)).to.be.false;
        });

        it("should reject non-owner setting verifier", async function () {
            await expect(
                identityRegistry.connect(user1).setVerifier(verifier.address, true)
            ).to.be.revertedWithCustomError(identityRegistry, "OwnableUnauthorizedAccount");
        });
    });

    describe("Identity Submission", function () {
        it("should create new identity with encrypted data", async function () {
            const contractAddress = await identityRegistry.getAddress();

            // Create encrypted inputs for identity data
            const fullNameHash = 12345678;
            const age = 30;
            const addressHash = 87654321;
            const countryCode = 840; // USA
            const passportHash = 11223344;

            // Encrypt full name hash (euint32)
            const encFullName = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(fullNameHash))
                .encrypt();

            // Encrypt age (euint8)
            const encAge = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add8(BigInt(age))
                .encrypt();

            // Encrypt address hash (euint32)
            const encAddress = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(addressHash))
                .encrypt();

            // Encrypt country code (euint16)
            const encCountry = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add16(BigInt(countryCode))
                .encrypt();

            // Encrypt passport hash (euint32)
            const encPassport = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(passportHash))
                .encrypt();

            // Submit identity
            const tx = await identityRegistry.connect(user1).submitIdentity(
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

            await expect(tx).to.emit(identityRegistry, "IdentityCreated");

            // Verify identity exists
            expect(await identityRegistry.hasIdentity(user1.address)).to.be.true;
            expect(await identityRegistry.totalIdentities()).to.equal(1);
        });

        it("should update existing identity", async function () {
            const contractAddress = await identityRegistry.getAddress();

            // First submission
            const encFullName1 = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(12345678))
                .encrypt();

            const encAge1 = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add8(BigInt(25))
                .encrypt();

            const encAddress1 = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(87654321))
                .encrypt();

            const encCountry1 = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add16(BigInt(840))
                .encrypt();

            const encPassport1 = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(11223344))
                .encrypt();

            await identityRegistry.connect(user1).submitIdentity(
                encFullName1.handles[0],
                encFullName1.inputProof,
                encAge1.handles[0],
                encAge1.inputProof,
                encAddress1.handles[0],
                encAddress1.inputProof,
                encCountry1.handles[0],
                encCountry1.inputProof,
                encPassport1.handles[0],
                encPassport1.inputProof
            );

            // Second submission (update)
            const encFullName2 = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(99999999))
                .encrypt();

            const encAge2 = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add8(BigInt(26))
                .encrypt();

            const encAddress2 = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(11111111))
                .encrypt();

            const encCountry2 = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add16(BigInt(826))
                .encrypt();

            const encPassport2 = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(55667788))
                .encrypt();

            const tx = await identityRegistry.connect(user1).submitIdentity(
                encFullName2.handles[0],
                encFullName2.inputProof,
                encAge2.handles[0],
                encAge2.inputProof,
                encAddress2.handles[0],
                encAddress2.inputProof,
                encCountry2.handles[0],
                encCountry2.inputProof,
                encPassport2.handles[0],
                encPassport2.inputProof
            );

            await expect(tx).to.emit(identityRegistry, "IdentityUpdated");

            // Total identities should still be 1
            expect(await identityRegistry.totalIdentities()).to.equal(1);
        });
    });

    describe("Identity Verification", function () {
        beforeEach(async function () {
            // Create identity for user1
            const contractAddress = await identityRegistry.getAddress();

            const encFullName = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(12345678))
                .encrypt();

            const encAge = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add8(BigInt(30))
                .encrypt();

            const encAddress = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(87654321))
                .encrypt();

            const encCountry = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add16(BigInt(840))
                .encrypt();

            const encPassport = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(11223344))
                .encrypt();

            await identityRegistry.connect(user1).submitIdentity(
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

            // Set up verifier
            await identityRegistry.setVerifier(verifier.address, true);
        });

        it("should allow owner to verify identity", async function () {
            await expect(
                identityRegistry.connect(owner).verifyIdentity(user1.address, 3, 25)
            ).to.emit(identityRegistry, "IdentityUpdated");
        });

        it("should allow authorized verifier to verify identity", async function () {
            await expect(
                identityRegistry.connect(verifier).verifyIdentity(user1.address, 4, 20)
            ).to.emit(identityRegistry, "IdentityUpdated");
        });

        it("should reject unauthorized verifier", async function () {
            await expect(
                identityRegistry.connect(user2).verifyIdentity(user1.address, 2, 30)
            ).to.be.revertedWithCustomError(identityRegistry, "UnauthorizedVerifier");
        });

        it("should reject invalid KYC level (> 5)", async function () {
            await expect(
                identityRegistry.connect(owner).verifyIdentity(user1.address, 6, 30)
            ).to.be.revertedWithCustomError(identityRegistry, "InvalidKYCLevel");
        });

        it("should reject invalid risk score (> 100)", async function () {
            await expect(
                identityRegistry.connect(owner).verifyIdentity(user1.address, 3, 101)
            ).to.be.revertedWithCustomError(identityRegistry, "InvalidRiskScore");
        });

        it("should reject verification for non-existent identity", async function () {
            await expect(
                identityRegistry.connect(owner).verifyIdentity(user2.address, 3, 30)
            ).to.be.revertedWithCustomError(identityRegistry, "IdentityNotFound");
        });
    });

    describe("Identity Revocation", function () {
        beforeEach(async function () {
            // Create identity for user1
            const contractAddress = await identityRegistry.getAddress();

            const encFullName = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(12345678))
                .encrypt();

            const encAge = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add8(BigInt(30))
                .encrypt();

            const encAddress = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(87654321))
                .encrypt();

            const encCountry = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add16(BigInt(840))
                .encrypt();

            const encPassport = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(11223344))
                .encrypt();

            await identityRegistry.connect(user1).submitIdentity(
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

            await identityRegistry.setVerifier(verifier.address, true);
        });

        it("should allow user to revoke own identity", async function () {
            await expect(identityRegistry.connect(user1).revokeIdentity(user1.address))
                .to.emit(identityRegistry, "IdentityRevoked")
                .withArgs(user1.address, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));

            expect(await identityRegistry.hasIdentity(user1.address)).to.be.false;
            expect(await identityRegistry.totalIdentities()).to.equal(0);
        });

        it("should allow verifier to revoke identity", async function () {
            await identityRegistry.connect(verifier).revokeIdentity(user1.address);

            expect(await identityRegistry.hasIdentity(user1.address)).to.be.false;
        });

        it("should allow owner to revoke identity", async function () {
            await identityRegistry.connect(owner).revokeIdentity(user1.address);

            expect(await identityRegistry.hasIdentity(user1.address)).to.be.false;
        });

        it("should reject unauthorized revocation", async function () {
            await expect(
                identityRegistry.connect(user2).revokeIdentity(user1.address)
            ).to.be.revertedWithCustomError(identityRegistry, "UnauthorizedVerifier");
        });
    });

    describe("Contract Authorization", function () {
        beforeEach(async function () {
            // Create identity for user1
            const contractAddress = await identityRegistry.getAddress();

            const encFullName = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(12345678))
                .encrypt();

            const encAge = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add8(BigInt(30))
                .encrypt();

            const encAddress = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(87654321))
                .encrypt();

            const encCountry = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add16(BigInt(840))
                .encrypt();

            const encPassport = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(11223344))
                .encrypt();

            await identityRegistry.connect(user1).submitIdentity(
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
        });

        it("should allow user to authorize a contract", async function () {
            const dummyContract = user2.address; // Using user2 address as dummy contract

            await expect(
                identityRegistry.connect(user1).authorizeContract(dummyContract, true)
            )
                .to.emit(identityRegistry, "ContractAuthorized")
                .withArgs(user1.address, dummyContract, true);

            expect(
                await identityRegistry.authorizedContracts(user1.address, dummyContract)
            ).to.be.true;
        });

        it("should allow user to revoke contract authorization", async function () {
            const dummyContract = user2.address;

            await identityRegistry.connect(user1).authorizeContract(dummyContract, true);
            await identityRegistry.connect(user1).authorizeContract(dummyContract, false);

            expect(
                await identityRegistry.authorizedContracts(user1.address, dummyContract)
            ).to.be.false;
        });

        it("should reject authorization from user without identity", async function () {
            const dummyContract = user2.address;

            await expect(
                identityRegistry.connect(user2).authorizeContract(dummyContract, true)
            ).to.be.revertedWithCustomError(identityRegistry, "IdentityNotFound");
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            // Create identity for user1
            const contractAddress = await identityRegistry.getAddress();

            const encFullName = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(12345678))
                .encrypt();

            const encAge = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add8(BigInt(30))
                .encrypt();

            const encAddress = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(87654321))
                .encrypt();

            const encCountry = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add16(BigInt(840))
                .encrypt();

            const encPassport = await fhevm
                .createEncryptedInput(contractAddress, user1.address)
                .add32(BigInt(11223344))
                .encrypt();

            await identityRegistry.connect(user1).submitIdentity(
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
        });

        it("should return correct hasIdentity status", async function () {
            expect(await identityRegistry.hasIdentity(user1.address)).to.be.true;
            expect(await identityRegistry.hasIdentity(user2.address)).to.be.false;
        });

        it("should return identity metadata", async function () {
            const [createdAt, updatedAt] = await identityRegistry.getIdentityMetadata(user1.address);

            expect(createdAt).to.be.gt(0);
            expect(updatedAt).to.be.gte(createdAt);
        });

        it("should revert metadata query for non-existent identity", async function () {
            await expect(
                identityRegistry.getIdentityMetadata(user2.address)
            ).to.be.revertedWithCustomError(identityRegistry, "IdentityNotFound");
        });
    });
});
