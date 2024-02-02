// Regex for base32 string for testing reset code
const CODE_REGEX = /^[A-Z2-7]{5}-[A-Z2-7]{5}$/

export function checkAndFormatCode(code: string): string | false {
  // Trim the reset code
  const fixed = code.trim().toUpperCase()

  // Check that it is a valid format
  if (!CODE_REGEX.test(fixed)) {
    return false
  }

  return fixed
}
