import React from 'react'
import {View} from 'react-native'
import {
  AppBskyGraphDefs,
  AppBskyGraphStarterpack,
  ModerationOpts,
} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {useQueryClient} from '@tanstack/react-query'

import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useDeleteStarterPackMutation} from '#/state/queries/starter-packs'
import {HITSLOP_20} from 'lib/constants'
import {makeProfileLink, makeStarterPackLink} from 'lib/routes/links'
import {CommonNavigatorParams, NavigationProp} from 'lib/routes/types'
import {shareUrl} from 'lib/sharing'
import {logEvent} from 'lib/statsig/statsig'
import {isWeb} from 'platform/detection'
import {useModerationOpts} from 'state/preferences/moderation-opts'
import {RQKEY} from 'state/queries/list-members'
import {useResolveDidQuery} from 'state/queries/resolve-uri'
import {useShortenLink} from 'state/queries/shorten-link'
import {useStarterPackQuery} from 'state/queries/starter-packs'
import {useAgent, useSession} from 'state/session'
import * as Toast from '#/view/com/util/Toast'
import {PagerWithHeader} from 'view/com/pager/PagerWithHeader'
import {ProfileSubpageHeader} from 'view/com/profile/ProfileSubpageHeader'
import {CenteredView} from 'view/com/util/Views'
import {bulkWriteFollows} from '#/screens/Onboarding/util'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as ArrowOutOfBox} from '#/components/icons/ArrowOutOfBox'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDown} from '#/components/icons/Chevron'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {DotGrid_Stroke2_Corner0_Rounded as Ellipsis} from '#/components/icons/DotGrid'
import {Pencil_Stroke2_Corner0_Rounded as Pencil} from '#/components/icons/Pencil'
import {QrCode_Stroke2_Corner0_Rounded as QrCode} from '#/components/icons/QrCode'
import {Trash_Stroke2_Corner0_Rounded as Trash} from '#/components/icons/Trash'
import {ListMaybePlaceholder} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import * as Menu from '#/components/Menu'
import * as Prompt from '#/components/Prompt'
import {ReportDialog, useReportDialogControl} from '#/components/ReportDialog'
import {FeedsList} from '#/components/StarterPack/Main/FeedsList'
import {ProfilesList} from '#/components/StarterPack/Main/ProfilesList'
import {QrCodeDialog} from '#/components/StarterPack/QrCodeDialog'
import {Text} from '#/components/Typography'

type StarterPackScreeProps = NativeStackScreenProps<
  CommonNavigatorParams,
  'StarterPack'
>

export function StarterPackScreen({route}: StarterPackScreeProps) {
  const {_} = useLingui()

  const {name, rkey} = route.params
  const moderationOpts = useModerationOpts()
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

  const isValid =
    starterPack &&
    AppBskyGraphDefs.validateStarterPackView(starterPack) &&
    AppBskyGraphStarterpack.validateRecord(starterPack.record)

  if (!did || !starterPack || !isValid || !moderationOpts) {
    return (
      <ListMaybePlaceholder
        isLoading={isLoadingDid || isLoadingStarterPack || !moderationOpts}
        isError={isErrorDid || isErrorStarterPack || !isValid}
        errorMessage={_(msg`That starter pack could not be found.`)}
      />
    )
  }

  return (
    <StarterPackScreenInner
      starterPack={starterPack}
      routeParams={route.params}
      moderationOpts={moderationOpts}
    />
  )
}

