import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {AppBskyGraphDefs, AtUri, RichText} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useSession} from '#/state/session'
import {usePalette} from 'lib/hooks/usePalette'
import {makeProfileLink} from 'lib/routes/links'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {s} from 'lib/styles'
import {atoms as a} from '#/alf'
import {RichText as RichTextCom} from '#/components/RichText'
import {Link} from '../util/Link'
import {Text} from '../util/text/Text'
import {UserAvatar} from '../util/UserAvatar'

export const ListCard = ({
  testID,
  list,
  noBg,
  noBorder,
  renderButton,
  style,
}: {
  testID?: string
  list: AppBskyGraphDefs.ListView
  noBg?: boolean
  noBorder?: boolean
  renderButton?: () => JSX.Element
  style?: StyleProp<ViewStyle>
}) => {
  const {_} = useLingui()
  const pal = usePalette('default')
  const {currentAccount} = useSession()

  const isOwner = currentAccount?.did === list.creator.did
  const isListHidden = list.labels?.findIndex(l => l.val === '!hide') !== -1
  const hideTitle = !isOwner && isListHidden

  const isModList = list.purpose === 'app.bsky.graph.defs#modlist'
  const creatorHandle = sanitizeHandle(list.creator.handle, '@')

  const rkey = React.useMemo(() => {
    try {
      const urip = new AtUri(list.uri)
      return urip.rkey
    } catch {
      return ''
    }
  }, [list])

  const descriptionRichText = React.useMemo(() => {
    if (list.description) {
      return new RichText({
        text: list.description,
        facets: list.descriptionFacets,
      })
    }
    return undefined
  }, [list])

  return (
    <Link
      testID={testID}
      style={[
        styles.outer,
        pal.border,
        noBorder && styles.outerNoBorder,
        !noBg && pal.view,
        style,
      ]}
      href={makeProfileLink(list.creator, 'lists', rkey)}
      title={hideTitle ? _(msg`Hidden list`) : list.name}
      asAnchor
      anchorNoUnderline>
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <UserAvatar type="list" size={40} avatar={list.avatar} />
        </View>
        <View style={styles.layoutContent}>
          <Text
            type="lg"
            style={[s.bold, pal.text, hideTitle && {fontStyle: 'italic'}]}
            numberOfLines={1}
            lineHeight={1.2}>
            {hideTitle ? _(msg`Hidden list`) : sanitizeDisplayName(list.name)}
          </Text>
          <Text type="md" style={[pal.textLight]} numberOfLines={1}>
            {isOwner ? (
              isModList ? (
                <Trans>Moderation list by you</Trans>
              ) : (
                <Trans>User list by you</Trans>
              )
            ) : isModList ? (
              <Trans>Moderation list by {creatorHandle}</Trans>
            ) : (
              <Trans>User list by {creatorHandle}</Trans>
            )}
          </Text>
          <View style={s.flexRow}>
            {list.viewer?.muted ? (
              <PillText>
                <Trans>Muted</Trans>
              </PillText>
            ) : null}
            {list.viewer?.blocked ? (
              <PillText>
                <Trans>Blocked</Trans>
              </PillText>
            ) : null}
          </View>
        </View>
        {renderButton ? (
          <View style={styles.layoutButton}>{renderButton()}</View>
        ) : undefined}
      </View>
      {descriptionRichText ? (
        <View style={styles.details}>
          <RichTextCom
            style={[a.flex_1]}
            numberOfLines={20}
            value={descriptionRichText}
          />
        </View>
      ) : undefined}
    </Link>
  )
}

function PillText({children}: {children: React.ReactNode}) {
  const pal = usePalette('default')
  return (
    <Text type="xs" style={[s.mt5, pal.btn, styles.pill, pal.text]}>
      {children}
    </Text>
  )
}

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 6,
  },
  outerNoBorder: {
    borderTopWidth: 0,
  },
  layout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  layoutAvi: {
    width: 54,
    paddingLeft: 4,
    paddingTop: 8,
    paddingBottom: 10,
  },
  avi: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  layoutContent: {
    flex: 1,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  layoutButton: {
    paddingRight: 10,
  },
  details: {
    paddingLeft: 54,
    paddingRight: 10,
    paddingBottom: 10,
  },
  pill: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  btn: {
    paddingVertical: 7,
    borderRadius: 50,
    marginLeft: 6,
    paddingHorizontal: 14,
  },
})
