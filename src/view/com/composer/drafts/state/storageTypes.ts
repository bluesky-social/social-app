export type DraftMediaState = 'pending' | 'committed'

export type DraftMediaMetadata = {
  localRefPath: string
  accountDid: string
  deviceId: string
  createdAt: string
  lastTouchedAt: string
  state: DraftMediaState
}

export type DraftMediaArtifact = {
  localRefPath: string
  metadata?: DraftMediaMetadata
  /** Best available timestamp from the underlying storage artifact. */
  fileCreatedAt?: string
}

export function isDraftMediaMetadata(
  value: unknown,
): value is DraftMediaMetadata {
  if (!value || typeof value !== 'object') return false
  const metadata = value as Partial<DraftMediaMetadata>
  return (
    typeof metadata.localRefPath === 'string' &&
    typeof metadata.accountDid === 'string' &&
    typeof metadata.deviceId === 'string' &&
    typeof metadata.createdAt === 'string' &&
    typeof metadata.lastTouchedAt === 'string' &&
    (metadata.state === 'pending' || metadata.state === 'committed')
  )
}
