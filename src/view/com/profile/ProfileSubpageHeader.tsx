import React from 'react'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useNavigation} from '@react-navigation/native'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {TextLink} from '../util/Link'
import {UserAvatar, UserAvatarType} from '../util/UserAvatar'
import {LoadingPlaceholder} from '../util/LoadingPlaceholder'
import {CenteredView} from '../util/Views'
import {sanitizeHandle} from 'lib/strings/handles'
import {makeProfileLink} from 'lib/routes/links'
import {NavigationProp} from 'lib/routes/types'
import {BACK_HITSLOP} from 'lib/constants'
import {useLightboxControls, ImagesLightbox} from '#/state/lightbox'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'
import {useSetDrawerOpen} from '#/state/shell'
import {emitSoftReset} from '#/state/events'

import { Box, useTokens, web, Pressable, Text } from '#/alf'

export function ProfileSubpageHeader({
  isLoading,
  href,
  title,
  avatar,
  isOwner,
  creator,
  avatarType,
  children,
}: React.PropsWithChildren<{
  isLoading?: boolean
  href: string
  title: string | undefined
  avatar: string | undefined
  isOwner: boolean | undefined
  creator:
    | {
        did: string
        handle: string
      }
    | undefined
  avatarType: UserAvatarType
}>) {
  const setDrawerOpen = useSetDrawerOpen()
  const navigation = useNavigation<NavigationProp>()
  const {_} = useLingui()
  const {isMobile} = useWebMediaQueries()
  const {openLightbox} = useLightboxControls()
  const tokens = useTokens()
  const canGoBack = navigation.canGoBack()

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  const onPressMenu = React.useCallback(() => {
    setDrawerOpen(true)
  }, [setDrawerOpen])

  const onPressAvi = React.useCallback(() => {
    if (
      avatar // TODO && !(view.moderation.avatar.blur && view.moderation.avatar.noOverride)
    ) {
      openLightbox(new ImagesLightbox([{uri: avatar}], 0))
    }
  }, [openLightbox, avatar])

  return (
    <CenteredView style={{ backgroundColor: tokens.color.l0 }}>
      {isMobile && (
        <Box
          row aic
          pt={web('s')}
          pb='s'
          px='m'
          borderColor='l3'
          borderBottomWidth={1}
          gtMobile={{
            px: 14
          }}>
          <Pressable
            testID="headerDrawerBtn"
            onPress={canGoBack ? onPressBack : onPressMenu}
            hitSlop={BACK_HITSLOP}
            w={canGoBack ? 20 : 40}
            h={30}
            px={canGoBack ? 0 : 6}
            accessibilityRole="button"
            accessibilityLabel={canGoBack ? 'Back' : 'Menu'}
            accessibilityHint="">
            {canGoBack ? (
              <FontAwesomeIcon
                size={18}
                icon="angle-left"
                style={{ marginTop: tokens.space.s, color: tokens.color.l5 }}
              />
            ) : (
              <FontAwesomeIcon
                size={18}
                icon="bars"
                style={{ marginTop: tokens.space.s, color: tokens.color.l5 }}
              />
            )}
          </Pressable>
          <Box style={{flex: 1}} />
          {children}
        </Box>
      )}
      <Box
        row
        gap='m'
        pt='m'
        pb='s'
        px='m'
        gtMobile={{
          px: 14
        }}>
        <Pressable
          testID="headerAviButton"
          onPress={onPressAvi}
          accessibilityRole="image"
          accessibilityLabel={_(msg`View the avatar`)}
          accessibilityHint=""
          style={{width: 58}}>
          <UserAvatar type={avatarType} size={58} avatar={avatar} />
        </Pressable>
        <Box flex={1}>
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
              style={{fontWeight: 'bold', color: tokens.color.l7}}
              text={title || ''}
              onPress={emitSoftReset}
              numberOfLines={4}
            />
          )}

          {isLoading ? (
            <LoadingPlaceholder width={50} height={8} />
          ) : (
            <Text fontSize='l' c='l5' numberOfLines={1}>
              by{' '}
              {!creator ? (
                '—'
              ) : isOwner ? (
                'you'
              ) : (
                <TextLink
                  text={sanitizeHandle(creator.handle, '@')}
                  href={makeProfileLink(creator)}
                  style={{ color: tokens.color.l5 }}
                />
              )}
            </Text>
          )}
        </Box>
        {!isMobile && (
          <Box row aic>
            {children}
          </Box>
        )}
      </Box>
    </CenteredView>
  )
}
