import {nuxSchema} from '@bsky.app/sdk/utils'

import {
  type AppNux,
  type Nux,
  nuxNames,
  NuxSchemas,
} from '#/state/queries/nuxs/definitions'
import {type app} from '#/lexicons'

export function parseAppNux(nux: app.bsky.actor.defs.Nux): AppNux | undefined {
  if (!nuxNames.has(nux.id as Nux)) return
  if (!nuxSchema.safeParse(nux).success) return

  const {data, ...rest} = nux

  const schema = NuxSchemas[nux.id as Nux]

  if (schema && data) {
    const parsedData = JSON.parse(data)

    if (!schema.safeParse(parsedData).success) return

    return {
      ...rest,
      data: parsedData,
    } as AppNux
  }

  return {
    ...rest,
    data: undefined,
  } as AppNux
}

export function serializeAppNux(nux: AppNux): app.bsky.actor.defs.Nux {
  const {data, ...rest} = nux
  const schema = NuxSchemas[nux.id]

  const result: app.bsky.actor.defs.Nux = {
    ...rest,
    data: undefined,
  }

  if (schema) {
    schema.parse(data)
    result.data = JSON.stringify(data)
  }

  nuxSchema.parse(result)

  return result
}
