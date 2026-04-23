import {Pressable, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {logger} from '#/logger'
import {useAddGroupMembers} from '#/state/queries/messages/add-group-members'
import {atoms as a, useTheme, web} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {AddMembersFlow} from '#/components/dms/AddMembersFlow'
import {type ConvoWithDetails} from '#/components/dms/util'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronIcon} from '#/components/icons/Chevron'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {ROW_SPACING} from './constants'
import {SubtleHoverWrapper} from './SubtleHoverWrapper'

export function AddMembersLink({
  convo,
  members,
}: {
  convo: ConvoWithDetails
  members: string[]
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const addMembersControl = Dialog.useDialogControl()

  const convoId = convo.view.id
  const {mutate: addGroupMembers} = useAddGroupMembers(convoId, {
    onSuccess: () => {
      addMembersControl.close()
    },
    onError: e => {
      logger.error('Failed to add group chat members', {message: e})
      Toast.show(l`Failed to add members`, {type: 'error'})
    },
  })

  return (
    <>
      <SubtleHoverWrapper>
        <View
          style={[
            a.mx_xl,
            {
              marginVertical: ROW_SPACING,
            },
          ]}>
          <Pressable
            accessibilityRole="button"
            style={({pressed}) => [
              a.flex_row,
              a.align_center,
              a.justify_between,
              pressed && web({outline: 'none'}),
            ]}
            onPress={addMembersControl.open}>
            {({pressed}) => (
              <>
                <View>
                  <View style={[a.flex_row, a.align_center]}>
                    <View
                      style={[
                        a.flex_row,
                        a.align_center,
                        a.justify_center,
                        a.p_lg,
                        a.rounded_full,
                        pressed
                          ? t.atoms.bg_contrast_100
                          : t.atoms.bg_contrast_50,
                        {
                          height: 48,
                          width: 48,
                        },
                      ]}>
                      <PlusIcon
                        style={[t.atoms.text_contrast_high]}
                        size="sm"
                      />
                    </View>
                    <Text
                      style={[
                        a.text_md,
                        a.font_semi_bold,
                        a.pl_sm,
                        t.atoms.text,
                      ]}>
                      <Trans>Add members</Trans>
                    </Text>
                  </View>
                </View>
                <ChevronIcon style={[t.atoms.text_contrast_medium]} size="md" />
              </>
            )}
          </Pressable>
        </View>
      </SubtleHoverWrapper>

      <Dialog.Outer
        control={addMembersControl}
        testID="addChatMembersDialog"
        nativeOptions={{fullHeight: true}}>
        <Dialog.Handle />
        <AddMembersFlow
          members={members}
          title={l`Add members`}
          onAddMembers={members => {
            addGroupMembers({members})
          }}
        />
      </Dialog.Outer>
    </>
  )
}
