export function runWithSessionCredentialLock<T>({
  accountDids,
  operation,
}: {
  accountDids: string[]
  operation: () => T | Promise<T>
}): Promise<T> {
  void accountDids
  try {
    return Promise.resolve(operation())
  } catch (error) {
    return Promise.reject(
      error instanceof Error
        ? error
        : new Error('Session credential operation failed', {cause: error}),
    )
  }
}
