import React from 'react'
import {ScrollView, View} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams} from 'lib/routes/types'
import {useGate} from 'lib/statsig/statsig'
import {useSetMinimalShellMode} from 'state/shell'
import {FeedSourceCard} from 'view/com/feeds/FeedSourceCard'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {CenteredView} from 'view/com/util/Views'
import {Logo} from 'view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {Text} from '#/components/Typography'

/**
 * TEMPORARY CONTENT, DO NOT TRANSLATE
 */
/**
 * TEMPORARY CONTENT, DO NOT TRANSLATE
 */
/**
 * TEMPORARY CONTENT, DO NOT TRANSLATE
 */

const PLACEHOLDER_USERS = [
  {
    displayName: 'Bossett',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:jfhpnnst6flqway4eaeqzj2a/bafkreid42e2su4sju7hl2nm4ouacw3icvvytf7r6gab3pvc2qxhqhc5ji4@jpeg',
  },
  {
    displayName: 'hailey',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:oisofpd7lj26yvgiivf3lxsi/bafkreia4lpswywb5yx3gsezqb5io73kt7icw634ks4m4mmbfvp7e62cxku@jpeg',
  },
  {
    displayName: 'samuel',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:p2cp5gopk7mgjegy6wadk3ep/bafkreias5vktko4jpg4mwp4audptcbdfkb4o3cfyzt4426mj2h7ewwvg7q@jpeg',
  },

  {
    displayName: 'Paul “Frazee” 🦋',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:ragtjsm2j2vknwkz3zp4oxrd/bafkreihhpqdyntku66himwor5wlhtdo44hllmngj2ofmbqnm25bdm454wq@jpeg',
  },
  {
    displayName: 'Jay',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:oky5czdrnfjpqslsw2a5iclo/bafkreihidru2xruxdxlvvcixc7lbgoudzicjbrdgacdhdhxyfw4yut4nfq@jpeg',
  },
  {
    displayName: 'Emily 🦋',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:vjug55kidv6sye7ykr5faxxn/bafkreia63347vwjt4sgfkedgvytodt22ugfck5o36qotwaflsf3qq5xj3y@jpeg',
  },
  {
    displayName: 'Rose 🌹',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:qjeavhlw222ppsre4rscd3n2/bafkreiehdi7v7bmz64anqam72ybtkkeodfe22sh7dcsh7m6wei2cf5liye@jpeg',
  },
  {
    displayName: 'dan',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:fpruhuo22xkm5o7ttr2ktxdo/bafkreif65cz6sp4cvwue6dnsy7lhy7o7vdelknwd6hermcbzg2npealz5q@jpeg',
  },
]

