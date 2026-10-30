let queue: Promise<void> = Promise.resolve()
const protectedRefs = new Map<string, number>()

/** Serialize media lifecycle operations so a sweep cannot race a save touch. */
export function serializeDraftMediaOperation<T>(
  operation: () => Promise<T>,
): Promise<T> {
  const result = queue.then(operation, operation)
  queue = result.then(
    () => undefined,
    () => undefined,
  )
  return result
}

/** Protect refs synchronously while their pending metadata touch waits on the lock. */
export function prepareDraftMediaOperation<T>(
  refs: Iterable<string>,
  operation: () => Promise<T>,
): Promise<T> {
  const protectedByOperation = Array.from(new Set(refs))
  for (const ref of protectedByOperation) {
    protectedRefs.set(ref, (protectedRefs.get(ref) ?? 0) + 1)
  }

  return serializeDraftMediaOperation(operation).finally(() => {
    for (const ref of protectedByOperation) {
      const count = protectedRefs.get(ref) ?? 0
      if (count <= 1) protectedRefs.delete(ref)
      else protectedRefs.set(ref, count - 1)
    }
  })
}

export function isDraftMediaRefProtected(localRefPath: string): boolean {
  return protectedRefs.has(localRefPath)
}
