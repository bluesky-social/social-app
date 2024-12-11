import {View, Text as RNText} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg, plural, Trans} from '@lingui/macro'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import * as Layout from '#/components/Layout'
import {atoms as a, useTheme, useBreakpoints, web} from '#/alf'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {Text} from '#/components/Typography'
import {Pin_Stroke2_Corner0_Rounded as Pin} from '#/components/icons/Pin'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDown} from '#/components/icons/Chevron'
import {Button, ButtonIcon} from '#/components/Button'
import {sanitizeHandle} from '#/lib/strings/handles'

export function ProfileSubpageHeader({
  title,
  avatar,
  creator,
  likeCount,
}: {
  title: string
  avatar?: string
  creator: {did: string; handle: string}
  likeCount: number
}) {
  const t = useTheme()
  const {gtPhone, gtMobile} = useBreakpoints()
  const {_} = useLingui()
  const {top} = useSafeAreaInsets()

  return (
    <Layout.Center
      style={[t.atoms.bg, a.z_10, {paddingTop: top}, web([a.sticky, a.z_10, {top: 0}])]}
    >
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align="left">
          <Button
            label={_(msg`Open feed info screen`)}
            style={[
              a.justify_start,
              {
                paddingVertical: 6,
                paddingHorizontal: 8,
                paddingRight: 12,
              },
            ]}>
            {({hovered}) => (
              <>
                <View
                  style={[
                    a.absolute,
                    a.inset_0,
                    a.rounded_sm,
                    a.transition_transform,
                    t.atoms.bg_contrast_25,
                    hovered && {
                      transform: [{scaleX: 1.01}, {scaleY: 1.1}],
                    },
                  ]}
                />

                <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
                  {avatar && (
                    <UserAvatar size={32} type="algo" avatar={avatar} />
                  )}

                  <View style={[a.flex_1]}>
                    {/* Should roughly matchl Layout.Header.TitleText */}
                    <Text
                      style={[
                        a.text_md,
                        a.font_heavy,
                        a.leading_tight,
                        gtMobile && a.text_lg,
                      ]}
                      numberOfLines={2}>
                      {title}
                    </Text>
                    {/* Should roughly matchl Layout.Header.SubtitleText */}
                    <Text
                      style={[
                        a.flex_1,
                        a.text_xs,
                        a.leading_snug,
                        t.atoms.text_contrast_medium,
                        gtPhone && a.text_sm,
                      ]}>
                      <RNText numberOfLines={1}>
                        <Trans>By {sanitizeHandle(creator.handle, '@')}</Trans>
                      </RNText>
                      {' • '}
                      <RNText numberOfLines={1}>
                        {plural(likeCount, {
                          one: '# like',
                          other: '# likes',
                        })}
                      </RNText>
                    </Text>
                  </View>

                  <ChevronDown
                    size="md"
                    fill={t.atoms.text_contrast_low.color}
                  />
                </View>
              </>
            )}
          </Button>
        </Layout.Header.Content>

        <Layout.Header.Slot>
          <Button
            label={_(msg`Pin ${title} to your home screen`)}
            size="small"
            variant="ghost"
            shape="square"
            color="secondary">
            <ButtonIcon icon={Pin} size="lg" />
          </Button>
        </Layout.Header.Slot>
      </Layout.Header.Outer>
    </Layout.Center>
  )
}
