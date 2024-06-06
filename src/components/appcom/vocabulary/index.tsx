import React from 'react'

import type {AppComNode} from '../types'
import {Box} from './Box'
import {Expandable} from './Expandable'
import {Label} from './Label'
import {Stack} from './Stack'
import {Tabs} from './Tabs'

export const VOCAB: Record<string, React.ComponentType<any>> = {
  Box,
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
    <Com {...node.props}>
      {node.children?.length
        ? node.children.map((child, i) => (
            <AppComponent key={child.key || String(i)} node={child} />
          ))
        : null}
    </Com>
  )
}