function StarterPackScreenInner({
  starterPack,
  routeParams,
  moderationOpts,
}: {
  starterPack: AppBskyGraphDefs.StarterPackView
  routeParams: StarterPackScreeProps['route']['params']
  moderationOpts: ModerationOpts
}) {
  const shortenLink = useShortenLink()

  const tabs = [
    ...(starterPack.list ? ['People'] : []),
    ...(starterPack.feeds?.length ? ['Feeds'] : []),
  ]

  const onShareLink = async () => {
    const fullUrl = makeStarterPackLink(
      starterPack.creator.did,
      routeParams.rkey,
    )
    const res = await shortenLink(fullUrl)
    shareUrl(res.url)
    logEvent('starterPack:share', {
      starterPack: starterPack.uri,
      shareType: 'link',
    })
  }

  return (
    <CenteredView style={[a.h_full_vh]}>
      <View style={isWeb ? {minHeight: '100%'} : {height: '100%'}}>
        <PagerWithHeader
          items={tabs}
          isHeaderReady={true}
          renderHeader={() => (
            <Header
              starterPack={starterPack}
              routeParams={routeParams}
              onShareLink={onShareLink}
            />
          )}>
          {starterPack.list != null
            ? ({headerHeight, scrollElRef}) => (
                <ProfilesList
                  key={0}
                  // @ts-expect-error TODO
                  listUri={starterPack.list.uri}
                  headerHeight={headerHeight}
                  // @ts-expect-error
                  scrollElRef={scrollElRef}
                  moderationOpts={moderationOpts}
                />
              )
            : null}
          {starterPack.feeds != null
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
  routeParams,
  onShareLink,
}: {
  starterPack: AppBskyGraphDefs.StarterPackView
  routeParams: StarterPackScreeProps['route']['params']
  onShareLink: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()
  const agent = useAgent()
  const queryClient = useQueryClient()

  const [isProcessing, setIsProcessing] = React.useState(false)

  const {record, creator} = starterPack
  const isOwn = creator?.did === currentAccount?.did
  const joinedAllTimeCount = starterPack.joinedAllTimeCount ?? 0

  const onFollowAll = async () => {
    if (!starterPack.list) return

    setIsProcessing(true)

    try {
      const list = await agent.app.bsky.graph.getList({
        list: starterPack.list.uri,
      })
      const dids = list.data.items
        .filter(li => !li.subject.viewer?.following)
        .map(li => li.subject.did)

      await bulkWriteFollows(agent, dids)

      await queryClient.refetchQueries({
        queryKey: RQKEY(starterPack.list.uri),
      })

      logEvent('starterPack:followAll', {
        starterPack: starterPack.uri,
        followCount: dids.length,
      })
      Toast.show(_(msg`All accounts have been followed!`))
    } catch (e) {
      Toast.show(_(msg`An error occurred while trying to follow all`))
    } finally {
      setIsProcessing(false)
    }
  }

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
        <View style={[a.flex_row, a.gap_sm, a.align_center]}>
          {isOwn ? (
            <OwnerShareMenu
              starterPack={starterPack}
              onShareLink={onShareLink}
            />
          ) : (
            <Button
              label={_(msg`Follow all`)}
              variant="solid"
              color="primary"
              size="small"
              disabled={isProcessing}
              onPress={onFollowAll}>
              <ButtonText>
                <Trans>Follow all</Trans>
                {isProcessing && <Loader size="xs" />}
              </ButtonText>
            </Button>
          )}
          <OverflowMenu
            routeParams={routeParams}
            starterPack={starterPack}
            onShareLink={onShareLink}
          />
        </View>
      </ProfileSubpageHeader>
      {record.description || joinedAllTimeCount >= 25 ? (
        <View style={[a.px_lg, a.pt_md, a.pb_sm, a.gap_md]}>
          {record.description ? (
            <Text style={[a.text_md, a.leading_snug]}>
              {record.description}
            </Text>
          ) : null}
          {joinedAllTimeCount >= 25 ? (
            <View style={[a.flex_row, a.align_center, a.gap_sm]}>
              <FontAwesomeIcon
                icon="arrow-trend-up"
                size={12}
                color={t.atoms.text_contrast_medium.color}
              />
              <Text
                style={[a.font_bold, a.text_sm, t.atoms.text_contrast_medium]}>
                <Trans>
                  {starterPack.joinedAllTimeCount || 0} people have used this
                  starter pack!
                </Trans>
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </>
  )
}

function OverflowMenu({
  starterPack,
  routeParams,
  onShareLink,
}: {
  starterPack: AppBskyGraphDefs.StarterPackView
  routeParams: StarterPackScreeProps['route']['params']
  onShareLink: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const {currentAccount} = useSession()
  const qrCodeDialogControl = useDialogControl()
  const reportDialogControl = useReportDialogControl()
  const deleteDialogControl = useDialogControl()
  const navigation = useNavigation<NavigationProp>()
  const [isQrDialogOpen, setIsQrDialogOpen] = React.useState(false)

  const {
    mutate: deleteStarterPack,
    isPending: isDeletePending,
    error: deleteError,
  } = useDeleteStarterPackMutation({
    onSuccess: () => {
      logEvent('starterPack:delete', {})
      deleteDialogControl.close(() => {
        if (navigation.canGoBack()) {
          navigation.popToTop()
        } else {
          navigation.navigate('Home')
        }
      })
    },
    onError: e => {
      logger.error('Failed to delete starter pack', {safeMessage: e})
    },
  })

  const isOwn = starterPack.creator.did === currentAccount?.did

  const onDeleteStarterPack = async () => {
    deleteStarterPack({
      rkey: routeParams.rkey,
      // TODO need to fix types
      listUri: starterPack.list!.uri,
    })
    logEvent('starterPack:delete', {})
  }

  return (
    <>
      <Menu.Root>
        <Menu.Trigger label={_(msg`Repost or quote post`)}>
          {({props}) => (
            <Button
              {...props}
              testID="headerDropdownBtn"
              label={_(msg`Open starter pack menu`)}
              hitSlop={HITSLOP_20}
              variant="solid"
              color="secondary"
              size="small"
              shape="round">
              <ButtonIcon icon={Ellipsis} />
            </Button>
          )}
        </Menu.Trigger>
        <Menu.Outer style={{minWidth: 170}}>
          {isOwn ? (
            <>
              <Menu.Item
                label={_(msg`Edit starter pack`)}
                testID="editStarterPackLinkBtn"
                onPress={() => {
                  navigation.navigate('StarterPackEdit', {
                    rkey: routeParams.rkey,
                  })
                }}>
                <Menu.ItemText>
                  <Trans>Edit</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={Pencil} position="right" />
              </Menu.Item>
              <Menu.Item
                label={_(msg`Delete starter pack`)}
                testID="deleteStarterPackBtn"
                onPress={() => {
                  deleteDialogControl.open()
                }}>
                <Menu.ItemText>
                  <Trans>Delete</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={Trash} position="right" />
              </Menu.Item>
            </>
          ) : (
            <>
              <Menu.Group>
                <Menu.Item
                  label={_(msg`Share link`)}
                  testID="shareStarterPackLinkBtn"
                  onPress={onShareLink}>
                  <Menu.ItemText>
                    <Trans>Share link</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={ArrowOutOfBox} position="right" />
                </Menu.Item>
                <Menu.Item
                  label={_(msg`Create QR code`)}
                  testID="createQRCodeBtn"
                  onPress={() => {
                    setIsQrDialogOpen(true)
                    qrCodeDialogControl.open()
                  }}>
                  <Menu.ItemText>
                    <Trans>Create QR code</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={QrCode} position="right" />
                </Menu.Item>
              </Menu.Group>

              <Menu.Item
                label={_(msg`Report starter pack`)}
                onPress={reportDialogControl.open}>
                <Menu.ItemText>
                  <Trans>Report starter pack</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={CircleInfo} position="right" />
              </Menu.Item>
            </>
          )}
        </Menu.Outer>
      </Menu.Root>

      <QrCodeDialog
        control={qrCodeDialogControl}
        starterPack={starterPack}
        isOpen={isQrDialogOpen}
        setIsOpen={setIsQrDialogOpen}
      />
      <ReportDialog
        control={reportDialogControl}
        params={{
          type: 'starterpack',
          uri: starterPack.list!.uri,
          cid: starterPack.list!.cid,
        }}
      />

      <Prompt.Outer control={deleteDialogControl}>
        <Prompt.TitleText>
          <Trans>Delete starter pack?</Trans>
        </Prompt.TitleText>
        <Prompt.DescriptionText>
          <Trans>Are you sure you want delete this starter pack?</Trans>
        </Prompt.DescriptionText>
        {deleteError && (
          <View
            style={[
              a.flex_row,
              a.gap_sm,
              a.rounded_sm,
              a.p_md,
              a.mb_lg,
              a.border,
              t.atoms.border_contrast_medium,
              t.atoms.bg_contrast_25,
            ]}>
            <View style={[a.flex_1, a.gap_2xs]}>
              <Text style={[a.font_bold]}>
                <Trans>Unable to delete</Trans>
              </Text>
              <Text style={[a.leading_snug]}>{cleanError(deleteError)}</Text>
            </View>
            <CircleInfo size="sm" fill={t.palette.negative_400} />
          </View>
        )}
        <Prompt.Actions>
          <Button
            variant="solid"
            color="negative"
            size={gtMobile ? 'small' : 'medium'}
            label={_(msg`Yes, delete this starter pack`)}
            onPress={onDeleteStarterPack}>
            <ButtonText>
              <Trans>Delete</Trans>
            </ButtonText>
            {isDeletePending && <ButtonIcon icon={Loader} />}
          </Button>
          <Prompt.Cancel />
        </Prompt.Actions>
      </Prompt.Outer>
    </>
  )
}

function OwnerShareMenu({
  starterPack,
  onShareLink,
}: {
  starterPack: AppBskyGraphDefs.StarterPackView
  onShareLink: () => void
}) {
  const {_} = useLingui()
  const qrCodeDialogControl = useDialogControl()
  const [isQrDialogOpen, setIsQrDialogOpen] = React.useState(false)

  return (
    <>
      <Menu.Root>
        <Menu.Trigger label={_(msg`Repost or quote post`)}>
          {({props}) => (
            <Button
              {...props}
              label={_(msg`Share this starter pack`)}
              hitSlop={HITSLOP_20}
              variant="solid"
              color="primary"
              size="small">
              <ButtonText>
                <Trans>Share</Trans>
              </ButtonText>
              <ButtonIcon icon={ChevronDown} position="right" />
            </Button>
          )}
        </Menu.Trigger>
        <Menu.Outer style={{minWidth: 170}}>
          <Menu.Group>
            <Menu.Item
              label={_(msg`Share link`)}
              testID="shareStarterPackLinkBtn"
              onPress={onShareLink}>
              <Menu.ItemText>
                <Trans>Share link</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={ArrowOutOfBox} position="right" />
            </Menu.Item>
            <Menu.Item
              label={_(msg`Create QR code`)}
              testID="createQRCodeBtn"
              onPress={() => {
                setIsQrDialogOpen(true)
                qrCodeDialogControl.open()
              }}>
              <Menu.ItemText>
                <Trans>Create QR code</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={QrCode} position="right" />
            </Menu.Item>
          </Menu.Group>
        </Menu.Outer>
      </Menu.Root>

      <QrCodeDialog
        control={qrCodeDialogControl}
        starterPack={starterPack}
        isOpen={isQrDialogOpen}
        setIsOpen={setIsQrDialogOpen}
      />
    </>
  )
}
