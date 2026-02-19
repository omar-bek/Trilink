# ResponsiveTable Acceptance Test Cases

## Overview
This document outlines acceptance test cases for the ResponsiveTable component to ensure all data tables are mobile-safe.

## Test Environment Setup
- Desktop viewport: ≥1024px width
- Mobile viewport: <1024px width
- Test browsers: Chrome, Firefox, Safari, Edge
- Test devices: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)

---

## Test Case 1: ResponsiveTable Component - Basic Functionality

### Test 1.1: Desktop Table View (≥1024px)
**Given:** User is on desktop (viewport ≥1024px)  
**When:** ResponsiveTable component is rendered  
**Then:**
- [ ] Table view is displayed (not card view)
- [ ] All columns are visible in table format
- [ ] Table headers are visible
- [ ] No horizontal scroll is present
- [ ] All data fields are preserved and visible
- [ ] Row hover effects work correctly
- [ ] Row click navigation works

**Test Data:**
- Viewport: 1920x1080
- Data: 10 rows with 8 columns

---

### Test 1.2: Mobile Card View (<1024px)
**Given:** User is on mobile (viewport <1024px)  
**When:** ResponsiveTable component is rendered  
**Then:**
- [ ] Card/List view is displayed (not table view)
- [ ] No horizontal scroll is present
- [ ] All data fields are preserved and visible
- [ ] High priority columns are shown prominently at top
- [ ] Medium and low priority columns are shown below
- [ ] Cards are stacked vertically
- [ ] Card click navigation works

**Test Data:**
- Viewport: 375x667
- Data: 10 rows with 8 columns

---

## Test Case 2: Column Priority System

### Test 2.1: High Priority Columns
**Given:** ResponsiveTable with columns of different priorities  
**When:** Viewing on mobile  
**Then:**
- [ ] High priority columns appear at the top of each card
- [ ] High priority columns are displayed prominently
- [ ] High priority columns have clear labels

**Test Data:**
- Columns: 3 high, 3 medium, 2 low priority

---

### Test 2.2: Medium and Low Priority Columns
**Given:** ResponsiveTable with medium and low priority columns  
**When:** Viewing on mobile  
**Then:**
- [ ] Medium and low priority columns appear below high priority columns
- [ ] Columns are displayed in a compact format (label: value)
- [ ] All columns are visible (no data loss)

---

## Test Case 3: Breakpoint Logic

### Test 3.1: Breakpoint at 1024px
**Given:** Viewport width is exactly 1024px  
**When:** ResponsiveTable is rendered  
**Then:**
- [ ] Table view is displayed (desktop mode)

---

### Test 3.2: Breakpoint Below 1024px
**Given:** Viewport width is 1023px  
**When:** ResponsiveTable is rendered  
**Then:**
- [ ] Card view is displayed (mobile mode)

---

### Test 3.3: Dynamic Breakpoint Change
**Given:** User resizes browser window  
**When:** Window crosses 1024px breakpoint  
**Then:**
- [ ] View switches between table and card appropriately
- [ ] No data loss during transition
- [ ] Smooth transition (no flickering)

---

## Test Case 4: RFQ List Page

### Test 4.1: Desktop Table View
**Given:** User is on RFQ List page (desktop)  
**When:** Page loads  
**Then:**
- [ ] Table view is displayed with columns: Title, Status, Type, Budget, Items, Deadline, Delivery Date, Anonymous
- [ ] All RFQ data is visible in table rows
- [ ] Clicking a row navigates to RFQ details
- [ ] No horizontal scroll

---

### Test 4.2: Mobile Card View
**Given:** User is on RFQ List page (mobile)  
**When:** Page loads  
**Then:**
- [ ] Card view is displayed using RFQListItem component
- [ ] All RFQ information is visible in cards
- [ ] Cards are stacked vertically
- [ ] No horizontal scroll
- [ ] Clicking a card navigates to RFQ details

---

## Test Case 5: Bid List Page

### Test 5.1: Desktop Table View
**Given:** User is on Bid List page (desktop)  
**When:** Page loads  
**Then:**
- [ ] Table view is displayed with columns: Bid ID, Status, Price, AI Score, Payment Terms, Delivery Date, Delivery Time, Valid Until
- [ ] All bid data is visible in table rows
- [ ] Clicking a row navigates to bid details
- [ ] No horizontal scroll

---

### Test 5.2: Mobile Card View
**Given:** User is on Bid List page (mobile)  
**When:** Page loads  
**Then:**
- [ ] Card view is displayed using BidListItem component
- [ ] All bid information is visible in cards
- [ ] No horizontal scroll

---

## Test Case 6: Contract List Page

### Test 6.1: Desktop Table View
**Given:** User is on Contract List page (desktop)  
**When:** Page loads  
**Then:**
- [ ] Table view is displayed with columns: Contract ID, Status, Amount, Parties, Signatures, Terms, Start Date, End Date
- [ ] All contract data is visible in table rows
- [ ] Clicking a row navigates to contract details
- [ ] No horizontal scroll

---

### Test 6.2: Mobile Card View
**Given:** User is on Contract List page (mobile)  
**When:** Page loads  
**Then:**
- [ ] Card view is displayed using ContractListItem component
- [ ] All contract information is visible in cards
- [ ] No horizontal scroll

---

## Test Case 7: Payment List Page

