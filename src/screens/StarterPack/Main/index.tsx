import React from 'react'
import {Pressable, View} from 'react-native'
import {AppBskyGraphDefs, AppBskyGraphStarterpack} from '@atproto/api'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {makeProfileLink} from 'lib/routes/links'
import {CommonNavigatorParams, NavigationProp} from 'lib/routes/types'
import {shareUrl} from 'lib/sharing'
import {isWeb} from 'platform/detection'
import {useResolveDidQuery} from 'state/queries/resolve-uri'
import {useStarterPackQuery} from 'state/queries/useStarterPackQuery'
import {useSession} from 'state/session'
import {PagerWithHeader} from 'view/com/pager/PagerWithHeader'
import {ProfileSubpageHeader} from 'view/com/profile/ProfileSubpageHeader'
import {CenteredView} from 'view/com/util/Views'
import {FeedsList} from '#/screens/StarterPack/Main/FeedsList'
import {ProfilesList} from '#/screens/StarterPack/Main/ProfilesList'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as ArrowOutOfBox} from '#/components/icons/ArrowOutOfBox'
import {QrCode_Stroke2_Corner0_Rounded as QrCode} from '#/components/icons/QrCode'
import {ListMaybePlaceholder} from '#/components/Lists'
import * as Menu from '#/components/Menu'
import {QrCodeDialog} from '#/components/StarterPack/QrCodeDialog'
import {Text} from '#/components/Typography'

export function StarterPackScreen({
  route,
}: NativeStackScreenProps<CommonNavigatorParams, 'StarterPackLanding'>) {
  const {name, rkey} = route.params
  const {
    data: did,
    isLoading: isLoadingDid,
    isError: isErrorDid,
  } = useResolveDidQuery(name)
  const {
    data: starterPack,
    isLoading: isLoadingStarterPack,
    isError: isErrorStarterPack,
  } = useStarterPackQuery({did, rkey})

  if (!did || !starterPack) {
    return (
      <ListMaybePlaceholder
        isLoading={isLoadingDid || isLoadingStarterPack}
        isError={isErrorDid || isErrorStarterPack}
      />
    )
  }

  const items = [
    ...(starterPack.list ? ['People'] : []),
    ...(starterPack.feeds?.length ? ['Feeds'] : []),
  ]

  return (
    <CenteredView style={[a.h_full_vh]}>
      <View style={isWeb ? {minHeight: '100%'} : {height: '100%'}}>
        <PagerWithHeader
          items={items}
          isHeaderReady={true}
          renderHeader={() => (
            <Header starterPack={starterPack} name={name} rkey={rkey} />
          )}>
          {starterPack.list
            ? ({headerHeight, scrollElRef}) => (
                <ProfilesList
                  key={0}
                  // @ts-expect-error TODO
                  listUri={starterPack.list.uri}
                  headerHeight={headerHeight}
                  // @ts-expect-error
                  scrollElRef={scrollElRef}
                />
              )
            : null}
          {starterPack.feeds
            ? ({headerHeight, scrollElRef}) => (
                <FeedsList
                  key={1}
                  // @ts-expect-error TODO
                  feeds={starterPack.feeds}
                  headerHeight={headerHeight}
                  // @ts-expect-error
                  scrollElRef={scrollElRef}
                />
              )
            : null}
        </PagerWithHeader>
      </View>
    </CenteredView>
  )
}

function Header({
  starterPack,
  name,
  rkey,
}: {
  starterPack: AppBskyGraphDefs.StarterPackView
  name: string
  rkey: string
}) {
  const {_} = useLingui()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const {currentAccount} = useSession()
  const qrCodeDialogControl = useDialogControl()

  const {record, creator} = starterPack
  const isOwn = creator.did === currentAccount?.did

  if (!AppBskyGraphStarterpack.isRecord(record)) {
    return null
  }

  return (
    <>
      <ProfileSubpageHeader
        isLoading={false}
        href={makeProfileLink(creator)}
        title={record.name}
        isOwner={isOwn}
        avatar={undefined}
        creator={creator}
        avatarType="starter-pack">
        <View style={[a.flex_row, a.gap_sm]}>
          <Menu.Root>
            <Menu.Trigger label={_(msg`Repost or quote post`)}>
              {({props, state}) => (
                <Pressable
                  style={[
                    a.px_lg,
                    a.py_xs,
                    a.align_center,
                    a.justify_center,
                    a.rounded_sm,
                    {backgroundColor: t.palette.primary_500},
                    (state.hovered || state.pressed) && {
                      backgroundColor: t.palette.primary_600,
                    },
                  ]}
                  {...props}>
                  <Text style={[a.font_bold, {color: 'white'}]}>
                    <Trans>Share</Trans>
                  </Text>
                </Pressable>
              )}
            </Menu.Trigger>
            <Menu.Outer style={{minWidth: 170}}>
              <Menu.Group>
                <Menu.Item
                  label={_(msg`Share link`)}
                  testID="shareStarterPackLinkBtn"
                  onPress={() => {
                    shareUrl('https://bsky.app')
                  }}>
                  <Menu.ItemText>
                    <Trans>Share link</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={ArrowOutOfBox} position="right" />
                </Menu.Item>
                <Menu.Item
                  label={_(msg`Create QR code`)}
                  testID="createQRCodeBtn"
                  onPress={qrCodeDialogControl.open}>
                  <Menu.ItemText>
                    <Trans>Create QR code</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={QrCode} position="right" />
                </Menu.Item>
              </Menu.Group>
            </Menu.Outer>
          </Menu.Root>
          {isOwn && (
            <Button
              label={_(msg`Edit`)}
              variant="solid"
              color="secondary"
              size="small"
              onPress={() =>
                navigation.navigate('StarterPackWizard', {name, rkey})
              }>
              <ButtonText>
                <Trans>Edit</Trans>
              </ButtonText>
            </Button>
          )}
        </View>
      </ProfileSubpageHeader>
      <View style={[a.px_md, a.py_lg, a.gap_md]}>
        <Text style={[a.text_md]}>{record.description}</Text>
        <Text style={[a.font_bold, a.text_md, t.atoms.text_contrast_medium]}>
          <Trans>
            {starterPack.joinedAllTimeCount || 0}{' '}
            <Plural
              value={starterPack.joinedAllTimeCount || 0}
              one="person has"
              other="people have"
            />{' '}
            joined this starter pack!
          </Trans>
        </Text>
      </View>
      <QrCodeDialog control={qrCodeDialogControl} url="https://bsky.app" />
    </>
  )
}
