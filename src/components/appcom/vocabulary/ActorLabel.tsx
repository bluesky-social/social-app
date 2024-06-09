import React from 'react'
import {AtUri} from '@atproto/api'
import {z} from 'zod'

import {useProfileQuery} from '#/state/queries/profile'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {color} from './common'
import {Label} from './Label'

const actorLabelProps = z.object({
  uri: z.string(),
  field: z.enum(['handle', 'displayName', 'description']),
  color,
  size: z
    .number()
    .positive()
    .default(16)
    .transform(v => ({fontSize: v})),
  lineHeight: z
    .number()
    .positive()
    .default(1)
    .transform(v => ({lineHeight: v})),
  weight: z
    .enum(['normal', 'semibold', 'bold'])
    .default('normal')
    .transform(v => ({fontWeight: v})),
})

export type ActorLabelProps = z.infer<typeof actorLabelProps>

export function ActorLabel(props: React.PropsWithChildren<ActorLabelProps>) {
  const propsParsed = actorLabelProps.parse(props)
  const urip = new AtUri(propsParsed.uri)

  const {data: did} = useResolveDidQuery(urip.host)
  const {data: profile} = useProfileQuery({did})

  let text = ''
  if (profile) {
    if (props.field === 'handle') {
      text = profile.handle
    }
    if (props.field === 'displayName') {
      text = profile.displayName || profile.handle
    }
    if (props.field === 'description') {
      text = profile.description || ''
    }
  }

  // TODO loading, error
  return <Label {...props} text={text} />
}
