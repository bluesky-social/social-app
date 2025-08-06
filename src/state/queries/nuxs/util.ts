import {type AppGndrActorDefs, nuxSchema} from '@gander-social-atproto/api'

import {
  type AppNux,
  type Nux,
  nuxNames,
  NuxSchemas,
} from '#/state/queries/nuxs/definitions'

export function parseAppNux(nux: AppGndrActorDefs.Nux): AppNux | undefined {
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

export function serializeAppNux(nux: AppNux): AppGndrActorDefs.Nux {
  const {data, ...rest} = nux
  const schema = NuxSchemas[nux.id as Nux]

  const result: AppGndrActorDefs.Nux = {
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
