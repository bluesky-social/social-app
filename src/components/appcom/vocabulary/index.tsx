import React from 'react'

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
  // TODO
  return <Text>{origin}</Text>
}
