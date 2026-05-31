import {useCallback, useEffect, useMemo, useState} from 'react'
import {LayoutAnimation, View} from 'react-native'
import {
  AppBskyFeedPost,
  AppBskyRichtextFacet,
  AtUri,
  moderatePost,
  RichText as RichTextAPI,
} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'
import {type RouteProp, useNavigation, useRoute} from '@react-navigation/native'

import {HITSLOP_20} from '#/lib/constants'
import {makeProfileLink} from '#/lib/routes/links'
import {
  type CommonNavigatorParams,
  type NavigationProp,
} from '#/lib/routes/types'
import {
  convertBskyAppUrlIfNeeded,
  isBskyPostUrl,
  makeRecordUri,
} from '#/lib/strings/url-helpers'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {usePostQuery} from '#/state/queries/post'
import {PostMeta} from '#/view/com/util/PostMeta'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Loader} from '#/components/Loader'
import * as MediaPreview from '#/components/MediaPreview'
import {ContentHider} from '#/components/moderation/ContentHider'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'
import * as bsky from '#/types/bsky'

export function useMessageEmbed() {
  const route =
    useRoute<RouteProp<CommonNavigatorParams, 'MessagesConversation'>>()
  const navigation = useNavigation<NavigationProp>()
  const embedFromParams = route.params.embed

  const [embedUri, setEmbedUri] = useState(embedFromParams)

  if (embedFromParams && embedUri !== embedFromParams) {
    setEmbedUri(embedFromParams)
  }

  return {
    embedUri,
    setEmbed: useCallback(
      (embedUrl: string | undefined) => {
        if (!embedUrl) {
          navigation.setParams({embed: ''})
          setEmbedUri(undefined)
          return
        }

        if (embedFromParams) return

        const url = convertBskyAppUrlIfNeeded(embedUrl)
        const [_0, user, _1, rkey] = url.split('/').filter(Boolean)
        const uri = makeRecordUri(user, 'app.bsky.feed.post', rkey)

        setEmbedUri(uri)
      },
      [embedFromParams, navigation],
    ),
  }
}

export function useExtractEmbedFromFacets(
  message: string,
  setEmbed: (embedUrl: string | undefined) => void,
) {
  const rt = new RichTextAPI({text: message})
  rt.detectFacetsWithoutResolution()

  let uriFromFacet: string | undefined

  for (const facet of rt.facets ?? []) {
    for (const feature of facet.features) {
      if (AppBskyRichtextFacet.isLink(feature) && isBskyPostUrl(feature.uri)) {
        uriFromFacet = feature.uri
        break
      }
    }
  }

  useEffect(() => {
    if (uriFromFacet) {
      setEmbed(uriFromFacet)
    }
  }, [uriFromFacet, setEmbed])
}

export function MessageInputEmbed({
  embedUri,
  setEmbed,
}: {
  embedUri: string | undefined
  setEmbed: (embedUrl: string | undefined) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const {data: post, status} = usePostQuery(embedUri)

  const moderationOpts = useModerationOpts()
  const moderation = useMemo(
    () =>
      moderationOpts && post ? moderatePost(post, moderationOpts) : undefined,
    [moderationOpts, post],
  )

  const {rt, record} = useMemo(() => {
    if (
      post &&
      bsky.dangerousIsType<AppBskyFeedPost.Record>(
        post.record,
        AppBskyFeedPost.isRecord,
      )
    ) {
      return {
        rt: new RichTextAPI({
          text: post.record.text,
          facets: post.record.facets,
        }),
        record: post.record,
      }
    }

    return {rt: undefined, record: undefined}
  }, [post])

  if (!embedUri) {
    return null
  }

  const onRemove = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setEmbed(undefined)
  }

  switch (status) {
    case 'pending': {
      return (
        <SimpleContainer onRemove={onRemove}>
          <Loader />
        </SimpleContainer>
      )
    }
    case 'error': {
      return (
        <SimpleContainer onRemove={onRemove}>
          <Text style={[a.text_center, t.atoms.text_contrast_medium, a.italic]}>
            <Trans>Could not fetch post</Trans>
          </Text>
        </SimpleContainer>
      )
    }
    case 'success': {
      const itemUrip = new AtUri(post.uri)
      const itemHref = makeProfileLink(post.author, 'post', itemUrip.rkey)

      if (!post || !moderation || !rt || !record) {
        return null
      }

      return (
        <View
          style={[
            a.flex_1,
            t.atoms.border_contrast_high,
            a.rounded_md,
            a.border,
            a.p_sm,
            a.mt_sm,
            a.mx_sm,
          ]}>
          <View style={[a.flex_1, a.flex_row, a.gap_sm]}>
            <PostMeta
              showAvatar
              author={post.author}
              moderation={moderation}
              timestamp={post.indexedAt}
              postHref={itemHref}
              linkDisabled
            />
            <Button
              label={l`Remove embed`}
              onPress={onRemove}
              style={[a.px_2xs, {transform: [{translateY: -2}]}]}
              hitSlop={HITSLOP_20}>
              <XIcon size="xs" style={t.atoms.text_contrast_high} />
            </Button>
          </View>
          <ContentHider modui={moderation.ui('contentView')}>
            <PostAlerts
              modui={moderation.ui('contentView')}
              style={a.py_xs}
              size="sm"
            />
            {rt.text && (
              <RichText
                enableTags
                testID="postText"
                value={rt}
                style={[a.text_sm, t.atoms.text_contrast_high]}
                authorHandle={post.author.handle}
                numberOfLines={3}
              />
            )}
            <MediaPreview.Embed embed={post.embed} style={a.mt_sm} />
          </ContentHider>
        </View>
      )
    }
  }
}

function SimpleContainer({
  children,
  onRemove,
}: {
  children: React.ReactNode
  onRemove?: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  return (
    <View
      style={[
        a.flex_1,
        {minHeight: 80},
        a.justify_center,
        a.align_center,
        t.atoms.border_contrast_high,
        a.rounded_md,
        a.border,
        a.mt_sm,
        a.mx_sm,
      ]}>
      {children}
      {onRemove && (
        <Button
          label={l`Remove embed`}
          onPress={onRemove}
          style={[
            a.absolute,
            {top: 10, right: 8},
            a.px_2xs,
            {transform: [{translateY: -2}]},
          ]}
          hitSlop={HITSLOP_20}>
          <XIcon size="xs" style={t.atoms.text_contrast_high} />
        </Button>
      )}
    </View>
  )
}
