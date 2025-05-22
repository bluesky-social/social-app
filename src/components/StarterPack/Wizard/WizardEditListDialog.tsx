import {useRef} from 'react'
import {type ListRenderItemInfo} from 'react-native'
import {View} from 'react-native'
import {
  type AppBskyActorDefs,
  type AppBskyFeedDefs,
  type ModerationOpts,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {isWeb} from '#/platform/detection'
import {useSession} from '#/state/session'
import {type ListMethods} from '#/view/com/util/List'
import {
  type WizardAction,
  type WizardState,
} from '#/screens/StarterPack/Wizard/State'
import {atoms as a, native, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {
  WizardFeedCard,
  WizardProfileCard,
} from '#/components/StarterPack/Wizard/WizardListCard'
import {Text} from '#/components/Typography'

function keyExtractor(
  item: AppBskyActorDefs.ProfileViewBasic | AppBskyFeedDefs.GeneratorView,
  index: number,
) {
  return `${item.did}-${index}`
}

export function WizardEditListDialog({
  control,
  state,
  dispatch,
  moderationOpts,
  profile,
}: {
  control: Dialog.DialogControlProps
  state: WizardState
  dispatch: (action: WizardAction) => void
  moderationOpts: ModerationOpts
  profile: AppBskyActorDefs.ProfileViewDetailed
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()
  const initialNumToRender = useInitialNumToRender()

  const listRef = useRef<ListMethods>(null)

  const getData = () => {
    if (state.currentStep === 'Feeds') return state.feeds

    return [
      profile,
      ...state.profiles.filter(p => p.did !== currentAccount?.did),
    ]
  }

  const renderItem = ({item}: ListRenderItemInfo<any>) =>
    state.currentStep === 'Profiles' ? (
      <WizardProfileCard
        profile={item}
        btnType="remove"
        state={state}
        dispatch={dispatch}
        moderationOpts={moderationOpts}
      />
    ) : (
      <WizardFeedCard
        generator={item}
        btnType="remove"
        state={state}
        dispatch={dispatch}
        moderationOpts={moderationOpts}
      />
    )

  return (
    <Dialog.Outer control={control} testID="newChatDialog">
      <Dialog.Handle />
      <Dialog.InnerFlatList
        ref={listRef}
        data={getData()}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={
          <View
            style={[
              native(a.pt_4xl),
              a.flex_row,
              a.justify_between,
              a.border_b,
              a.px_sm,
              a.mb_sm,
              t.atoms.bg,
              t.atoms.border_contrast_medium,
              isWeb
                ? [
                    a.align_center,
                    {
                      height: 48,
                    },
                  ]
                : [a.pb_sm, a.align_end],
            ]}>
            <View style={{width: 60}} />
            <Text style={[a.font_bold, a.text_xl]}>
              {state.currentStep === 'Profiles' ? (
                <Trans>Edit People</Trans>
              ) : (
                <Trans>Edit Feeds</Trans>
              )}
            </Text>
            <View style={{width: 60}}>
              {isWeb && (
                <Button
                  label={_(msg`Close`)}
                  variant="ghost"
                  color="primary"
                  size="small"
                  onPress={() => control.close()}>
                  <ButtonText>
                    <Trans>Close</Trans>
                  </ButtonText>
                </Button>
              )}
            </View>
          </View>
        }
        stickyHeaderIndices={[0]}
        style={[
          web([a.py_0, {height: '100vh', maxHeight: 600}, a.px_0]),
          native({
            height: '100%',
            paddingHorizontal: 0,
            marginTop: 0,
            paddingTop: 0,
          }),
        ]}
        webInnerStyle={[a.py_0, {maxWidth: 500, minWidth: 200}]}
        keyboardDismissMode="on-drag"
        removeClippedSubviews={true}
        initialNumToRender={initialNumToRender}
      />
    </Dialog.Outer>
  )
}
