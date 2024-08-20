import React from 'react'
import {ModerationUI} from '@atproto/api'

import {
  ModerationCauseDescription,
  useModerationCauseDescription,
} from '#/lib/moderation/useModerationCauseDescription'
import {
  ModerationDetailsDialog,
  useModerationDetailsDialogControl,
} from '#/components/moderation/ModerationDetailsDialog'

type Context = {
  isContentVisible: boolean
  setIsContentVisible: (show: boolean) => void
  info: ModerationCauseDescription
  showInfoDialog: () => void
  meta: {
    isNoPwi: boolean
    noOverride: boolean
  }
}

const Context = React.createContext<Context>({
  isContentVisible: false,
  setIsContentVisible: () => {},
  // @ts-ignore
  info: {},
  showInfoDialog: () => {},
  meta: {
    isNoPwi: false,
    noOverride: false,
  },
})

export const useScreenHider = () => React.useContext(Context)

export function Outer({
  modui,
  children,
}: React.PropsWithChildren<{
  modui: ModerationUI
}>) {
  const control = useModerationDetailsDialogControl()
  const blur = modui.blurs[0]
  const [isContentVisible, setIsContentVisible] = React.useState(!blur)
  const info = useModerationCauseDescription(blur)

  const meta = {
    isNoPwi: Boolean(
      modui.blurs.find(
        cause =>
          cause.type === 'label' &&
          cause.labelDef.identifier === '!no-unauthenticated',
      ),
    ),
    noOverride: modui.noOverride,
  }

  const showInfoDialog = () => {
    control.open()
  }

  const onSetContentVisible = (show: boolean) => {
    if (meta.noOverride) return
    setIsContentVisible(show)
  }

  const ctx = {
    isContentVisible,
    setIsContentVisible: onSetContentVisible,
    showInfoDialog,
    info,
    meta,
  }

  return (
    <Context.Provider value={ctx}>
      {children}
      <ModerationDetailsDialog control={control} modcause={blur} />
    </Context.Provider>
  )
}

export function Content({children}: {children: React.ReactNode}) {
  const ctx = useScreenHider()
  return ctx.isContentVisible ? children : null
}

export function Mask({children}: {children: React.ReactNode}) {
  const ctx = useScreenHider()
  return ctx.isContentVisible ? null : children
}
