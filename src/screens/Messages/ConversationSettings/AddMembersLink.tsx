import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {logger} from '#/logger'
import {useAddGroupMembers} from '#/state/queries/messages/add-group-members'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {AddMembersFlow} from '#/components/dms/AddMembersFlow'
import {type ConvoWithDetails} from '#/components/dms/util'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronIcon} from '#/components/icons/Chevron'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'

export function AddMembersLink({
  convo,
}: {
  convo: Extract<ConvoWithDetails, {kind: 'group'}>
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const addMembersControl = Dialog.useDialogControl()

  const convoId = convo.view.id
  const {mutate: addGroupMembers, isPending: isAddPending} = useAddGroupMembers(
    convoId,
    {
      onSuccess: () => {
        addMembersControl.close()
      },
      onError: e => {
        logger.error('Failed to add group chat members', {message: e})
        Toast.show(l`Failed to add members`, {type: 'error'})
      },
    },
  )

  return (
    <>
      <Button
        disabled={isAddPending}
        label={l`Add members`}
        onPress={addMembersControl.open}>
        {({interacting}) => (
          <View
            style={[
              a.w_full,
              a.flex_row,
              a.align_center,
              a.justify_between,
              a.px_xl,
              a.py_sm,
              interacting ? [t.atoms.bg_contrast_25] : [],
            ]}>
            <View style={[a.flex_row, a.align_center]}>
              <View
                style={[
                  a.flex_row,
                  a.align_center,
                  a.justify_center,
                  a.p_lg,
                  a.rounded_full,
                  interacting
                    ? t.atoms.bg_contrast_100
                    : t.atoms.bg_contrast_50,
                  {
                    height: 48,
                    width: 48,
                  },
                ]}>
                <PlusIcon style={[t.atoms.text_contrast_high]} size="sm" />
              </View>
              <Text
                numberOfLines={1}
                style={[a.text_md, a.font_semi_bold, a.mx_sm, t.atoms.text]}>
                <Trans>Add members</Trans>
              </Text>
            </View>
            {isAddPending ? (
              <Loader size="md" />
            ) : (
              <ChevronIcon style={[t.atoms.text_contrast_medium]} size="md" />
            )}
          </View>
        )}
      </Button>

      <Dialog.Outer
        control={addMembersControl}
        testID="addChatMembersDialog"
        nativeOptions={{fullHeight: true}}>
        <Dialog.Handle />
        <AddMembersFlow
          convo={convo}
          title={l`Add members`}
          onAddMembers={(members, profiles) => {
            addGroupMembers({members, profiles})
          }}
        />
      </Dialog.Outer>
    </>
  )
}
