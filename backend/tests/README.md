# TriLink Backend - Testing & QA Documentation

## 🎯 Overview

This directory contains a comprehensive testing suite for the TriLink Platform backend, designed to ensure correctness, security, and workflow integrity at government-grade standards.

## 📁 Test Structure

```
tests/
├── unit/                    # Unit tests (services, utils, validators)
│   ├── services/
│   └── utils/
├── integration/             # Integration tests (API + DB)
│   ├── auth.test.ts
│   ├── users.test.ts
│   ├── companies.test.ts
│   └── edge-cases.test.ts
├── e2e/                     # End-to-end workflow tests
│   └── full-procurement-flow.test.ts
├── security/                # Security & RBAC tests
│   ├── rbac.test.ts
│   └── ownership.test.ts
├── fixtures/                # Test data fixtures
├── helpers/                 # Test utilities
│   ├── auth.helper.ts
│   ├── database.helper.ts
│   └── app.helper.ts
└── setup.ts                 # Global test setup
```

## 🚀 Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Specific Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# Security tests only
npm run test:security
```

### CI/CD Mode
```bash
npm run test:ci
```

## 🧪 Test Layers

### 1. Unit Tests (`tests/unit/`)
- **Purpose**: Test individual functions and methods in isolation
- **Scope**: Services, utilities, validators
- **Mocking**: Repositories and external dependencies
- **Coverage Target**: 90%+

**Example:**
```typescript
describe('UserService', () => {
  it('should create user successfully', async () => {
    // Test service logic with mocked repository
  });
});
```

### 2. Integration Tests (`tests/integration/`)
- **Purpose**: Test API endpoints with real database
- **Scope**: Controllers + Routes + Database
- **Database**: MongoDB Memory Server (in-memory)
- **Coverage**: All CRUD operations, validations, error handling

**Example:**
```typescript
describe('POST /api/users', () => {
  it('should create user via API', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send(userData);
    
    expect(response.status).toBe(201);
  });
});
```

### 3. E2E Tests (`tests/e2e/`)
- **Purpose**: Test complete workflows end-to-end
- **Scope**: Full procurement lifecycle
- **Flow**: Purchase Request → RFQ → Bid → Contract → Shipment → Payment

**Example:**
```typescript
it('should complete full procurement workflow', async () => {
  // 1. Create Purchase Request
  // 2. Verify RFQs generated
  // 3. Submit Bid
  // 4. Accept Bid
  // 5. Sign Contract
  // 6. Verify state consistency
});
```

### 4. Security Tests (`tests/security/`)
- **Purpose**: Test security and RBAC enforcement
- **Scope**: 
  - Unauthorized access prevention
  - Role-based permissions
  - Company isolation
  - Cross-company data leakage prevention

**Example:**
```typescript
it('should prevent cross-company data access', async () => {
  const response = await request(app)
    .get(`/api/users/${otherCompanyUserId}`)
    .set('Authorization', `Bearer ${token}`);
  
  expect(response.status).toBe(403);
});
```

## 🔧 Test Utilities

### Auth Helpers (`helpers/auth.helper.ts`)
```typescript
import { generateBuyerToken, authHeader } from '../helpers/auth.helper';

const token = generateBuyerToken(companyId);
const headers = authHeader(token);
```

### Database Helpers (`helpers/database.helper.ts`)
```typescript
import { clearDatabase, createObjectId } from '../helpers/database.helper';

beforeEach(async () => {
  await clearDatabase();
});
```

### Fixtures (`fixtures/`)
```typescript
import { createBuyerUser, createSupplierCompany } from '../fixtures/users.fixture';

const user = createBuyerUser(companyId);
```

## 📊 Coverage Requirements

### Global Coverage Thresholds
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Per-Module Coverage
Each module should maintain:
- **Services**: 90%+
- **Controllers**: 85%+
- **Repositories**: 80%+

## ✅ Quality Gates

All tests must pass before deployment:

- ✅ No unauthorized access possible
- ✅ No cross-company data leaks
- ✅ No invalid lifecycle transitions
- ✅ All critical paths tested
- ✅ All roles tested
- ✅ Coverage thresholds met

## 🐛 Debugging Tests

### Run Single Test File
```bash
npm test -- tests/integration/auth.test.ts
```

### Run Single Test Case
```bash
npm test -- -t "should login successfully"
```

### Verbose Output
```bash
npm test -- --verbose
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 🔐 Test Environment

Tests run in isolated environment:
- **Database**: MongoDB Memory Server (in-memory)
- **Environment**: `NODE_ENV=test`
- **Isolation**: Database cleared between tests
- **No Side Effects**: Tests don't affect development database

## 📝 Writing New Tests

### Unit Test Template
```typescript
import { ServiceName } from '../../src/modules/module/service';
import { RepositoryName } from '../../src/modules/module/repository';

jest.mock('../../src/modules/module/repository');

describe('ServiceName - Unit Tests', () => {
  let service: ServiceName;
  let mockRepository: jest.Mocked<RepositoryName>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ServiceName();
    mockRepository = service['repository'] as jest.Mocked<RepositoryName>;
  });

  it('should perform action', async () => {
    // Arrange
    mockRepository.method.mockResolvedValue(mockData);

    // Act
    const result = await service.method();

    // Assert
    expect(result).toBeDefined();
    expect(mockRepository.method).toHaveBeenCalled();
  });
});
```

### Integration Test Template
```typescript
import request from 'supertest';
import { getApp } from '../helpers/app.helper';
import { generateBuyerToken, authHeader } from '../helpers/auth.helper';
import { clearDatabase } from '../helpers/database.helper';

describe('Module Integration Tests', () => {
  let app: any;
  let token: string;

  beforeAll(async () => {
    app = getApp();
  });

  beforeEach(async () => {
    await clearDatabase();
    // Setup test data
    token = generateBuyerToken(companyId);
  });

  it('should perform action', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .set(authHeader(token))
      .send(data);

    expect(response.status).toBe(201);
  });
});
```

## 🚨 Common Issues

### MongoDB Memory Server Fails to Start
- **Solution**: Ensure sufficient system memory
- **Workaround**: Increase timeout in `jest.config.ts`

### Tests Timing Out
- **Solution**: Increase `testTimeout` in `jest.config.ts`
- **Check**: Database cleanup between tests

### Coverage Below Threshold
- **Solution**: Add tests for uncovered code paths
- **Check**: Review coverage report: `coverage/lcov-report/index.html`

## 📚 Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clear database between tests
3. **Fixtures**: Use fixtures for test data
4. **Helpers**: Use helper functions for common operations
5. **Assertions**: Be specific with assertions
6. **Naming**: Use descriptive test names
7. **Coverage**: Aim for high coverage but prioritize critical paths

## 🔗 Related Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)

---

**TriLink Platform - Testing & QA System**  
**Version 2.0**  
**Built for government-grade quality assurance**
