import {type ReactNode, useCallback, useMemo} from 'react'
import {View} from 'react-native'
import {Trans} from '@lingui/macro'

import {type Nux, useNux, useSaveNux} from '#/state/queries/nuxs'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {Text} from '#/components/Typography'

export function useForceClose() {
  const {close} = Dialog.useDialogContext()
  return useCallback(
    (cb?: () => void) => {
      close(cb, true)
    },
    [close],
  )
}

export function useAnnouncementState({id}: {id: Nux}) {
  const nux = useNux(id)
  const {mutate: save, variables} = useSaveNux()
  const optimisticallyCompleted = !!variables?.completed
  return useMemo(
    () => ({
      /**
       * Until data has loaded, assumed completed
       */
      completed:
        optimisticallyCompleted || nux.status === 'ready'
          ? nux.nux?.completed === true
          : true,
      complete() {
        save({
          id,
          completed: true,
          data: undefined,
        })
      },
    }),
    [id, nux, save, optimisticallyCompleted],
  )
}

export function BlockingAnnouncementDialogOuter({
  children,
}: {
  children: ReactNode
}) {
  const {signinDialogControl: control} = useGlobalDialogsControlContext()

  Dialog.useAutoOpen(control, 1e3)

  return (
    <Dialog.Outer preventDismiss control={control}>
      <Dialog.Handle />
      {children}
    </Dialog.Outer>
  )
}

export function AnnouncementBadge() {
  const t = useTheme()
  return (
    <View style={[a.align_start]}>
      <View
        style={[
          a.pl_md,
          a.pr_lg,
          a.py_sm,
          a.rounded_full,
          a.flex_row,
          a.align_center,
          a.gap_xs,
          {
            backgroundColor: t.palette.primary_25,
          },
        ]}>
        <Logo fill={t.palette.primary_600} width={14} />
        <Text
          style={[
            a.font_bold,
            {
              color: t.palette.primary_600,
            },
          ]}>
          <Trans>Announcement</Trans>
        </Text>
      </View>
    </View>
  )
}
