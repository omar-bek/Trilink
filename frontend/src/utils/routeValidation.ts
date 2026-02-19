/**
 * Validates route parameters to prevent invalid IDs
 * Rejects common invalid values like "create", "new", "undefined", "null", etc.
 */
export const isValidId = (id: string | undefined | null): id is string => {
  if (!id) return false;
  
  const invalidValues = ['create', 'new', 'edit', 'undefined', 'null', 'null', ''];
  if (invalidValues.includes(id.toLowerCase())) {
    return false;
  }
  
  // MongoDB ObjectId format: 24 hex characters
  // UUID format: 8-4-4-4-12 hex characters with dashes
  // Allow both formats
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  
  return objectIdPattern.test(id) || uuidPattern.test(id);
};

/**
 * Gets a valid ID from route parameter, returns undefined if invalid
 */
export const getValidId = (id: string | undefined | null): string | undefined => {
  return isValidId(id) ? id : undefined;
};
