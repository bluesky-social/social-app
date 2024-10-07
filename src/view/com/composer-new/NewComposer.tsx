/* eslint-disable */

import React from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  View,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {AppBskyActorDefs, RichText} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {useIsKeyboardVisible} from '#/lib/hooks/useIsKeyboardVisible'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {isAndroid, isIOS} from '#/platform/detection'
import {emitPostCreated} from '#/state/events'
import {ComposerImage, pasteImage} from '#/state/gallery'
import {useRequireAltTextEnabled} from '#/state/preferences'
import {useProfileQuery} from '#/state/queries/profile'
import {Gif} from '#/state/queries/tenor'
import {ThreadgateAllowUISetting} from '#/state/queries/threadgate'
import {useAgent, useSession} from '#/state/session'
import {ComposerOpts, useComposerControls} from '#/state/shell/composer'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Warning_Stroke2_Corner0_Rounded as Warning} from '#/components/icons/Warning'
import {Text} from '#/components/Typography'
import {TextInput, TextInputRef} from '../composer/text-input/TextInput'
import {UserAvatar} from '../util/UserAvatar'
import {AddPostBtn} from './components/AddPostBtn'
import {CharProgress} from './components/CharProgress'
import {RemovePostBtn} from './components/RemovePostBtn'
import {SelectEmojiBtn} from './components/SelectEmojiBtn'
import {SelectLabelsBtn} from './components/SelectLabelsBtn'
import {SelectThreadgateBtn} from './components/SelectThreadgateBtn'
import {publish} from './compose'
import {ComposerReply} from './ComposerReply'
import {ExternalEmbed} from './embeds/ExternalEmbed'
import {GifEmbed} from './embeds/GifEmbed'
import {ImageEmbed} from './embeds/ImageEmbed'
import {RecordEmbed} from './embeds/RecordEmbed'
import {OpenCameraBtn} from './photos/OpenCameraBtn'
import {SelectGifBtn} from './photos/SelectGifBtn'
import {SelectPhotoBtn} from './photos/SelectPhotoBtn'
import {
  ComposerAction,
  createComposerState,
  getEmbedLabels,
  getImageCount,
  PostEmbed,
  PostStateWithDerivation,
  reducer,
} from './state'
import {cleanError, isNetworkError} from '#/lib/strings/errors'

