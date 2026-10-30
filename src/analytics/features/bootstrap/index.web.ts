import {type FeatureApiResponse} from '@growthbook/growthbook'
import {z} from 'zod'

/** Match GrowthBook's four-hour cache lifetime without expiring unchanged gates. */
const MAX_AGE = 4 * 60 * 60 * 1000

const dateSchema = z
  .string()
  .refine(value => Number.isFinite(Date.parse(value)))
const featureSchema = z
  .object({
    rules: z.array(z.record(z.unknown())).optional(),
  })
  .passthrough()
const payloadSchema = z
  .object({
    features: z.record(featureSchema),
    dateUpdated: dateSchema,
    savedGroups: z
      .record(z.array(z.union([z.string(), z.number()])))
      .optional(),
  })
  .passthrough()

/** Read the optional public snapshot before the deferred app bundle initializes. */
export function readFeatureBootstrap({
  apiHost,
  clientKey,
}: {
  apiHost: string
  clientKey: string
}): FeatureApiResponse | undefined {
  if (typeof document === 'undefined') return undefined
  const text = document.getElementById('bsky-app-config')?.textContent
  if (!text) return undefined

  try {
    const data: unknown = JSON.parse(text)
    const result = z
      .object({
        schemaVersion: z.literal(1),
        apiHost: z.literal(apiHost.replace(/\/+$/, '')),
        clientKey: z.literal(clientKey),
        fetchedAt: dateSchema,
        payload: payloadSchema,
      })
      .safeParse(data)
    if (
      !result.success ||
      Date.now() - Date.parse(result.data.fetchedAt) > MAX_AGE
    ) {
      return undefined
    }
    return result.data.payload
  } catch {
    // A missing or invalid snapshot must never prevent the app from starting.
    return undefined
  }
}
