import * as React from 'react'

import { ExpoProTextViewProps } from './ExpoProText.types'

export default function ExpoProTextView(props: ExpoProTextViewProps) {
  return (
    <div>
      <span>{props.name}</span>
    </div>
  )
}
