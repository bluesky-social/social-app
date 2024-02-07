// Regex for base32 string for testing reset code
const RESET_CODE_REGEX = /^[A-Z2-7]{5}-[A-Z2-7]{5}$/

export function checkAndFormatResetCode(code: string): string | false {
  // Trim the reset code
  let fixed = code.trim().toUpperCase()

  // Add a dash if needed
  if (fixed.length === 10) {
    fixed = `${fixed.slice(0, 5)}-${fixed.slice(5, 10)}`
  }

  // Check that it is a valid format
  if (!RESET_CODE_REGEX.test(fixed)) {
    return false
  }

  return fixed
}
