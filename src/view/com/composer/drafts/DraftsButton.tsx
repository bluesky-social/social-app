import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type StoredDraft, useDrafts} from '#/state/drafts'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {PageText_Stroke2_Corner0_Rounded as DraftIcon} from '#/components/icons/PageText'
import {Text} from '#/components/Typography'
import {DraftsListDialog} from './DraftsListDialog'

export function DraftsButton({
  onSelectDraft,
}: {
  onSelectDraft: (draft: StoredDraft) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogControl()
  const {data: drafts, isLoading} = useDrafts()

  const hasDrafts = drafts && drafts.length > 0

  if (isLoading || !hasDrafts) {
    return null
  }

  return (
    <>
      <Button
        label={_(msg`See drafts`)}
        variant="ghost"
        color="primary"
        shape="default"
        size="small"
        style={[a.rounded_full, a.py_xs, a.px_sm, a.ml_xs]}
        onPress={() => control.open()}>
        <DraftIcon size="sm" style={[t.atoms.text_contrast_medium]} />
        <ButtonText style={[a.text_sm]}>
          <Trans>Drafts</Trans>
        </ButtonText>
        <View
          style={[
            a.rounded_full,
            a.px_xs,
            a.ml_2xs,
            {backgroundColor: t.palette.primary_500},
          ]}>
          <Text style={[a.text_xs, a.font_bold, {color: t.palette.white}]}>
            {drafts.length}
          </Text>
        </View>
      </Button>
      <DraftsListDialog control={control} onSelectDraft={onSelectDraft} />
    </>
  )
}
