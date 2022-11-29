import React, {useEffect, useState} from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import {Entity} from '../../../third-party/api/src/client/types/app/bsky/feed/post'
import {Link} from '../util/Link'
import {LinkMeta, getLikelyType, LikelyType} from '../../../lib/link-meta'
import {colors} from '../../lib/styles'
import {useStores} from '../../../state'

export function PostEmbeds({
  entities,
  style,
}: {
  entities?: Entity[]
  style?: StyleProp<ViewStyle>
}) {
  const store = useStores()
  const [linkMeta, setLinkMeta] = useState<LinkMeta | undefined>(undefined)
  const link = entities?.find(
    ent =>
      ent.type === 'link' && getLikelyType(ent.value || '') === LikelyType.HTML,
  )

  useEffect(() => {
    let aborted = false
    store.linkMetas.getLinkMeta(link?.value || '').then(linkMeta => {
      if (!aborted) {
        setLinkMeta(linkMeta)
      }
    })

    return () => {
      aborted = true
    }
  }, [link])

  if (!link) {
    return <View />
  }

  return (
    <Link style={[styles.outer, style]} href={link.value}>
      {linkMeta ? (
        <>
          <Text numberOfLines={1} style={styles.title}>
            {linkMeta.title || linkMeta.url}
          </Text>
          <Text numberOfLines={1} style={styles.url}>
            {linkMeta.url}
          </Text>
          {linkMeta.description ? (
            <Text numberOfLines={2} style={styles.description}>
              {linkMeta.description}
            </Text>
          ) : undefined}
        </>
      ) : (
        <ActivityIndicator />
      )}
    </Link>
  )
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: 1,
    borderColor: colors.gray2,
    borderRadius: 8,
    padding: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    marginTop: 4,
    fontSize: 15,
  },
  url: {
    color: colors.gray4,
  },
})
