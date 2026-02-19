// Utility functions

export const formatDate = (date: string | Date): string => {
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return String(date);
  }
};

export const formatDateTime = (date: string | Date): string => {
  try {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(date);
  }
};

export const formatCurrency = (amount: number, currency: string = 'AED'): string => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Validates if a string is a valid MongoDB ObjectId or a valid ID
 * Rejects common invalid values like "create", "new", etc.
 */
export const isValidId = (id: string | undefined): id is string => {
  if (!id || typeof id !== 'string') return false;
  
  // Reject common invalid route values
  const invalidValues = ['create', 'new', 'edit', 'delete', 'update'];
  if (invalidValues.includes(id.toLowerCase())) return false;
  
  // MongoDB ObjectId is 24 hex characters
  // But we'll also accept any non-empty string that's not in the invalid list
  // and doesn't contain special characters that would break routes
  if (id.trim().length === 0) return false;
  
  // Check if it looks like a MongoDB ObjectId (24 hex chars)
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  if (objectIdPattern.test(id)) return true;
  
  // Also accept other valid ID formats (UUIDs, etc.)
  // But reject anything with slashes or other problematic chars
  if (id.includes('/') || id.includes('\\') || id.includes('..')) return false;
  
  return true;
};