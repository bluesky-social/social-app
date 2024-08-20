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

  const meta = React.useMemo(
    () => ({
      isNoPwi: !!modui.blurs.find(
        cause =>
          cause.type === 'label' &&
          cause.labelDef.identifier === '!no-unauthenticated',
      ),
      noOverride: modui.noOverride,
    }),
    [modui],
  )

  const showInfoDialog = React.useCallback(() => {
    control.open()
  }, [control])

  const onSetContentVisible = React.useCallback(
    (show: boolean) => {
      if (meta.noOverride) return
      setIsContentVisible(show)
    },
    [setIsContentVisible, meta],
  )

  const ctx = React.useMemo(
    () => ({
      isContentVisible,
      setIsContentVisible: onSetContentVisible,
      showInfoDialog,
      info,
      meta,
    }),
    [isContentVisible, onSetContentVisible, info, meta, showInfoDialog],
  )

  return (
    <Context.Provider value={ctx}>
      {children}
      <ModerationDetailsDialog control={control} modcause={blur} />
    </Context.Provider>
  )
}

export function Content({
  children,
}: {
  children: (context: Context) => React.ReactNode
}) {
  const ctx = React.useContext(Context)
  const child = React.useMemo(() => children(ctx), [ctx, children])
  return ctx.isContentVisible ? child : null
}

export function Mask({
  children,
}: {
  children: (context: Context) => React.ReactNode
}) {
  const ctx = React.useContext(Context)
  const child = React.useMemo(() => children(ctx), [ctx, children])
  return !ctx.isContentVisible ? child : null
}
