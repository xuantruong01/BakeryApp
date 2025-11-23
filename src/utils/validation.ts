/**
 * Validation utility functions for form inputs
 */

/**
 * Validate email format using regex
 * @param email - Email string to validate
 * @returns true if valid, false otherwise
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate Vietnam phone number format
 * Expected format: 0xxxxxxxxx (10 digits starting with 0)
 * @param phone - Phone number string to validate
 * @returns true if valid, false otherwise
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(0[0-9]{9})$/;
  return phoneRegex.test(phone.trim());
};

/**
 * Validate password strength
 * Requirements: minimum 6 characters
 * @param password - Password string to validate
 * @returns Object with isValid boolean and strength level
 */
export const validatePassword = (
  password: string
): { isValid: boolean; strength: "weak" | "medium" | "strong" } => {
  const trimmed = password.trim();

  if (trimmed.length < 6) {
    return { isValid: false, strength: "weak" };
  }

  // Check for password strength
  const hasUpperCase = /[A-Z]/.test(trimmed);
  const hasLowerCase = /[a-z]/.test(trimmed);
  const hasNumbers = /\d/.test(trimmed);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(trimmed);

  const strengthScore =
    (hasUpperCase ? 1 : 0) +
    (hasLowerCase ? 1 : 0) +
    (hasNumbers ? 1 : 0) +
    (hasSpecialChar ? 1 : 0);

  let strength: "weak" | "medium" | "strong" = "weak";
  if (strengthScore >= 3 && trimmed.length >= 8) {
    strength = "strong";
  } else if (strengthScore >= 2 || trimmed.length >= 8) {
    strength = "medium";
  }

  return { isValid: true, strength };
};

/**
 * Validate if a string is not empty
 * @param value - String to validate
 * @returns true if not empty, false otherwise
 */
export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Validate minimum length
 * @param value - String to validate
 * @param minLength - Minimum required length
 * @returns true if meets minimum length, false otherwise
 */
export const validateMinLength = (
  value: string,
  minLength: number
): boolean => {
  return value.trim().length >= minLength;
};

/**
 * Validate maximum length
 * @param value - String to validate
 * @param maxLength - Maximum allowed length
 * @returns true if within maximum length, false otherwise
 */
export const validateMaxLength = (
  value: string,
  maxLength: number
): boolean => {
  return value.trim().length <= maxLength;
};
