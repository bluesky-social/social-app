import React from 'react'
import {View} from 'react-native'
import {ErrorBoundary} from 'react-error-boundary'
import {ZodError} from 'zod'

import {Text} from '#/components/Typography'
import type {AppComNode} from '../types'
import {Box} from './Box'
import {Embed} from './Embed'
import {Expandable} from './Expandable'
import {Label} from './Label'
import {Stack} from './Stack'
import {Tabs} from './Tabs'

export const VOCAB: Record<string, React.ComponentType<any>> = {
  Box,
  Embed,
  Expandable,
  Label,
  Stack,
  Tabs,
}

export function AppComponent({node}: {node: AppComNode}) {
  const Com = VOCAB[node.type]
  if (!Com) {
    console.error('Unknown component:', node.type)
    return <></>
  }
  return (
    <ErrorBoundary fallbackRender={fallbackRender}>
      <Com {...node.props}>
        {node.children?.length
          ? node.children.map((child, i) => (
              <AppComponent key={child.key || String(i)} node={child} />
            ))
          : null}
      </Com>
    </ErrorBoundary>
  )
}
function fallbackRender({error}: {error: Error}) {
  const msg =
    error instanceof ZodError
      ? `${error.issues[0].path.join('.')}: ${error.issues[0].message}`
      : error.toString()
  return (
    <View>
      <Text>{msg}</Text>
    </View>
  )
}
