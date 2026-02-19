# Bid Creation API - Debugging Guide

## POST /api/bids - Common 400 Errors

### Required Fields

The following fields are **required** in the request body:

```json
{
  "rfqId": "string (MongoDB ObjectId)",
  "price": "number (must be >= 0)",
  "paymentTerms": "string (min length 1)",
  "deliveryTime": "number (must be >= 1)",
  "deliveryDate": "string (ISO date format)",
  "validity": "string (ISO date format, must be in future)"
}
```

### Optional Fields

```json
{
  "currency": "string (defaults to 'AED')",
  "anonymousBidder": "boolean",
  "attachments": [
    {
      "type": "string",
      "url": "string"
    }
  ]
}
```

---

## Common Validation Errors

### 1. Missing Required Field

**Error:**
```json
{
  "success": false,
  "error": "Validation error",
  "errors": [
    {
      "field": "body.rfqId",
      "message": "Required"
    }
  ]
}
```

**Fix:** Include all required fields in the request body.

---

### 2. Wrong Data Type

**Error:**
```json
{
  "success": false,
  "error": "Validation error",
  "errors": [
    {
      "field": "body.price",
      "message": "Expected number, received string"
    }
  ]
}
```

**Fix:** Ensure `price` and `deliveryTime` are numbers, not strings:
```json
{
  "price": 50000,        // ✅ Correct (number)
  "price": "50000"       // ❌ Wrong (string)
}
```

---

### 3. Invalid Number Value

**Error:**
```json
{
  "success": false,
  "error": "Validation error",
  "errors": [
    {
      "field": "body.price",
      "message": "Number must be greater than or equal to 0"
    }
  ]
}
```

**Fix:** Ensure `price >= 0` and `deliveryTime >= 1`.

---

### 4. Empty String

**Error:**
```json
{
  "success": false,
  "error": "Validation error",
  "errors": [
    {
      "field": "body.paymentTerms",
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

**Fix:** Ensure `paymentTerms` is not an empty string.

---

### 5. Invalid Date Format

**Error:**
```json
{
  "success": false,
  "error": "Validation error",
  "errors": [
    {
      "field": "body.deliveryDate",
      "message": "Invalid date"
    }
  ]
}
```

**Fix:** Use ISO 8601 date format:
```json
{
  "deliveryDate": "2024-12-31T00:00:00.000Z",  // ✅ Correct
  "validity": "2025-01-31T00:00:00.000Z"        // ✅ Correct
}
```

---

## Service-Level Validation Errors

After passing Zod validation, the service may return these errors:

### 1. RFQ Not Found

**Error:**
```json
{
  "success": false,
  "error": "RFQ not found"
}
```

**Fix:** Ensure the `rfqId` exists in the database.

---

### 2. RFQ Not Open

**Error:**
```json
{
  "success": false,
  "error": "RFQ is not open for bidding"
}
```

**Fix:** The RFQ status must be `OPEN`. Check RFQ status before submitting bid.

---

### 3. RFQ Deadline Passed

**Error:**
```json
{
  "success": false,
  "error": "RFQ deadline has passed"
}
```

**Fix:** Check the RFQ deadline. Bids cannot be submitted after the deadline.

---

### 4. Duplicate Bid

**Error:**
```json
{
  "success": false,
  "error": "A bid already exists for this RFQ from your company. You can update or withdraw the existing bid."
}
```

**Fix:** Only one bid per RFQ per company. Update or withdraw the existing bid instead.

---

### 5. Invalid Validity Date

**Error:**
```json
{
  "success": false,
  "error": "Bid validity date must be in the future"
}
```

**Fix:** The `validity` date must be in the future (after current date/time).

---

## Example Request

### ✅ Correct Request

```json
POST /api/bids
Content-Type: application/json
Authorization: Bearer <token>

{
  "rfqId": "507f1f77bcf86cd799439011",
  "price": 50000,
  "currency": "AED",
  "paymentTerms": "Net 30",
  "deliveryTime": 30,
  "deliveryDate": "2024-12-31T00:00:00.000Z",
  "validity": "2025-01-31T00:00:00.000Z",
  "anonymousBidder": false
}
```

### ❌ Common Mistakes

```json
// Wrong: price as string
{
  "price": "50000"  // ❌ Should be number
}

// Wrong: missing required field
{
  "price": 50000
  // ❌ Missing rfqId, paymentTerms, deliveryTime, etc.
}

// Wrong: invalid date format
{
  "deliveryDate": "2024-12-31"  // ❌ Should include time
}

// Wrong: negative price
{
  "price": -1000  // ❌ Must be >= 0
}

// Wrong: zero delivery time
{
  "deliveryTime": 0  // ❌ Must be >= 1
}
```

---

## Testing with cURL

```bash
curl -X POST http://localhost:3000/api/bids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "rfqId": "507f1f77bcf86cd799439011",
    "price": 50000,
    "currency": "AED",
    "paymentTerms": "Net 30",
    "deliveryTime": 30,
    "deliveryDate": "2024-12-31T00:00:00.000Z",
    "validity": "2025-01-31T00:00:00.000Z"
  }'
```

---

## Debugging Steps

1. **Check Request Body:**
   - Verify all required fields are present
   - Ensure data types are correct (numbers vs strings)
   - Validate date formats

2. **Check Authentication:**
   - Ensure valid JWT token in Authorization header
   - Token must not be expired

3. **Check Permissions:**
   - User must have `CREATE_BID` permission
   - User must be a Supplier, Logistics, or Clearance provider

4. **Check RFQ Status:**
   - RFQ must exist
   - RFQ status must be `OPEN`
   - RFQ deadline must not have passed

5. **Check Existing Bids:**
   - Only one bid per RFQ per company
   - If bid exists, update or withdraw it instead

6. **Check Date Validity:**
   - `validity` date must be in the future
   - `deliveryDate` should be reasonable (after current date)

---

## Response Format

### Success (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "rfqId": "507f1f77bcf86cd799439011",
    "companyId": "507f1f77bcf86cd799439013",
    "providerId": "507f1f77bcf86cd799439014",
    "price": 50000,
    "currency": "AED",
    "paymentTerms": "Net 30",
    "deliveryTime": 30,
    "deliveryDate": "2024-12-31T00:00:00.000Z",
    "validity": "2025-01-31T00:00:00.000Z",
    "status": "SUBMITTED",
    "anonymousBidder": false,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "requestId": "req_123456"
}
```

### Validation Error (400 Bad Request)

```json
{
  "success": false,
  "error": "Validation error",
  "errors": [
    {
      "field": "body.price",
      "message": "Expected number, received string"
    }
  ]
}
```

### Service Error (400 Bad Request)

```json
{
  "success": false,
  "error": "RFQ is not open for bidding"
}
```

---

## Quick Checklist

- [ ] All required fields present
- [ ] `price` is a number (>= 0)
- [ ] `deliveryTime` is a number (>= 1)
- [ ] `paymentTerms` is a non-empty string
- [ ] `deliveryDate` is a valid ISO date string
- [ ] `validity` is a valid ISO date string in the future
- [ ] `rfqId` is a valid MongoDB ObjectId
- [ ] RFQ exists and is OPEN
- [ ] RFQ deadline has not passed
- [ ] No existing bid for this RFQ from your company
- [ ] Valid JWT token in Authorization header
- [ ] User has CREATE_BID permission
