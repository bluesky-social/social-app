import {useCallback, useMemo, useRef, useState} from 'react'
import {View} from 'react-native'
import {useAnimatedRef} from 'react-native-reanimated'
import {
  AppBskyGraphDefs,
  AtUri,
  moderateUserList,
  type ModerationOpts,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useIsFocused} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {useSetTitle} from '#/lib/hooks/useSetTitle'
import {ComposeIcon2} from '#/lib/icons'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useListQuery} from '#/state/queries/list'
import {RQKEY as FEED_RQKEY} from '#/state/queries/post-feed'
import {
  usePreferencesQuery,
  type UsePreferencesQueryResponse,
} from '#/state/queries/preferences'
import {useResolveUriQuery} from '#/state/queries/resolve-uri'
import {truncateAndInvalidate} from '#/state/queries/util'
import {useSession} from '#/state/session'
import {useSetMinimalShellMode} from '#/state/shell'
import {PagerWithHeader} from '#/view/com/pager/PagerWithHeader'
import {FAB} from '#/view/com/util/fab/FAB'
import {type ListRef} from '#/view/com/util/List'
import {ListHiddenScreen} from '#/screens/List/ListHiddenScreen'
import {atoms as a, native, platform, useTheme} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import {ListAddRemoveUsersDialog} from '#/components/dialogs/lists/ListAddRemoveUsersDialog'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import * as Hider from '#/components/moderation/Hider'
import {IS_WEB} from '#/env'
import {AboutSection} from './AboutSection'
import {ErrorScreen} from './components/ErrorScreen'
import {Header} from './components/Header'
import {FeedSection} from './FeedSection'

interface SectionRef {
  scrollToTop: () => void
}

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ProfileList'>
export function ProfileListScreen(props: Props) {
  return (
    <Layout.Screen testID="profileListScreen">
      <ProfileListScreenInner {...props} />
    </Layout.Screen>
  )
}

function ProfileListScreenInner(props: Props) {
  const {_} = useLingui()
  const {name: handleOrDid, rkey} = props.route.params
  const {data: resolvedUri, error: resolveError} = useResolveUriQuery(
    AtUri.make(handleOrDid, 'app.bsky.graph.list', rkey).toString(),
  )
  const {data: preferences} = usePreferencesQuery()
  const {data: list, error: listError} = useListQuery(resolvedUri?.uri)
  const moderationOpts = useModerationOpts()

  if (resolveError) {
    return (
      <>
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Could not load list</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot />
        </Layout.Header.Outer>
        <Layout.Content centerContent>
          <ErrorScreen
            error={_(
              msg`We're sorry, but we were unable to resolve this list. If this persists, please contact the list creator, @${handleOrDid}.`,
            )}
          />
        </Layout.Content>
      </>
    )
  }
  if (listError) {
    return (
      <>
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Could not load list</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot />
        </Layout.Header.Outer>
        <Layout.Content centerContent>
          <ErrorScreen error={cleanError(listError)} />
        </Layout.Content>
      </>
    )
  }

  return resolvedUri && list && moderationOpts && preferences ? (
    <ProfileListScreenLoaded
      {...props}
      uri={resolvedUri.uri}
      list={list}
      moderationOpts={moderationOpts}
      preferences={preferences}
    />
  ) : (
    <>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content />
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content
        centerContent
        contentContainerStyle={platform({
          web: [a.mx_auto],
          native: [a.align_center],
        })}>
        <Loader size="2xl" />
      </Layout.Content>
    </>
  )
}

