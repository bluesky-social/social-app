import React from 'react'
import {useQuery} from '@tanstack/react-query'
// @ts-ignore
import {createFromFetch} from 'react-server-dom-webpack/client'

import {STALE} from 'state/queries'
import {Text} from '#/components/Typography'
import {ActorLabel} from './ActorLabel'
import {Avatar} from './Avatar'
import {Box} from './Box'
import {Embed} from './Embed'
import {Expandable} from './Expandable'
import {Label} from './Label'
import {Stack} from './Stack'
import {Tabs} from './Tabs'

// TODO
export const VOCAB: Record<string, React.ComponentType<any>> = {
  ActorLabel,
  Avatar,
  Box,
  Embed,
  Expandable,
  Label,
  Stack,
  Tabs,
}

export function AppComponent({origin}: {origin: string}) {
  const {data} = useQuery({
    queryKey: ['sdui', origin],
    queryFn: async () => {
      const {root} = await createFromFetch(
        fetch(origin, {
          headers: {
            Accept: 'text/x-component',
          },
        }),
      )
      return {root}
    },
    staleTime: STALE.INFINITY,
  })

  console.log(data)
  if (!data) {
    return null // TODO
  }
  return <Text>{data.root}</Text>
}
