import {useCallback} from 'react'
import {View} from 'react-native'
import {TID} from '@atproto/common-web'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useBrand} from '#/lib/community/BrandContext'
import {useOverwriteSavedFeedsMutation} from '#/state/queries/preferences'
import {type UsePreferencesQueryResponse} from '#/state/queries/preferences'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useHeaderOffset} from '#/components/hooks/useHeaderOffset'
import {ListSparkle_Stroke2_Corner0_Rounded as ListSparkle} from '#/components/icons/ListSparkle'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

export function NoFeedsPinned({
  preferences,
}: {
  preferences: UsePreferencesQueryResponse
}) {
  const {_} = useLingui()
  const headerOffset = useHeaderOffset()
  const brand = useBrand()
  const {isPending, mutateAsync: overwriteSavedFeeds} =
    useOverwriteSavedFeedsMutation()

  const addRecommendedFeeds = useCallback(async () => {
    const defaults = brand.feeds.defaultPinned
    const defaultValues = new Set(defaults.map(f => f.value))

    // Remove first instance of each default feed, since we're going to
    // prepend them as pinned.
    const removed = new Set<string>()
    const remainingSavedFeeds = preferences.savedFeeds.filter(savedFeed => {
      if (defaultValues.has(savedFeed.value) && !removed.has(savedFeed.value)) {
        removed.add(savedFeed.value)
        return false
      }
      return true
    })

    const toSave = [
      ...defaults.map(f => ({
        ...f,
        pinned: true,
        id: TID.nextStr(),
      })),
      ...remainingSavedFeeds,
    ]

    await overwriteSavedFeeds(toSave)
  }, [overwriteSavedFeeds, preferences.savedFeeds, brand.feeds.defaultPinned])

  return (
    <CenteredView sideBorders style={[a.h_full_vh]}>
      <View
        style={[
          a.align_center,
          a.h_full_vh,
          a.py_3xl,
          a.px_xl,
          {
            paddingTop: headerOffset + a.py_3xl.paddingTop,
          },
        ]}>
        <View style={[a.align_center, a.gap_sm, a.pb_xl]}>
          <Text style={[a.text_xl, a.font_semi_bold]}>
            <Trans>Whoops!</Trans>
          </Text>
          <Text
            style={[a.text_md, a.text_center, a.leading_snug, {maxWidth: 340}]}>
            <Trans>
              Looks like you unpinned all your feeds. But don't worry, you can
              add some below 😄
            </Trans>
          </Text>
        </View>

        <View style={[a.flex_row, a.gap_md, a.justify_center, a.flex_wrap]}>
          <Button
            disabled={isPending}
            label={_(msg`Apply default recommended feeds`)}
            size="large"
            variant="solid"
            color="primary"
            onPress={addRecommendedFeeds}>
            <ButtonIcon icon={Plus} position="left" />
            <ButtonText>{_(msg`Add recommended feeds`)}</ButtonText>
          </Button>

          <Link
            label={_(msg`Browse other feeds`)}
            to="/feeds"
            size="large"
            variant="solid"
            color="secondary">
            <ButtonIcon icon={ListSparkle} position="left" />
            <ButtonText>{_(msg`Browse other feeds`)}</ButtonText>
          </Link>
        </View>
      </View>
    </CenteredView>
  )
}
