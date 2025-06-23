import type React from 'react'

import {type ViewStyleProp} from '#/alf'

export type ProfileHoverCardProps = ViewStyleProp & {
  children: React.ReactNode
  did: string
  disable?: boolean
}
