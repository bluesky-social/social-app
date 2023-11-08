import React from 'react'
import {StyleSheet, View} from 'react-native'
import {ModerationUI} from '@atproto/api'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {s} from 'lib/styles'
import {Text} from '../util/text/Text'
import {TextLink} from '../util/Link'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb} from 'platform/detection'
import {listUriToHref} from 'lib/strings/url-helpers'
import {Button} from '../util/forms/Button'
import {useModalControls} from '#/state/modals'

export const snapPoints = [300]

export function Component({
  context,
  moderation,
}: {
  context: 'account' | 'content'
  moderation: ModerationUI
}) {
  const {closeModal} = useModalControls()
  const {isMobile} = useWebMediaQueries()
  const pal = usePalette('default')

  let name
  let description
  if (!moderation.cause) {
    name = 'Content Warning'
    description =
      'Moderator has chosen to set a general warning on the content.'
  } else if (moderation.cause.type === 'blocking') {
    if (moderation.cause.source.type === 'list') {
      const list = moderation.cause.source.list
      name = 'User Blocked by List'
      description = (
        <>
          This user is included in the{' '}
          <TextLink
            type="2xl"
            href={listUriToHref(list.uri)}
            text={list.name}
            style={pal.link}
          />{' '}
          list which you have blocked.
        </>
      )
    } else {
      name = 'User Blocked'
      description = 'You have blocked this user. You cannot view their content.'
    }
  } else if (moderation.cause.type === 'blocked-by') {
    name = 'User Blocks You'
    description = 'This user has blocked you. You cannot view their content.'
  } else if (moderation.cause.type === 'block-other') {
    name = 'Content Not Available'
    description =
      'This content is not available because one of the users involved has blocked the other.'
  } else if (moderation.cause.type === 'muted') {
    if (moderation.cause.source.type === 'list') {
      const list = moderation.cause.source.list
      name = <>Account Muted by List</>
      description = (
        <>
          This user is included the{' '}
          <TextLink
            type="2xl"
            href={listUriToHref(list.uri)}
            text={list.name}
            style={pal.link}
          />{' '}
          list which you have muted.
        </>
      )
    } else {
      name = 'Account Muted'
      description = 'You have muted this user.'
    }
  } else {
    name = moderation.cause.labelDef.strings[context].en.name
    description = moderation.cause.labelDef.strings[context].en.description
  }

  return (
    <View
      testID="moderationDetailsModal"
      style={[
        styles.container,
        {
          paddingHorizontal: isMobile ? 14 : 0,
        },
        pal.view,
      ]}>
      <Text type="title-xl" style={[pal.text, styles.title]}>
        {name}
      </Text>
      <Text type="2xl" style={[pal.text, styles.description]}>
        {description}
      </Text>
      <View style={s.flex1} />
      <Button type="primary" style={styles.btn} onPress={() => closeModal()}>
        <Text type="button-lg" style={[pal.textLight, s.textCenter, s.white]}>
          Okay
        </Text>
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
  },
  btn: {
    paddingVertical: 14,
    marginTop: isWeb ? 40 : 0,
    marginBottom: isWeb ? 0 : 40,
  },
})
