import React from 'react'

import {DialogProps} from '#/view/com/Dialog/types'

export function Outer(props: React.PropsWithChildren<DialogProps>) {
  return null
}

export function Inner(props: React.PropsWithChildren<{}>) {
  return null
}

export function Header(props: React.PropsWithChildren<{ title: string }>) {
  return null
}

export function Close() {
  return null
}
