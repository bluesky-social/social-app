import React, {useEffect, useMemo, useState} from 'react'
import {View, StyleSheet, TouchableOpacity} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {Text} from '../../util/text/Text'
import {AppBskyEmbedExternal} from '@atproto/api'
import {usePalette} from 'lib/hooks/usePalette'
import {useStores} from 'state/index'
import {PostsFeedItemModel} from 'state/models/feeds/post'
import {observer} from 'mobx-react-lite'
import {CardFrame} from '../card/CardFrame'
import {GroupFeedModel} from 'state/models/feeds/waverly/group-feed'
import {useDevSignedIn} from 'lib/hooks/waverly/dev/useDevSignedIn'
import {extractMiniblogUriInfo} from 'lib/waverly/miniblog-uris'
import {CardBody} from '../card/CardBody'
import {PostView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import {MiniblogModel} from 'state/models/feeds/waverly/miniblog'
import {Link} from 'view/com/util/Link'
import {s} from 'lib/styles'

const GROUP = 'betterweb.group'

interface GradientConfig {
  from: string
  to: string
}

const GRADIENTS: GradientConfig[] = [
  {from: '#F3E9D4', to: '#29C5B2'},
  {from: '#B97DD4', to: '#F5AB68'},
  {from: '#D8D2CC', to: '#4F2629'},
  {from: '#CFC6C7', to: '#393943'},
  {from: '#CADFE9', to: '#20759A'},
]

export const DevCardTester = observer(function DevCardTester() {
  const pal = usePalette('default')
  const store = useStores()

  const [selectedGradient, setSelectedGradient] = useState(0)
  const {state} = useDevSignedIn()
  const [groupFeedModel, setGroupFeedModel] = useState<
    GroupFeedModel | undefined
  >(undefined)
  const [groupDid, setGroupDid] = useState<string | undefined>()

  const [activePost, setActivePost] = useState<PostsFeedItemModel | null>(null)

  useEffect(() => {
    if (state !== 'signedIn') return
    store.agent.com.atproto.identity
      .resolveHandle({handle: GROUP})
      .then(res => setGroupDid(res.data.did))
  }, [state, store])

  useEffect(() => {
    setGroupFeedModel(
      groupDid
        ? new GroupFeedModel(store, 'author', {actor: groupDid})
        : undefined,
    )
  }, [groupDid, store])

  useEffect(() => {
    groupFeedModel?.clear()
    groupFeedModel?.setup()
  }, [groupFeedModel])

  let message: string | undefined
  if (state === 'signingIn') message = 'Signing in...'
  else if (state === 'error') message = 'Error signing in...'
  else if (!groupFeedModel) message = 'Internal error, not groupFeedModel.'
  else if (groupFeedModel.isLoading) message = 'Loading feed...'
  else if (!groupFeedModel.hasLoaded) message = 'Loading has not started...'
  else if (groupFeedModel.isRefreshing) message = 'Refreshing feed...'
  else if (groupFeedModel.isEmpty) message = 'Empty feed'
  else message = groupFeedModel.error

  if (message) {
    return (
      <View style={styles.container}>
        <Text style={pal.text}>{message}</Text>
      </View>
    )
  }

  if (activePost) {
    return (
      <>
        <View style={styles.container}>
          <LinearGradient
            colors={[
              GRADIENTS[selectedGradient].from,
              GRADIENTS[selectedGradient].to,
            ]}
            start={{x: 0, y: 0}}
            end={{x: 0, y: 1}}
            style={styles.cardContainer}>
            <CardFrame groupPost={activePost}>
              <CardBody groupPost={activePost} />
            </CardFrame>
          </LinearGradient>
        </View>
        <Link
          onPress={() => {
            setActivePost(null)
          }}>
          <Text style={[s.pl10, s.pb5, pal.link]}>Back to card browser</Text>
        </Link>
      </>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.gradientButtonBox}>
        {GRADIENTS.map((g, i) => (
          <GradientButton
            key={`gradient-${i}`}
            {...g}
            selected={i === selectedGradient}
            onPress={() => setSelectedGradient(i)}
          />
        ))}
      </View>
      {[...groupFeedModel!.posts].reverse().map(groupPost => {
        return (
          <PostButton
            key={groupPost._reactKey}
            groupPost={groupPost}
            onPress={() => setActivePost(groupPost)}
          />
        )
      })}
    </View>
  )
})

interface GradientButtonProps extends GradientConfig {
  selected: boolean
  onPress: () => void
}

function GradientButton({from, to, selected, onPress}: GradientButtonProps) {
  const selStyle = selected ? {borderWidth: 3, padding: 1} : {}

  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={[styles.gradientButton, selStyle]}
      onPress={onPress}>
      <LinearGradient
        colors={[from, to]}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.gradientInButton}
      />
    </TouchableOpacity>
  )
}

interface PostButtonProps {
  groupPost: PostsFeedItemModel
  onPress: () => void
}

const PostButton = observer(function PostButton({
  groupPost,
  onPress,
}: PostButtonProps) {
  const pal = usePalette('default')
  const store = useStores()

  const [postTraits, setPostTraits] = useState<string[]>([])

  const [miniblog, setMiniblog] = useState<MiniblogModel | undefined>()

  const userPost = useMemo(
    () => groupPost.reply?.root as PostView | undefined,
    [groupPost.reply?.root],
  )

  useEffect(() => {
    const res = MiniblogModel.fromFeedItem(store, groupPost)
    if (res) res.load()
    setMiniblog(res)
  }, [groupPost, store])

  useEffect(() => {
    const text = miniblog?.richText?.text ?? ''
    const traits = []
    if (text.length === 0 || extractMiniblogUriInfo(text))
      traits.push('No text')
    else if (text.length < 150) traits.push('Short text')
    else traits.push('Long text')

    if (userPost?.embed?.images) traits.push('Image')
    if (userPost?.embed?.external) {
      const external = userPost.embed
        .external as AppBskyEmbedExternal.ViewExternal
      // If the external link is to a miniblog, it's not really a link
      if (!extractMiniblogUriInfo(external.uri)) {
        if (external.uri.includes('youtube.com')) {
          traits.push('YouTube')
        } else {
          traits.push('Link')
          if (external.thumb) traits.push('Thumbnail')
        }
      }
    }
    setPostTraits(traits)
  }, [miniblog?.richText, userPost])

  return (
    <TouchableOpacity accessibilityRole="button" onPress={onPress}>
      <Text style={pal.text}>{postTraits.join(', ')}</Text>
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  container: {
    height: '92%',
    padding: 10,
    gap: 10,
  },
  cardContainer: {
    marginHorizontal: -10,
    paddingVertical: 30,
    paddingHorizontal: 10,
    flex: 1,
  },
  gradientButtonBox: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gradientButton: {
    width: 64,
    height: 64,
    borderColor: 'red',
  },
  gradientInButton: {
    width: '100%',
    height: '100%',
  },
})
