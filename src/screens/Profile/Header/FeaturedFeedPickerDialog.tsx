import {Pressable, View} from 'react-native'
import {type AppBskyFeedDefs} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {useProfileFeedgensQuery} from '#/state/queries/profile-feedgens'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function FeaturedFeedPickerDialog({
  control,
  did,
  selectedUri,
  onSelect,
}: {
  control: Dialog.DialogControlProps
  did: string
  selectedUri?: string
  onSelect: (uri: string | undefined) => void
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <DialogInner did={did} selectedUri={selectedUri} onSelect={onSelect} />
    </Dialog.Outer>
  )
}

function DialogInner({
  did,
  selectedUri,
  onSelect,
}: {
  did: string
  selectedUri?: string
  onSelect: (uri: string | undefined) => void
}) {
  const {t: l} = useLingui()
  const control = Dialog.useDialogContext()
  const {data, isLoading, isError} = useProfileFeedgensQuery(did)
  const feeds = data?.pages.flatMap(page => page.feeds) ?? []

  const select = (uri: string | undefined) => {
    control.close(() => onSelect(uri))
  }

  return (
    <Dialog.ScrollableInner label={l`Choose a featured feed`}>
      <View style={[a.gap_sm, a.pb_lg]}>
        <Text style={[a.text_xl, a.font_bold]}>
          <Trans>Featured feed</Trans>
        </Text>
        <Text style={[a.text_sm, a.leading_snug]}>
          <Trans>
            Pick one of your feeds to greet visitors on your profile. They will
            see this feed first instead of your latest posts.
          </Trans>
        </Text>
      </View>

      <View style={[a.gap_xs]}>
        <FeedRow
          label={l`Latest posts`}
          description={l`Default reverse-chronological view`}
          isSelected={!selectedUri}
          onPress={() => select(undefined)}
        />

        {isLoading ? (
          <View style={[a.py_lg, a.align_center]}>
            <Loader size="lg" />
          </View>
        ) : isError ? (
          <View style={[a.py_lg]}>
            <Text style={[a.text_center]}>
              <Trans>We could not load your feeds.</Trans>
            </Text>
          </View>
        ) : feeds.length === 0 ? (
          <View style={[a.py_lg]}>
            <Text style={[a.text_center]}>
              <Trans>
                You have not published any feeds yet. Create a feed to feature
                it on your profile.
              </Trans>
            </Text>
          </View>
        ) : (
          feeds.map(feed => (
            <FeedRow
              key={feed.uri}
              feed={feed}
              label={feed.displayName}
              isSelected={selectedUri === feed.uri}
              onPress={() => select(feed.uri)}
            />
          ))
        )}
      </View>

      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

function FeedRow({
  feed,
  label,
  description,
  isSelected,
  onPress,
}: {
  feed?: AppBskyFeedDefs.GeneratorView
  label: string
  description?: string
  isSelected: boolean
  onPress: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={l`Set as the featured feed for your profile`}
      onPress={onPress}
      style={[
        a.flex_row,
        a.align_center,
        a.gap_md,
        a.p_md,
        a.rounded_md,
        a.border,
        isSelected ? t.atoms.border_contrast_high : t.atoms.border_contrast_low,
        isSelected && t.atoms.bg_contrast_25,
      ]}>
      {feed ? (
        <UserAvatar type="algo" size={36} avatar={feed.avatar} />
      ) : (
        <View
          style={[
            {width: 36, height: 36},
            a.rounded_sm,
            t.atoms.bg_contrast_50,
          ]}
        />
      )}
      <View style={[a.flex_1, a.gap_2xs]}>
        <Text style={[a.font_bold]} emoji numberOfLines={1}>
          {label}
        </Text>
        {description ? (
          <Text
            style={[a.text_sm, t.atoms.text_contrast_medium]}
            numberOfLines={1}>
            {description}
          </Text>
        ) : null}
      </View>
      {isSelected ? <CheckIcon size="sm" fill={t.palette.primary_500} /> : null}
    </Pressable>
  )
}
