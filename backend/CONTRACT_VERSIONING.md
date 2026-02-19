# Contract Versioning System

## Overview

The contract versioning system provides complete legal traceability for contracts by maintaining immutable snapshots of contract states at key points in their lifecycle. This ensures full auditability and compliance with legal requirements.

## Features

### 1. Version History
- Complete snapshots of contracts at each version
- Immutable version records that cannot be modified
- Automatic version creation at key lifecycle events

### 2. Version Tracking Points
Versions are automatically created when:
- **Contract Creation**: Initial version (v1) snapshot
- **All Parties Sign**: Snapshot with all signatures
- **Amendment Applied**: New version after amendment approval

### 3. Signature Tracking
- Each version preserves all signatures at that point in time
- Signature verification status included
- Complete signature metadata (hash, certificate, algorithm)

### 4. Version Comparison
- Side-by-side comparison of any two versions
- Field-level difference detection
- Special handling for complex fields (terms, payment schedules)

## Database Schema

### ContractVersion Collection

```typescript
{
  contractId: ObjectId,
  version: Number,              // Version number (1, 2, 3...)
  snapshot: {                   // Complete contract state
    purchaseRequestId: ObjectId,
    buyerCompanyId: ObjectId,
    parties: [...],
    amounts: {...},
    paymentSchedule: [...],
    terms: String,
    startDate: Date,
    endDate: Date,
    status: String
  },
  signatures: [{                 // Signatures at this version
    partyId: ObjectId,
    userId: ObjectId,
    signedAt: Date,
    signature: String,
    signatureHash: String,
    certificate: String,
    algorithm: String,
    verified: Boolean
  }],
  createdBy: {
    userId: ObjectId,
    companyId: ObjectId
  },
  reason: String,               // Why this version was created
  amendmentId: ObjectId,         // Link to amendment if applicable
  createdAt: Date
}
```

## API Endpoints

### GET /api/contracts/:id/versions
Get all versions for a contract, ordered by version number (latest first).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "contractId": "...",
      "version": 2,
      "snapshot": {...},
      "signatures": [...],
      "reason": "Amendment AMEND-001 applied",
      "createdAt": "..."
    }
  ]
}
```

### GET /api/contracts/:id/versions/:version
Get a specific version of a contract.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "contractId": "...",
    "version": 1,
    "snapshot": {...},
    "signatures": [...],
    "reason": "Initial version",
    "createdAt": "..."
  }
}
```

### GET /api/contracts/:id/versions/compare?version1=1&version2=2
Compare two versions of a contract.

**Response:**
```json
{
  "success": true,
  "data": {
    "version1": {...},
    "version2": {...},
    "differences": [
      {
        "field": "terms",
        "path": "terms",
        "oldValue": "Original terms...",
        "newValue": "Updated terms..."
      },
      {
        "field": "amounts.total",
        "path": "amounts.total",
        "oldValue": 10000,
        "newValue": 12000
      }
    ]
  }
}
```

## Access Control

- **Admin & Government**: Can view all versions
- **Contract Parties**: Can view versions for contracts they're involved in
- **Others**: Access denied

## Legal Compliance

### Immutability
- Version records are immutable once created
- No updates or deletions allowed
- Complete audit trail preserved

### Signature Preservation
- All signatures preserved with full metadata
- Signature verification status tracked
- PKI signature data (hash, certificate, algorithm) stored

### Amendment Tracking
- Versions linked to amendments when applicable
- Clear reason for each version creation
- Complete change history

## Frontend Components

### VersionHistoryList
- Displays all versions in chronological order
- Shows signature status per version
- Quick actions: View, Compare
- Current version indicator

### VersionViewer
- Full contract details for any version
- Signature information with verification status
- Version metadata (reason, creation date)

### VersionDiff
- Side-by-side comparison
- Highlighted changes (additions, deletions, modifications)
- Field-level differences
- Special handling for terms and payment schedules

## Usage Example

```typescript
// Get version history
const { data: versions } = useVersionHistory(contractId);

// View a specific version
const { data: version } = useContractVersion(contractId, versionNumber);

// Compare versions
const { data: diff } = useCompareVersions(contractId, version1, version2);
```

## Implementation Notes

1. **Version Creation**: Automatic snapshots created at key lifecycle events
2. **Performance**: Versions are indexed for efficient queries
3. **Storage**: Complete snapshots ensure no data loss
4. **Comparison**: Smart diff algorithm handles dates, arrays, and nested objects

## Future Enhancements

- Version export to PDF
- Version-based contract restoration
- Advanced filtering and search
- Version analytics and reporting