function ProfileListScreenLoaded({
  route,
  uri,
  list,
  moderationOpts,
  preferences,
}: Props & {
  uri: string
  list: AppBskyGraphDefs.ListView
  moderationOpts: ModerationOpts
  preferences: UsePreferencesQueryResponse
}) {
  const t = useTheme()
  const {_} = useLingui()
  const queryClient = useQueryClient()
  const {openComposer} = useOpenComposer()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {currentAccount} = useSession()
  const {rkey} = route.params
  const feedSectionRef = useRef<SectionRef>(null)
  const aboutSectionRef = useRef<SectionRef>(null)
  const isCurateList = list.purpose === AppBskyGraphDefs.CURATELIST
  const isScreenFocused = useIsFocused()
  const isHidden = list.labels?.findIndex(l => l.val === '!hide') !== -1
  const isOwner = currentAccount?.did === list.creator.did
  const scrollElRef = useAnimatedRef()
  const addUserDialogControl = useDialogControl()
  const sectionTitlesCurate = [_(msg`Posts`), _(msg`People`)]
  // modlist only
  const [headerHeight, setHeaderHeight] = useState<number | null>(null)

  const moderation = useMemo(() => {
    return moderateUserList(list, moderationOpts)
  }, [list, moderationOpts])

  useSetTitle(isHidden ? _(msg`List Hidden`) : list.name)

  useFocusEffect(
    useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const onChangeMembers = () => {
    if (isCurateList) {
      truncateAndInvalidate(queryClient, FEED_RQKEY(`list|${list.uri}`))
    }
  }

  const onCurrentPageSelected = useCallback(
    (index: number) => {
      if (index === 0) {
        feedSectionRef.current?.scrollToTop()
      } else if (index === 1) {
        aboutSectionRef.current?.scrollToTop()
      }
    },
    [feedSectionRef],
  )

  const renderHeader = useCallback(() => {
    return <Header rkey={rkey} list={list} preferences={preferences} />
  }, [rkey, list, preferences])

  if (isCurateList) {
    return (
      <Hider.Outer modui={moderation.ui('contentView')} allowOverride={isOwner}>
        <Hider.Mask>
          <ListHiddenScreen list={list} preferences={preferences} />
        </Hider.Mask>
        <Hider.Content>
          <View style={[a.util_screen_outer]}>
            <PagerWithHeader
              items={sectionTitlesCurate}
              isHeaderReady={true}
              renderHeader={renderHeader}
              onCurrentPageSelected={onCurrentPageSelected}>
              {({headerHeight, scrollElRef, isFocused}) => (
                <FeedSection
                  ref={feedSectionRef}
                  feed={`list|${uri}`}
                  scrollElRef={scrollElRef as ListRef}
                  headerHeight={headerHeight}
                  isFocused={isScreenFocused && isFocused}
                  isOwner={isOwner}
                  onPressAddUser={addUserDialogControl.open}
                />
              )}
              {({headerHeight, scrollElRef}) => (
                <AboutSection
                  ref={aboutSectionRef}
                  scrollElRef={scrollElRef as ListRef}
                  list={list}
                  onPressAddUser={addUserDialogControl.open}
                  headerHeight={headerHeight}
                />
              )}
            </PagerWithHeader>
            <FAB
              testID="composeFAB"
              onPress={() => openComposer({logContext: 'Fab'})}
              icon={
                <ComposeIcon2
                  strokeWidth={1.5}
                  size={29}
                  style={{color: 'white'}}
                />
              }
              accessibilityRole="button"
              accessibilityLabel={_(msg`New post`)}
              accessibilityHint=""
            />
          </View>
          <ListAddRemoveUsersDialog
            control={addUserDialogControl}
            list={list}
            onChange={onChangeMembers}
          />
        </Hider.Content>
      </Hider.Outer>
    )
  }
  return (
    <Hider.Outer modui={moderation.ui('contentView')} allowOverride={isOwner}>
      <Hider.Mask>
        <ListHiddenScreen list={list} preferences={preferences} />
      </Hider.Mask>
      <Hider.Content>
        <View style={[a.util_screen_outer]}>
          <Layout.Center
            onLayout={evt => setHeaderHeight(evt.nativeEvent.layout.height)}
            style={[
              native([a.absolute, a.z_10, t.atoms.bg]),

              a.border_b,
              t.atoms.border_contrast_low,
            ]}>
            {renderHeader()}
          </Layout.Center>
          {headerHeight !== null && (
            <AboutSection
              list={list}
              scrollElRef={scrollElRef as ListRef}
              onPressAddUser={addUserDialogControl.open}
              headerHeight={IS_WEB ? 0 : headerHeight}
            />
          )}
          <FAB
            testID="composeFAB"
            onPress={() => openComposer({logContext: 'Fab'})}
            icon={
              <ComposeIcon2
                strokeWidth={1.5}
                size={29}
                style={{color: 'white'}}
              />
            }
            accessibilityRole="button"
            accessibilityLabel={_(msg`New post`)}
            accessibilityHint=""
          />
        </View>
        <ListAddRemoveUsersDialog
          control={addUserDialogControl}
          list={list}
          onChange={onChangeMembers}
        />
      </Hider.Content>
    </Hider.Outer>
  )
}