export function LandingScreen({
  navigation,
}: NativeStackScreenProps<CommonNavigatorParams, 'StarterPackLanding'>) {
  const {_} = useLingui()
  const gate = useGate()
  const t = useTheme()
  const setMinimalShellMode = useSetMinimalShellMode()
  const gradient =
    t.name === 'light'
      ? [t.palette.primary_500, t.palette.primary_300]
      : [t.palette.primary_600, t.palette.primary_400]

  const userSets = React.useMemo(() => {
    return {
      first: PLACEHOLDER_USERS.slice(0, 4),
      second: PLACEHOLDER_USERS.slice(4, 8),
    }
  }, [])

  React.useEffect(() => {
    if (!gate('starter_packs_enabled')) {
      // @ts-expect-error idk
      navigation.replace('Home')
      return
    }

    setMinimalShellMode(true)

    return () => {
      setMinimalShellMode(false)
    }
  }, [gate, navigation, setMinimalShellMode])

  return (
    <CenteredView style={a.flex_1}>
      <ScrollView
        style={[a.flex_1]}
        contentContainerStyle={{paddingBottom: 100}}>
        <LinearGradient
          colors={gradient}
          style={[a.align_center, a.gap_sm, a.py_2xl]}>
          <View style={[a.flex_row, a.gap_md, a.pb_sm]}>
            <Logo width={76} fill="white" />
          </View>
          <View style={[a.align_center, a.gap_xs]}>
            <Text style={[a.font_bold, a.text_5xl, {color: 'white'}]}>
              Science
            </Text>
            <Text style={[a.font_bold, a.text_md, {color: 'white'}]}>
              Starter pack by Bossett
            </Text>
          </View>
        </LinearGradient>
        <View style={[a.gap_md, a.mt_lg, a.mx_lg]}>
          <Text
            style={[a.text_md, a.text_center, t.atoms.text_contrast_medium]}>
            186 joined this week
          </Text>
          <Button
            label={_(msg`Join Bluesky now`)}
            onPress={() => {}}
            variant="solid"
            color="primary"
            size="large">
            <ButtonText style={[a.text_lg]}>
              <Trans>Join Bluesky now</Trans>
            </ButtonText>
          </Button>
          <View style={[a.gap_xl, a.mt_md]}>
            <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
              (This is the description) A collection of feeds and users to get
              you started with the science community on Bluesky!
            </Text>
            <Divider />
            <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
              Join Bluesky now to subscribe to these feeds:
            </Text>
            <View
              style={[
                t.atoms.bg_contrast_25,
                a.rounded_sm,
                {pointerEvents: 'none'},
              ]}>
              <FeedSourceCard
                feedUri="at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science"
                noBorder={true}
              />
              <FeedSourceCard feedUri="at://did:plc:upmfcx5muayjhkg5sltj625o/app.bsky.feed.generator/aaachrckxlsh2" />
            </View>
            <Text style={[a.mt_sm, a.text_md, t.atoms.text_contrast_medium]}>
              You'll also follow these people and many others!
            </Text>
            <View
              style={[
                t.atoms.bg_contrast_25,
                a.rounded_sm,
                a.px_xs,
                a.py_md,
                a.gap_xl,
              ]}>
              <UserSet users={userSets.first} />
              <UserSet users={userSets.second} />
            </View>
          </View>
        </View>
      </ScrollView>
    </CenteredView>
  )
}

// function AvatarSet({avatars}: {avatars: string[]}) {
//   return (
//     <View style={[a.flex_row, a.gap_xs]}>
//       <AvatarSetImage avatar={avatars[0]} zIndex={1} />
//       <AvatarSetImage avatar={avatars[1]} zIndex={2} />
//       <AvatarSetImage avatar={avatars[2]} zIndex={3} />
//     </View>
//   )
// }

// function AvatarSetImage({avatar, zIndex}: {avatar: string; zIndex: number}) {
//   return (
//     <Image
//       source={avatar}
//       style={[
//         a.rounded_full,
//         {
//           width: 32,
//           height: 32,
//           borderColor: 'white',
//           borderWidth: 2,
//           marginRight: -16,
//           zIndex,
//         },
//       ]}
//       accessibilityIgnoresInvertColors={true}
//     />
//   )
// }

function User({displayName, avatar}: {displayName: string; avatar: string}) {
  return (
    <View style={[a.flex_1, a.align_center, a.gap_sm]}>
      <UserAvatar size={64} avatar={avatar} />
      <Text style={[a.flex_1, a.text_sm, a.font_bold]} numberOfLines={1}>
        {displayName}
      </Text>
    </View>
  )
}

function UserSet({users}: {users: {displayName: string; avatar: string}[]}) {
  return (
    <View style={[a.flex_row, a.gap_xs, a.align_center, a.justify_between]}>
      <User displayName={users[0].displayName} avatar={users[0].avatar} />
      <User displayName={users[1].displayName} avatar={users[1].avatar} />
      <User displayName={users[2].displayName} avatar={users[2].avatar} />
      <User displayName={users[3].displayName} avatar={users[3].avatar} />
    </View>
  )
}
