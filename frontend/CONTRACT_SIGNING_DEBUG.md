# Contract Signing - Debugging Guide

## Common Issues and Solutions

### 1. "Failed to sign contract" - Generic Error

**Possible Causes:**

#### A. Contract Status Issue
- **Error**: `Contract cannot be signed in current status: {status}`
- **Solution**: Contract must be in `DRAFT` or `PENDING_SIGNATURES` status
- **Check**: Verify contract status before attempting to sign

#### B. User Not a Party
- **Error**: `User is not a party to this contract`
- **Solution**: Ensure the user's `companyId` and `userId` match one of the contract parties
- **Check**: Verify `contract.parties` includes the current user

#### C. Already Signed
- **Error**: `Contract already signed by this party`
- **Solution**: Check if the user's company has already signed
- **Check**: Look for existing signature in `contract.signatures` with matching `partyId`

#### D. Version Conflict
- **Error**: `Failed to sign contract: Maximum retries reached due to concurrent modifications`
- **Solution**: This happens when multiple users try to sign simultaneously
- **Fix**: Retry the signing operation

#### E. Missing Contract ID
- **Error**: Contract ID is undefined or invalid
- **Solution**: Ensure `contract._id` or `contract.id` is present
- **Check**: The component now handles both `_id` and `id` fields

---

## Debugging Steps

### 1. Check Contract Status
```typescript
console.log('Contract status:', contract.status);
// Must be: 'draft' or 'pending_signatures'
```

### 2. Check User Party
```typescript
const currentUserCompanyId = user?.companyId;
const currentUserParty = contract.parties.find(
  (p) => p.companyId === currentUserCompanyId
);
console.log('Is user a party?', !!currentUserParty);
console.log('User company ID:', currentUserCompanyId);
console.log('Contract parties:', contract.parties);
```

### 3. Check Existing Signatures
```typescript
const hasSigned = contract.signatures.some(
  (sig) => sig.partyId === currentUserCompanyId
);
console.log('Has user signed?', hasSigned);
console.log('Existing signatures:', contract.signatures);
```

### 4. Check Contract ID
```typescript
const contractId = contract._id || contract.id;
console.log('Contract ID:', contractId);
```

### 5. Check Network Request
Open browser DevTools → Network tab:
- Look for `POST /api/contracts/{id}/sign`
- Check request payload
- Check response status and error message

---

## Frontend Error Display

The component now shows detailed error messages:
- Main error message from backend
- Validation errors (if any)
- Full error logged to console for debugging

---

## Backend Validation

The backend validates:
1. Contract exists
2. Contract status is `DRAFT` or `PENDING_SIGNATURES`
3. User is a party to the contract
4. User hasn't already signed
5. Signature hash is provided

---

## Testing Checklist

- [ ] Contract status is correct
- [ ] User is a party to the contract
- [ ] User hasn't already signed
- [ ] Contract ID is valid
- [ ] Signature text is provided
- [ ] Both checkboxes are checked
- [ ] Network request succeeds
- [ ] Backend returns success response

---

## Common Error Messages

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Contract not found" | Invalid contract ID | Check contract ID |
| "Contract cannot be signed in current status" | Wrong status | Wait for status to change |
| "User is not a party to this contract" | User not in parties | Verify user's company is a party |
| "Contract already signed by this party" | Duplicate signature | Check existing signatures |
| "Failed to sign contract" | Generic error | Check console for details |

---

## Code Changes Made

1. **SignatureFlow.tsx**:
   - Better contract ID handling (`_id` or `id`)
   - Improved error display with detailed messages
   - Better error logging

2. **useContracts.ts**:
   - Enhanced error handling in `useSignContract`
   - Better error message extraction
   - Console logging for debugging

---

**Last Updated**: 2024