### Test 7.1: Desktop Table View
**Given:** User is on Payment List page (desktop)  
**When:** Page loads  
**Then:**
- [ ] Table view is displayed with columns: Milestone, Status, Amount, Due Date, Paid Date, VAT, Notes
- [ ] All payment data is visible in table rows
- [ ] Clicking a row navigates to payment details
- [ ] No horizontal scroll

---

### Test 7.2: Mobile Card View
**Given:** User is on Payment List page (mobile)  
**When:** Page loads  
**Then:**
- [ ] Card view is displayed using PaymentListItem component
- [ ] All payment information is visible in cards
- [ ] No horizontal scroll

---

## Test Case 8: Bid Comparison Page

### Test 8.1: Desktop Table View
**Given:** User is on Bid Comparison page (desktop)  
**When:** Page loads  
**Then:**
- [ ] Table view is displayed with columns: Rank, Bidder, Price, AI Score, Delivery Time, Delivery Date, Payment Terms, Status, Actions
- [ ] All bid comparison data is visible
- [ ] Clicking a row navigates to bid details
- [ ] No horizontal scroll

---

### Test 8.2: Mobile Card View
**Given:** User is on Bid Comparison page (mobile)  
**When:** Page loads  
**Then:**
- [ ] Card view is displayed with all bid information
- [ ] High priority columns (Rank, Bidder, Price, AI Score, Actions) are prominent
- [ ] Medium/low priority columns are shown below
- [ ] No horizontal scroll

---

## Test Case 9: Activity History Component

### Test 9.1: Desktop Table View
**Given:** User is viewing Activity History (desktop)  
**When:** Component loads  
**Then:**
- [ ] Table view is displayed with columns: Timestamp, User, Action, Status, IP Address, Details
- [ ] All activity log data is visible
- [ ] Clicking a row opens detail dialog
- [ ] No horizontal scroll

---

### Test 9.2: Mobile Card View
**Given:** User is viewing Activity History (mobile)  
**When:** Component loads  
**Then:**
- [ ] Card view is displayed with all activity information
- [ ] High priority columns (Timestamp, User, Action, Details) are prominent
- [ ] No horizontal scroll

---

## Test Case 10: Data Preservation

### Test 10.1: All Fields Visible
**Given:** Any table with multiple columns  
**When:** Viewing on both desktop and mobile  
**Then:**
- [ ] All data fields are visible (no data loss)
- [ ] No fields are hidden or truncated unnecessarily
- [ ] Long text fields use ellipsis appropriately

---

### Test 10.2: Empty State
**Given:** Table with no data  
**When:** Component renders  
**Then:**
- [ ] Empty message is displayed
- [ ] Empty message is readable on both desktop and mobile
- [ ] No errors are thrown

---

## Test Case 11: Performance

### Test 11.1: Large Dataset
**Given:** Table with 100+ rows  
**When:** Component renders  
**Then:**
- [ ] Component renders without performance issues
- [ ] Scrolling is smooth
- [ ] No memory leaks

---

## Test Case 12: Accessibility

### Test 12.1: Keyboard Navigation
**Given:** User navigates with keyboard  
**When:** Using Tab key  
**Then:**
- [ ] Table rows are focusable
- [ ] Enter key activates row click
- [ ] Focus indicators are visible

---

### Test 12.2: Screen Reader
**Given:** User uses screen reader  
**When:** Viewing table  
**Then:**
- [ ] Table headers are announced
- [ ] Row data is read correctly
- [ ] Card view labels are announced

---

## Test Case 13: Edge Cases

### Test 13.1: Very Long Text
**Given:** Table with very long text in cells  
**When:** Viewing on desktop and mobile  
**Then:**
- [ ] Text is truncated with ellipsis on desktop
- [ ] Full text is accessible on mobile cards
- [ ] No layout breaking

---

### Test 13.2: Special Characters
**Given:** Table with special characters (emojis, unicode)  
**When:** Viewing on both views  
**Then:**
- [ ] Characters render correctly
- [ ] No encoding issues

---

## Test Case 14: Custom Mobile Renderer

### Test 14.1: Custom Card Renderer
**Given:** ResponsiveTable with custom mobileCardRenderer  
**When:** Viewing on mobile  
**Then:**
- [ ] Custom renderer is used instead of default
- [ ] All data is still accessible

---

## Test Case 15: Sticky Header

### Test 15.1: Desktop Sticky Header
**Given:** Table with stickyHeader enabled  
**When:** Scrolling down  
**Then:**
- [ ] Table header remains visible at top
- [ ] Header doesn't overlap content

---

## Summary Checklist

### Core Requirements
- [x] Desktop (≥1024px): Table view
- [x] Mobile (<1024px): Card/List view
- [x] No horizontal scroll
- [x] Preserve all data fields
- [x] Column priority system
- [x] Breakpoint logic at 1024px

### Pages Updated
- [x] RFQs List
- [x] Bids List
- [x] Contracts List
- [x] Payments List
- [x] Bid Comparison
- [x] Activity History

### Components Created
- [x] ResponsiveTable component
- [x] Column priority system
- [x] Mobile card layout
- [x] Breakpoint logic

---

## Notes
- Breakpoint is set at 1024px as per requirements
- All existing ListItem components are reused for mobile view
- Table views are optimized for desktop with proper column widths
- Mobile views prioritize important information using column priority system
