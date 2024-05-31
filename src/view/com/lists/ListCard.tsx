import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {AppBskyGraphDefs, AtUri, RichText} from '@atproto/api'
import {Trans} from '@lingui/macro'

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
import hairlineWidth = StyleSheet.hairlineWidth

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
  const pal = usePalette('default')
  const {currentAccount} = useSession()

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
      title={list.name}
      asAnchor
      anchorNoUnderline>
      <View style={styles.layout}>
        <View style={styles.layoutAvi}>
          <UserAvatar type="list" size={40} avatar={list.avatar} />
        </View>
        <View style={styles.layoutContent}>
          <Text
            type="lg"
            style={[s.bold, pal.text]}
            numberOfLines={1}
            lineHeight={1.2}>
            {sanitizeDisplayName(list.name)}
          </Text>
          <Text type="md" style={[pal.textLight]} numberOfLines={1}>
            {list.purpose === 'app.bsky.graph.defs#curatelist' &&
              (list.creator.did === currentAccount?.did ? (
                <Trans>User list by you</Trans>
              ) : (
                <Trans>
                  User list by {sanitizeHandle(list.creator.handle, '@')}
                </Trans>
              ))}
            {list.purpose === 'app.bsky.graph.defs#modlist' &&
              (list.creator.did === currentAccount?.did ? (
                <Trans>Moderation list by you</Trans>
              ) : (
                <Trans>
                  Moderation list by {sanitizeHandle(list.creator.handle, '@')}
                </Trans>
              ))}
          </Text>
          <View style={s.flexRow}>
            {list.viewer?.muted ? (
              <View style={[s.mt5, pal.btn, styles.pill]}>
                <Text type="xs" style={pal.text}>
                  <Trans>Muted</Trans>
                </Text>
              </View>
            ) : null}

            {list.viewer?.blocked ? (
              <View style={[s.mt5, pal.btn, styles.pill]}>
                <Text type="xs" style={pal.text}>
                  <Trans>Blocked</Trans>
                </Text>
              </View>
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

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: hairlineWidth,
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
