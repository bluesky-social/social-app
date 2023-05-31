import React from 'react'
import {StyleSheet, View} from 'react-native'
import {AtUri, AppBskyGraphDefs, RichText} from '@atproto/api'
import {Link} from '../util/Link'
import {Text} from '../util/text/Text'
import {RichText as RichTextCom} from '../util/text/RichText'
import {UserAvatar} from '../util/UserAvatar'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {sanitizeDisplayName} from 'lib/strings/display-names'

export const ListCard = ({
  testID,
  list,
  noBg,
  noBorder,
  renderButton,
}: {
  testID?: string
  list: AppBskyGraphDefs.ListView
  noBg?: boolean
  noBorder?: boolean
  renderButton?: () => JSX.Element
}) => {
  const pal = usePalette('default')
  const store = useStores()

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
      ]}
      href={`/profile/${list.creator.did}/lists/${rkey}`}
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
            {list.purpose === 'app.bsky.graph.defs#modlist' && 'Mute list'} by{' '}
            {list.creator.did === store.me.did
              ? 'you'
              : `@${list.creator.handle}`}
          </Text>
          {!!list.viewer?.muted && (
            <View style={s.flexRow}>
              <View style={[s.mt5, pal.btn, styles.pill]}>
                <Text type="xs" style={pal.text}>
                  Subscribed
                </Text>
              </View>
            </View>
          )}
        </View>
        {renderButton ? (
          <View style={styles.layoutButton}>{renderButton()}</View>
        ) : undefined}
      </View>
      {descriptionRichText ? (
        <View style={styles.details}>
          <RichTextCom
            style={pal.text}
            numberOfLines={20}
            richText={descriptionRichText}
          />
        </View>
      ) : undefined}
    </Link>
  )
}

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: 1,
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
