import React from 'react'
import {Text, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams} from 'lib/routes/types'
import {isWeb} from 'platform/detection'
import {PagerWithHeader} from 'view/com/pager/PagerWithHeader'
import {ProfileSubpageHeader} from 'view/com/profile/ProfileSubpageHeader'
import {CenteredView} from 'view/com/util/Views'
import {FeedsList} from '#/screens/StarterPack/Main/FeedsList'
import {ProfilesList} from '#/screens/StarterPack/Main/ProfilesList'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'

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
    did: 'did:plc:qjeavhlw222ppsre4rscd3n2',
    handle: 'test.handle',
    displayName: 'Bossett',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:jfhpnnst6flqway4eaeqzj2a/bafkreid42e2su4sju7hl2nm4ouacw3icvvytf7r6gab3pvc2qxhqhc5ji4@jpeg',
  },
  {
    did: 'did:plc:qjeavhlw222ppsre4rscd3n2',
    handle: 'test.handle',
    displayName: 'hailey',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:oisofpd7lj26yvgiivf3lxsi/bafkreia4lpswywb5yx3gsezqb5io73kt7icw634ks4m4mmbfvp7e62cxku@jpeg',
  },
  {
    did: 'did:plc:qjeavhlw222ppsre4rscd3n2',
    handle: 'test.handle',
    displayName: 'samuel',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:p2cp5gopk7mgjegy6wadk3ep/bafkreias5vktko4jpg4mwp4audptcbdfkb4o3cfyzt4426mj2h7ewwvg7q@jpeg',
  },

  {
    did: 'did:plc:qjeavhlw222ppsre4rscd3n2',
    handle: 'test.handle',
    displayName: 'Paul “Frazee” 🦋',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:ragtjsm2j2vknwkz3zp4oxrd/bafkreihhpqdyntku66himwor5wlhtdo44hllmngj2ofmbqnm25bdm454wq@jpeg',
  },
  {
    did: 'did:plc:qjeavhlw222ppsre4rscd3n2',
    handle: 'test.handle',
    displayName: 'Jay',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:oky5czdrnfjpqslsw2a5iclo/bafkreihidru2xruxdxlvvcixc7lbgoudzicjbrdgacdhdhxyfw4yut4nfq@jpeg',
  },
  {
    did: 'did:plc:qjeavhlw222ppsre4rscd3n2',
    handle: 'test.handle',
    displayName: 'Emily 🦋',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:vjug55kidv6sye7ykr5faxxn/bafkreia63347vwjt4sgfkedgvytodt22ugfck5o36qotwaflsf3qq5xj3y@jpeg',
  },
  {
    did: 'did:plc:qjeavhlw222ppsre4rscd3n2',
    handle: 'test.handle',
    displayName: 'Rose 🌹',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:qjeavhlw222ppsre4rscd3n2/bafkreiehdi7v7bmz64anqam72ybtkkeodfe22sh7dcsh7m6wei2cf5liye@jpeg',
  },
  {
    did: 'did:plc:qjeavhlw222ppsre4rscd3n2',
    handle: 'test.handle',
    displayName: 'dan',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:fpruhuo22xkm5o7ttr2ktxdo/bafkreif65cz6sp4cvwue6dnsy7lhy7o7vdelknwd6hermcbzg2npealz5q@jpeg',
  },
]

const PLACEHOLDER_FEEDS = [
  'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
  'at://did:plc:upmfcx5muayjhkg5sltj625o/app.bsky.feed.generator/aaachrckxlsh2',
]

export function StarterPackScreen({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'StarterPackLanding'
>) {
  // const {id} = route.params

  return (
    <CenteredView style={a.flex_1}>
      <StarterPackScreenInner />
    </CenteredView>
  )
}

function StarterPackScreenInner() {
  const isOwn = true

  return (
    <View style={isWeb ? {minHeight: '100%'} : {height: '100%'}}>
      <PagerWithHeader
        items={['Profiles', 'Feeds']}
        isHeaderReady={true}
        renderHeader={() => <Header isOwn={isOwn} />}>
        {({headerHeight, scrollElRef}) => (
          <ProfilesList
            key={0}
            profiles={PLACEHOLDER_USERS}
            headerHeight={headerHeight}
            // @ts-expect-error
            scrollElRef={scrollElRef}
          />
        )}
        {({headerHeight, scrollElRef}) => (
          <FeedsList
            key={1}
            feeds={PLACEHOLDER_FEEDS}
            headerHeight={headerHeight}
            // @ts-expect-error
            scrollElRef={scrollElRef}
          />
        )}
      </PagerWithHeader>
    </View>
  )
}

function Header({isOwn}: {isOwn: boolean}) {
  const {_} = useLingui()

  return (
    <>
      <ProfileSubpageHeader
        isLoading={false}
        href=""
        title="Science"
        isOwner={false}
        avatar={undefined}
        creator={undefined}
        avatarType="starter-pack">
        <View style={[a.flex_row, a.gap_sm]}>
          <Button
            label={_(msg`Share`)}
            variant="solid"
            color="primary"
            size="small"
            onPress={() => {}}>
            <ButtonText>
              <Trans>Share</Trans>
            </ButtonText>
          </Button>
          {isOwn && (
            <Button
              label={_(msg`Edit`)}
              variant="solid"
              color="secondary"
              size="small"
              onPress={() => {}}>
              <ButtonText>
                <Trans>Edit</Trans>
              </ButtonText>
            </Button>
          )}
        </View>
      </ProfileSubpageHeader>
      <View style={[a.px_md, a.py_lg]}>
        <Text style={[a.text_md]}>
          (This is the description) A collection of feeds and users to get you
          started with the science community on Bluesky!
        </Text>
      </View>
    </>
  )
}
