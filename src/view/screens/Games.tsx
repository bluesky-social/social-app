import React from 'react'
import {Linking, View} from 'react-native'
import {TouchableOpacity} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useNavigationDeduped} from '#/lib/hooks/useNavigationDeduped'
import {useProfileQuery} from '#/state/queries/profile'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {GameFollowButton} from '../com/profile/GameFollowButton'
import {UserAvatar} from '../com/util/UserAvatar'

function GameListItem({
  title,
  description,
  accountHandle,
  did,
  playUrl,
}: {
  title: string
  description: string
  accountHandle: string
  did: string
  playUrl: string
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {data: profile} = useProfileQuery({did})
  const navigation = useNavigationDeduped()

  const goToProfile = React.useCallback(() => {
    if (profile?.handle) {
      navigation.navigate('Profile', {name: profile.handle})
    } else if (did) {
      navigation.navigate('Profile', {name: did})
    }
  }, [navigation, profile?.handle, did])

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.gap_md,
        a.px_lg, // horizontal padding to match FeedCard
        a.py_md,
        t.atoms.bg_contrast_25,
        {borderRadius: 12, width: '100%', minHeight: 72},
      ]}>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={goToProfile}
        activeOpacity={0.7}
        style={{marginRight: 8}}>
        <UserAvatar type="user" size={80} avatar={profile?.avatar} />
      </TouchableOpacity>
      <View style={[a.flex_1, {minWidth: 0}]}>
        <Text style={[a.text_lg, a.font_bold]} numberOfLines={1}>
          {title}
        </Text>
        <Text
          style={[a.text_sm, t.atoms.text_contrast_medium]}
          numberOfLines={1}>
          @{accountHandle}
        </Text>
        <Text style={[a.text_sm, a.mt_sm]} numberOfLines={1}>
          {description}
        </Text>
        <View style={[a.flex_row, a.gap_md, a.mt_sm]}>
          <Button
            variant="solid"
            color="primary"
            label={_(msg`Play ${title}`)}
            onPress={() => Linking.openURL(playUrl)}
            size="small"
            style={[{paddingHorizontal: 16, borderRadius: 8}]}>
            <ButtonText>{_(msg`Play`)}</ButtonText>
          </Button>
          {profile && (
            <GameFollowButton
              profile={profile}
              style={[{paddingHorizontal: 16, borderRadius: 8}]}
              size="small"
            />
          )}
        </View>
      </View>
    </View>
  )
}

export function GamesScreen() {
  const {_} = useLingui()

  return (
    <Layout.Screen testID="GamesScreen">
      <Layout.Center>
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Games</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
        </Layout.Header.Outer>
        <View
          style={[
            a.pt_lg,
            a.pb_xl,
            a.gap_lg,
            {width: '100%', paddingHorizontal: 16},
          ]}>
          <GameListItem
            title="Skyrdle"
            description="Guess the daily word in 6 tries or fewer!"
            accountHandle="skyrdle.com"
            did="did:plc:jylenhzj4u2te27qmcrdjtoh"
            playUrl="https://skyrdle.com"
          />
          <Divider />
          <GameListItem
            title="2048"
            description="Combine tiles to try to reach a value of 2048!"
            accountHandle="2048.blue"
            did="did:plc:zylhqsjug3f76uqxguhviqka"
            playUrl="https://2048.blue"
          />
        </View>
      </Layout.Center>
    </Layout.Screen>
  )
}