export const PostComposer = ({
  data,
  openEmojiPicker,
}: {
  data: ComposerOpts
  openEmojiPicker?: (rect: DOMRect | undefined) => void
}) => {
  const {closeComposer} = useComposerControls()
  const requireAltTextEnabled = useRequireAltTextEnabled()

  const {_} = useLingui()

  const t = useTheme()
  const {isDesktop, isMobile} = useWebMediaQueries()

  const {currentAccount} = useSession()
  const agent = useAgent()

  const queryClient = useQueryClient()
  const {data: currentProfile} = useProfileQuery({did: currentAccount!.did})

  const [state, dispatch] = React.useReducer(reducer, data, createComposerState)
  const activePost = state.posts[state.active]
  const activePostLabels = getEmbedLabels(activePost.embed)

  const [isProcessing, setIsProcessing] = React.useState(false)
  const [processingState, setProcessingState] = React.useState('')
  const [error, setError] = React.useState('')

  const insets = useSafeAreaInsets()
  const [isKeyboardVisible] = useIsKeyboardVisible({iosUseWillEvents: true})
  const viewStyles = React.useMemo(
    () => ({
      paddingBottom:
        isAndroid || (isIOS && !isKeyboardVisible) ? insets.bottom : 0,
      paddingTop: isAndroid ? insets.top : 0,
    }),
    [insets, isKeyboardVisible],
  )

  const activeInputRef =
    React.useRef<React.MutableRefObject<TextInputRef | undefined>>()

  const publishPost = useNonReactiveCallback(async () => {
    if (!canPublish || isProcessing) {
      return
    }

    setError('')
    setIsProcessing(true)

    let success = false

    try {
      await publish({
        agent,
        queryClient: queryClient,
        state: state,
        onLog(msg) {
          setProcessingState(_(msg))
        },
      })

      success = true
    } catch (err) {
      if (isNetworkError(err)) {
        setError(
          _(
            msg`Failed to post. Please check your internet connection and try again.`,
          ),
        )
      } else {
        setError(cleanError(err))
      }
    } finally {
      setIsProcessing(false)
    }

    if (success) {
      closeComposer()

      emitPostCreated()
      data.onPost?.()
    }
  })

  const onPressCancel = React.useCallback(() => {
    closeComposer()
  }, [closeComposer])

  const canCreatePost = React.useMemo(() => {
    const active: PostStateWithDerivation = state.posts[state.active]
    const next: PostStateWithDerivation | undefined =
      state.posts[state.active + 1]

    return (
      (active.rtLength !== 0 || !!active.embed) &&
      (!next || next.rtLength !== 0)
    )
  }, [state.posts, state.active])

  const onThreadgateChange = React.useCallback(
    (next: ThreadgateAllowUISetting[]) => {
      return dispatch({type: 'set_threadgates', threadgates: next})
    },
    [dispatch],
  )

  const onEmojiPicker = React.useCallback(() => {
    const rect = activeInputRef.current?.current?.getCursorPosition()
    openEmojiPicker?.(rect)
  }, [activeInputRef, openEmojiPicker])

  const isAltTextMissingAndRequired =
    requireAltTextEnabled && state.isAltTextMissing

  const canPublish = !isAltTextMissingAndRequired && state.canPublish

  return (
    <KeyboardAvoidingView
      behavior={isIOS ? 'padding' : 'height'}
      style={[a.flex_1, a.h_full]}>
      <View style={[a.flex_1, viewStyles]} aria-modal accessibilityViewIsModal>
        <View
          style={[
            t.atoms.border_contrast_low,
            a.flex_row,
            a.align_center,
            a.justify_between,
            a.border_b,
            a.px_sm,
            a.py_xs,
            a.gap_md,
          ]}>
          <Button
            label={_(msg`Cancel`)}
            onPress={onPressCancel}
            size="small"
            variant="solid"
            color="secondary">
            <ButtonText>{_(msg`Cancel`)}</ButtonText>
          </Button>

          {!isProcessing ? (
            <View style={[a.flex_row, a.align_center, a.gap_md]}>
              {activePostLabels !== undefined && <SelectLabelsBtn />}

              <Button
                label={_(msg`Post`)}
                disabled={!canPublish}
                onPress={publishPost}
                size="small"
                variant="solid"
                color="primary"
                style={[a.my_xs]}>
                <ButtonText>{_(msg`Post`)}</ButtonText>
              </Button>
            </View>
          ) : (
            <View style={[a.flex_row, a.align_center, a.gap_md]}>
              <Text style={[t.atoms.text_contrast_medium]}>
                {processingState}
              </Text>

              <View
                style={[
                  {height: 40, width: 40},
                  a.align_center,
                  a.justify_center,
                ]}>
                <ActivityIndicator />
              </View>
            </View>
          )}
        </View>

        {isAltTextMissingAndRequired && (
          <View
            style={[
              {backgroundColor: t.palette.negative_100},
              a.mx_lg,
              a.mt_lg,
              a.px_sm,
              a.py_sm,
              a.rounded_sm,
              a.flex_row,
              a.gap_sm,
              a.align_center,
            ]}>
            <Warning fill={t.palette.negative_700} />
            <Text style={[{color: t.palette.negative_700}]}>
              <Trans>One or more images are missing alt text</Trans>
            </Text>
          </View>
        )}
        {error !== '' && (
          <View
            style={[
              {backgroundColor: t.palette.negative_100},
              a.mx_lg,
              a.mt_lg,
              a.px_sm,
              a.py_sm,
              a.rounded_sm,
              a.flex_row,
              a.gap_sm,
              a.align_center,
            ]}>
            <Warning fill={t.palette.negative_700} />
            <Text style={[{color: t.palette.negative_700}]}>
              <Trans>{error}</Trans>
            </Text>
          </View>
        )}

        <ScrollView style={[a.flex_1]}>
          {state.reply !== undefined && <ComposerReply reply={state.reply} />}

          <View style={[a.py_lg, a.gap_sm]}>
            {state.posts.map((post, index) => (
              <Post
                key={post.id}
                active={index === state.active}
                post={post}
                index={index}
                dispatch={dispatch}
                profile={currentProfile}
                hasPrevious={index !== 0}
                hasNext={index !== state.posts.length - 1}
                isReplying={state.reply !== undefined}
                inputRef={activeInputRef}
                onPublish={publishPost}
              />
            ))}
          </View>
        </ScrollView>

        <View style={[a.flex_row, a.pb_sm, a.px_sm]}>
          {state.reply === undefined && (
            <SelectThreadgateBtn
              threadgate={state.threadgates}
              onChange={onThreadgateChange}
            />
          )}
        </View>

        <Actions
          active
          activePost={activePost}
          dispatch={dispatch}
          canCreatePost={canCreatePost}
          onEmojiPicker={onEmojiPicker}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const Actions = ({
  active,
  activePost,
  dispatch,
  canCreatePost,
  onEmojiPicker,
}: {
  active: boolean
  activePost: PostStateWithDerivation
  dispatch: React.Dispatch<ComposerAction>
  canCreatePost: boolean
  onEmojiPicker: () => void
}): React.ReactNode => {
  const t = useTheme()

  const postId = activePost.id

  const addNewPost = React.useCallback(() => {
    return dispatch({type: 'add_post', postId})
  }, [dispatch, postId])

  const addNewImages = React.useCallback(
    (next: ComposerImage[]) => {
      return dispatch({
        type: 'embed_add_images',
        postId,
        images: next,
      })
    },
    [dispatch, postId],
  )

  const setGif = React.useCallback(
    (gif: Gif) => {
      return dispatch({
        type: 'embed_set_gif',
        postId,
        gif: {type: 'gif', gif},
      })
    },
    [dispatch, postId],
  )
  const onGifClose = React.useCallback(() => {}, [])

  const canEmbedImages = activePost.canEmbed.includes('image')
  const canEmbedGif = activePost.canEmbed.includes('gif')

  return (
    <View
      style={[
        t.atoms.border_contrast_low,
        a.flex_row,
        a.align_center,
        a.justify_between,
        a.px_sm,
        a.py_xs,
        a.gap_sm,
        a.border_t,
      ]}>
      <View style={[a.flex_row, a.gap_xs]}>
        <SelectPhotoBtn
          size={getImageCount(activePost.embed)}
          disabled={!active || !canEmbedImages}
          onAdd={addNewImages}
        />

        <OpenCameraBtn
          disabled={!active || !canEmbedImages}
          onAdd={addNewImages}
        />

        <SelectGifBtn
          disabled={!active || !canEmbedGif}
          onSelectGif={setGif}
          onClose={onGifClose}
        />

        <SelectEmojiBtn disabled={!active} onPress={onEmojiPicker} />
      </View>

      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        <Button
          disabled={!active}
          label="English"
          variant="ghost"
          color="primary"
          size="small"
          style={[a.px_sm]}>
          <ButtonText style={{color: t.palette.primary_500}}>
            English
          </ButtonText>
        </Button>

        <CharProgress length={activePost.rtLength} />

        <View
          style={[
            t.atoms.border_contrast_low,
            a.border_l,
            a.self_stretch,
            a.my_sm,
          ]}
        />

        <AddPostBtn disabled={!active || !canCreatePost} onPress={addNewPost} />
      </View>
    </View>
  )
}

const opacityStyle = {opacity: 0.5}
const borderNextStyle = {borderLeftWidth: 2}

const removePostStyle = {top: 2, right: -6}

let Post = ({
  active,
  post,
  index,
  dispatch,
  profile,
  hasPrevious,
  hasNext,
  isReplying,
  inputRef,
  onPublish,
}: {
  active: boolean
  post: PostStateWithDerivation
  index: number
  dispatch: React.Dispatch<ComposerAction>
  profile: AppBskyActorDefs.ProfileViewDetailed | undefined
  hasPrevious: boolean
  hasNext: boolean
  isReplying: boolean
  inputRef: React.MutableRefObject<
    React.MutableRefObject<TextInputRef | undefined> | undefined
  >
  onPublish: () => void
}): React.ReactNode => {
  const {_} = useLingui()
  const t = useTheme()

  const textInputRef = React.useRef<TextInputRef>()

  const postId = post.id

  const onRichTextChange = React.useCallback(
    (richtext: RichText) => {
      return dispatch({type: 'set_richtext', postId, richtext})
    },
    [dispatch, postId],
  )

  const onNewLink = React.useCallback(
    (uri: string) => {
      return dispatch({type: 'embed_set_link', postId, uri})
    },
    [dispatch, postId],
  )
  const onError = React.useCallback(
    (err: string) => {
      return dispatch({type: 'set_error', error: err})
    },
    [dispatch],
  )
  const onPhotoPasted = React.useCallback(
    async (uri: string) => {
      const res = await pasteImage(uri)
      return dispatch({type: 'embed_add_images', postId, images: [res]})
    },
    [dispatch, postId],
  )

  const onPostRemove = React.useCallback(() => {
    return dispatch({type: 'remove_post', postId})
  }, [dispatch, postId])
  const onFocus = React.useCallback(() => {
    return dispatch({type: 'set_active', postId})
  }, [dispatch, postId])

  const canRemovePost =
    active && (hasPrevious || hasNext) && post.rtLength === 0 && !post.embed

  React.useLayoutEffect(() => {
    if (active) {
      textInputRef.current?.focus()

      // Give `props.inputRef` access to our `textInputRef`
      inputRef.current = textInputRef
    }
  }, [active, post.embed, inputRef])

  return (
    <View style={[a.flex_row, a.gap_lg, a.px_lg, a.relative]}>
      <View style={[a.align_center, a.gap_sm, !active && opacityStyle]}>
        <UserAvatar
          avatar={profile?.avatar}
          size={48}
          type={profile?.associated?.labeler ? 'labeler' : 'user'}
        />

        {hasNext && (
          <View
            style={[t.atoms.border_contrast_medium, borderNextStyle, a.flex_1]}
          />
        )}
      </View>

      <View style={[a.flex_1, a.relative, !active && opacityStyle]}>
        <TextInput
          ref={textInputRef}
          disabled={!active}
          richtext={post.richtext}
          placeholder={
            !hasPrevious
              ? isReplying
                ? _(msg`Write your reply`)
                : _(msg`What's up?`)
              : _(msg`Write another post`)
          }
          grow={active || (!hasNext && !hasPrevious)}
          setRichText={onRichTextChange}
          onNewLink={onNewLink}
          onError={onError}
          onPhotoPasted={onPhotoPasted}
          onPressPublish={onPublish}
        />

        {canRemovePost && (
          <View style={[a.pt_2xs, a.absolute, removePostStyle]}>
            <RemovePostBtn onPress={onPostRemove} />
          </View>
        )}

        {post.embed !== undefined && (
          <View style={[a.mt_lg]}>
            <PostEmbeds
              active={active}
              postId={postId}
              embed={post.embed}
              dispatch={dispatch}
            />
          </View>
        )}
      </View>

      {!active && (
        <Pressable
          accessibilityLabel={_(msg`Post #${index + 1}`)}
          accessibilityHint={_(msg`Edits this post`)}
          onPress={onFocus}
          style={[a.absolute, a.inset_0, a.mx_lg]}
        />
      )}
    </View>
  )
}
Post = React.memo(Post)

let PostEmbeds = (props: {
  active: boolean
  postId: string
  embed: PostEmbed
  dispatch: React.Dispatch<ComposerAction>
}): React.ReactNode => {
  const embed = props.embed

  if (embed.type === 'external') {
    return <ExternalEmbed {...props} embed={embed} />
  }

  if (embed.type === 'image') {
    return <ImageEmbed {...props} embed={embed} />
  }

  if (embed.type === 'gif') {
    return <GifEmbed {...props} embed={embed} />
  }

  if (embed.type === 'record') {
    return <RecordEmbed {...props} embed={embed} />
  }

  if (embed.type === 'recordWithMedia') {
    return (
      <View>
        <PostEmbeds {...props} embed={embed.media} />
        <PostEmbeds {...props} embed={embed.record} />
      </View>
    )
  }

  return null
}
PostEmbeds = React.memo(PostEmbeds)
