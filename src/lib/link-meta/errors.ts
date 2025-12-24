/**
 * Custom error classes for specific link metadata errors we need to handle differently
 */

/**
 * Thrown when a URL contains a host IP address, which is not allowed
 * This is a security restriction to prevent access to internal/private IPs
 */
export class InvalidUrlHostIPError extends Error {
  constructor(
    message: string = 'Invalid URL: host IP addresses are not allowed',
  ) {
    super(message)
    this.name = 'InvalidUrlHostIPError'
  }
}

/**
 * Thrown when a URL is malformed or invalid (but not specifically due to host IP)
 */
export class InvalidUrlError extends Error {
  constructor(message: string = 'Invalid URL') {
    super(message)
    this.name = 'InvalidUrlError'
  }
}
