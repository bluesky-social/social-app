import {type PartPlan} from './types'

/**
 * Splits a file of `totalSize` bytes into parts of at most `partSize` bytes.
 * The last part carries the remainder. Part numbers are 1-indexed. Returns an
 * empty list for a non-positive size.
 */
export function planParts(totalSize: number, partSize: number): PartPlan[] {
  if (partSize <= 0) {
    throw new Error('partSize must be positive')
  }
  const parts: PartPlan[] = []
  let offset = 0
  let partNumber = 1
  while (offset < totalSize) {
    const size = Math.min(partSize, totalSize - offset)
    parts.push({partNumber, offset, size})
    offset += size
    partNumber += 1
  }
  return parts
}

export function getMissingParts(
  parts: PartPlan[],
  receivedPartNumbers: number[],
): PartPlan[] {
  const received = new Set(receivedPartNumbers)
  return parts.filter(part => !received.has(part.partNumber))
}
