# FHE KYC - Unit Tests

This directory contains comprehensive unit tests for the FHE KYC smart contracts.

## Test Structure

```
tests/
├── IdentityRegistry.test.js      # Identity registry contract tests
├── PolicyEngine.test.js          # Policy engine contract tests
├── ReputationScore.test.js       # Reputation scoring tests
├── ComplianceVerifier.test.js    # Compliance verification tests
└── README.md                     # This file
```

## Running Tests

### Run All Tests
```bash
cd contracts
npm test
```

### Run Specific Test File
```bash
npx hardhat test tests/IdentityRegistry.test.js
npx hardhat test tests/PolicyEngine.test.js
npx hardhat test tests/ReputationScore.test.js
npx hardhat test tests/ComplianceVerifier.test.js
```

### Run Tests with Gas Report
```bash
REPORT_GAS=true npx hardhat test
```

### Run Tests with Coverage
```bash
npx hardhat coverage
```

## Test Categories

### 1. IdentityRegistry Tests
- **Deployment**: Contract initialization and setup
- **Access Control**: Owner permissions and pausability
- **Identity Verification**: Identity existence and verification status
- **Verifier Management**: Adding/removing verifiers
- **Edge Cases**: Zero address handling, duplicate prevention

### 2. PolicyEngine Tests
- **Deployment**: Contract initialization with dependencies
- **Policy Management**: Policy admin role management
- **Policy Queries**: Policy existence and counting
- **Access Control**: Pausing and permission checks
- **Integration**: Identity registry integration

### 3. ReputationScore Tests
- **Deployment**: Contract initialization
- **Scorer Management**: Adding/removing scorers
- **Reputation Queries**: Score checking and retrieval
- **Access Control**: Owner permissions
- **State Consistency**: Multiple scorer management

### 4. ComplianceVerifier Tests
- **Deployment**: Multi-contract initialization
- **Auditor Management**: Auditor role management
- **Verification Queries**: Compliance status checking
- **Access Control**: Owner permissions and pausing
- **Multi-Contract Integration**: Cross-contract interactions

## Test Coverage

Each test suite covers:
- ✅ **Deployment**: Correct initialization
- ✅ **Access Control**: Permission-based actions
- ✅ **Role Management**: Adding/removing authorized accounts
- ✅ **State Queries**: Reading contract state
- ✅ **Events**: Proper event emissions
- ✅ **Edge Cases**: Zero addresses, duplicates, non-existent entities
- ✅ **Integration**: Multi-contract interactions

## Notes

### FHE Limitations
Due to the complexity of Fully Homomorphic Encryption, tests for encrypted data submission are simplified. Full FHE operations require:
- Zama FHE Gateway running
- Proper encryption keys setup
- Network-specific FHE configurations

These are better tested in integration/end-to-end tests rather than unit tests.

### Testing Philosophy
1. **Unit Tests**: Test individual contract functions in isolation
2. **Integration Tests**: Test contract interactions (partially covered here)
3. **E2E Tests**: Test full user workflows with FHE encryption (requires separate setup)

## Requirements

- Node.js >= 16.0.0
- Hardhat >= 2.19.0
- Chai for assertions
- Ethers.js for contract interactions

## Adding New Tests

When adding new test files:
1. Follow the existing naming convention: `ContractName.test.js`
2. Include all test categories (Deployment, Access Control, etc.)
3. Test both happy paths and edge cases
4. Add descriptive test names using `it("Should...")`
5. Update this README with new test descriptions

## Common Issues

### Test Failures
- Ensure contracts are compiled: `npm run compile`
- Check Hardhat network is clean: Delete `artifacts/` and `cache/`
- Verify test accounts have sufficient ETH

### FHE-Related Tests
- Mock FHE operations for unit tests
- Use actual FHE SDK for integration tests
- Test encrypted data flows in E2E tests only

## Contributing

When contributing tests:
1. Write clear, descriptive test names
2. Test both success and failure cases
3. Include event emission checks
4. Add comments for complex test logic
5. Ensure all tests pass before submitting
