/** A supplied hyphen requires the email code format; otherwise accept alphanumerics. */
const RESET_CODE_REGEX = /^(?:[A-Z0-9]+|[A-Z0-9]{5}-[A-Z0-9]{5})$/i

export function checkAndFormatResetCode(code: string): string | false {
  // Trim the reset code
  const fixed = code.trim().toUpperCase()

  // Check that it is a valid format
  if (!RESET_CODE_REGEX.test(fixed)) {
    return false
  }

  return fixed
}
