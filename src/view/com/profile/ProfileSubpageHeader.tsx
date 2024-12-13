import React from 'react'
import {Pressable, View} from 'react-native'
import {MeasuredDimensions, runOnJS, runOnUI} from 'react-native-reanimated'
import {AppBskyGraphDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {measureHandle, useHandleRef} from '#/lib/hooks/useHandleRef'
import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {makeProfileLink} from '#/lib/routes/links'
import {NavigationProp} from '#/lib/routes/types'
import {sanitizeHandle} from '#/lib/strings/handles'
import {emitSoftReset} from '#/state/events'
import {useLightboxControls} from '#/state/lightbox'
import {TextLink} from '#/view/com/util/Link'
import {LoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {Text} from '#/view/com/util/text/Text'
import {UserAvatar, UserAvatarType} from '#/view/com/util/UserAvatar'
import {StarterPack} from '#/components/icons/StarterPack'
import * as Layout from '#/components/Layout'

export function ProfileSubpageHeader({
  isLoading,
  href,
  title,
  avatar,
  isOwner,
  purpose,
  creator,
  avatarType,
  children,
}: React.PropsWithChildren<{
  isLoading?: boolean
  href: string
  title: string | undefined
  avatar: string | undefined
  isOwner: boolean | undefined
  purpose: AppBskyGraphDefs.ListPurpose | undefined
  creator:
    | {
        did: string
        handle: string
      }
    | undefined
  avatarType: UserAvatarType | 'starter-pack'
}>) {
  const navigation = useNavigation<NavigationProp>()
  const {_} = useLingui()
  const {isMobile} = useWebMediaQueries()
  const {openLightbox} = useLightboxControls()
  const pal = usePalette('default')
  const canGoBack = navigation.canGoBack()
  const aviRef = useHandleRef()

  const _openLightbox = React.useCallback(
    (uri: string, thumbRect: MeasuredDimensions | null) => {
      openLightbox({
        images: [
          {
            uri,
            thumbUri: uri,
            thumbRect,
            dimensions: {
              // It's fine if it's actually smaller but we know it's 1:1.
              height: 1000,
              width: 1000,
            },
            thumbDimensions: null,
            type: 'rect-avi',
          },
        ],
        index: 0,
      })
    },
    [openLightbox],
  )

  const onPressAvi = React.useCallback(() => {
    if (
      avatar // TODO && !(view.moderation.avatar.blur && view.moderation.avatar.noOverride)
    ) {
      const aviHandle = aviRef.current
      runOnUI(() => {
        'worklet'
        const rect = measureHandle(aviHandle)
        runOnJS(_openLightbox)(avatar, rect)
      })()
    }
  }, [_openLightbox, avatar, aviRef])

  return (
    <>
      <Layout.Header.Outer>
        {canGoBack ? (
          <Layout.Header.BackButton />
        ) : (
          <Layout.Header.MenuButton />
        )}
        <Layout.Header.Content />
        {children}
      </Layout.Header.Outer>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          paddingTop: 14,
          paddingBottom: 14,
          paddingHorizontal: isMobile ? 12 : 14,
        }}>
        <View ref={aviRef} collapsable={false}>
          <Pressable
            testID="headerAviButton"
            onPress={onPressAvi}
            accessibilityRole="image"
            accessibilityLabel={_(msg`View the avatar`)}
            accessibilityHint=""
            style={{width: 58}}>
            {avatarType === 'starter-pack' ? (
              <StarterPack width={58} gradient="sky" />
            ) : (
              <UserAvatar type={avatarType} size={58} avatar={avatar} />
            )}
          </Pressable>
        </View>
        <View style={{flex: 1, gap: 4}}>
          {isLoading ? (
            <LoadingPlaceholder
              width={200}
              height={32}
              style={{marginVertical: 6}}
            />
          ) : (
            <TextLink
              testID="headerTitle"
              type="title-xl"
              href={href}
              style={[pal.text, {fontWeight: '600'}]}
              text={title || ''}
              onPress={emitSoftReset}
              numberOfLines={4}
            />
          )}

          {isLoading || !creator ? (
            <LoadingPlaceholder width={50} height={8} />
          ) : (
            <Text type="lg" style={[pal.textLight]} numberOfLines={1}>
              {purpose === 'app.bsky.graph.defs#curatelist' ? (
                isOwner ? (
                  <Trans>List by you</Trans>
                ) : (
                  <Trans>
                    List by{' '}
                    <TextLink
                      text={sanitizeHandle(creator.handle || '', '@')}
                      href={makeProfileLink(creator)}
                      style={pal.textLight}
                    />
                  </Trans>
                )
              ) : purpose === 'app.bsky.graph.defs#modlist' ? (
                isOwner ? (
                  <Trans>Moderation list by you</Trans>
                ) : (
                  <Trans>
                    Moderation list by{' '}
                    <TextLink
                      text={sanitizeHandle(creator.handle || '', '@')}
                      href={makeProfileLink(creator)}
                      style={pal.textLight}
                    />
                  </Trans>
                )
              ) : purpose === 'app.bsky.graph.defs#referencelist' ? (
                isOwner ? (
                  <Trans>Starter pack by you</Trans>
                ) : (
                  <Trans>
                    Starter pack by{' '}
                    <TextLink
                      text={sanitizeHandle(creator.handle || '', '@')}
                      href={makeProfileLink(creator)}
                      style={pal.textLight}
                    />
                  </Trans>
                )
              ) : null}
            </Text>
          )}
        </View>
      </View>
    </>
  )
}
