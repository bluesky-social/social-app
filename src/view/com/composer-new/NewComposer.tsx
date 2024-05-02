/* eslint-disable */

import React from 'react'
import {KeyboardAvoidingView, Pressable, ScrollView, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {AppBskyActorDefs, RichText} from '@atproto/api'

import {ComposerOpts, useComposerControls} from '#/state/shell/composer'
import {isAndroid, isIOS, isNative, isWeb} from '#/platform/detection'
import {useIsKeyboardVisible} from '#/lib/hooks/useIsKeyboardVisible'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {useSession} from '#/state/session'
import {useProfileQuery} from '#/state/queries/profile'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {UserAvatar} from '../util/UserAvatar'

import {
  reducer,
  createComposerState,
  ComposedPost,
  ComposedAction,
} from './state'

import {SelectPhotoBtn} from './photos/SelectPhotoBtn'
import {CharProgress} from './components/CharProgress'
import {TextInput, TextInputRef} from '../composer/text-input/TextInput'
import {AddPostBtn} from './components/AddPostBtn'
import {Text} from '#/components/Typography'

export const PostComposer = ({
  data,
  openEmojiPicker,
}: {
  data: ComposerOpts
  openEmojiPicker?: (rect: DOMRect | undefined) => void
}) => {
  const {closeComposer} = useComposerControls()

  const {currentAccount} = useSession()
  const {data: currentProfile} = useProfileQuery({did: currentAccount!.did})

  const [state, dispatch] = React.useReducer(reducer, data, createComposerState)
  const activePost = state.posts[state.active]

  const {_} = useLingui()

  const t = useTheme()
  const {isDesktop, isMobile} = useWebMediaQueries()

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

  const onPressCancel = React.useCallback(() => {
    closeComposer()
  }, [closeComposer])

  const canCreatePost = React.useMemo(() => {
    const active: ComposedPost = state.posts[state.active]
    const next: ComposedPost | undefined = state.posts[state.active + 1]

    return active.length !== 0 && (!next || next.length !== 0)
  }, [state.posts, state.active])

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
            a.px_sm,
            a.border_b,
            isWeb ? a.py_sm : [a.pt_sm, a.pb_xs],
          ]}>
          <Button
            label={_(msg`Cancel`)}
            onPress={onPressCancel}
            size="small"
            variant="solid"
            color="secondary">
            <ButtonText>{_(msg`Cancel`)}</ButtonText>
          </Button>

          <View style={[a.flex_1]}></View>

          <Button
            label={_(msg`Post`)}
            disabled={!state.canPost}
            size="small"
            variant="solid"
            color="primary">
            <ButtonText>{_(msg`Post`)}</ButtonText>
          </Button>
        </View>

        <ScrollView style={[a.flex_1, a.pt_lg, a.pb_lg]}>
          {state.posts.map((post, index) => (
            <Post
              key={post.key}
              active={index === state.active}
              index={index}
              post={post}
              dispatch={dispatch}
              profile={currentProfile}
              hasNext={index !== state.posts.length - 1}
              isReplying={state.replyTo !== undefined}
            />
          ))}
        </ScrollView>

        <Actions
          activePost={activePost}
          activeIndex={state.active}
          dispatch={dispatch}
          canCreatePost={canCreatePost}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

let Actions = ({
  activePost,
  activeIndex,
  dispatch,
  canCreatePost,
}: {
  activePost: ComposedPost
  activeIndex: number
  dispatch: React.Dispatch<ComposedAction>
  canCreatePost: boolean
}): React.ReactNode => {
  const t = useTheme()

  const addNewPost = React.useCallback(() => {
    return dispatch({type: 'addPost', index: activeIndex})
  }, [dispatch, activeIndex])

  return (
    <View
      style={[
        t.atoms.border_contrast_low,
        a.flex_row,
        a.align_center,
        a.px_sm,
        a.border_t,
        a.py_xs,
      ]}>
      <SelectPhotoBtn />

      <View style={a.flex_1}></View>

      <CharProgress length={activePost.length} />

      <View
        style={[
          t.atoms.border_contrast_low,
          a.border_l,
          a.self_stretch,
          a.mx_sm,
          a.my_sm,
        ]}
      />

      <AddPostBtn disabled={!canCreatePost} onPress={addNewPost} />
    </View>
  )
}
Actions = React.memo(Actions)

const opacityStyle = {opacity: 0.5}
const borderNextStyle = {borderLeftWidth: 2}

let Post = ({
  active,
  index,
  post,
  dispatch,
  profile,
  hasNext,
  isReplying,
}: {
  active: boolean
  index: number
  post: ComposedPost
  dispatch: React.Dispatch<ComposedAction>
  profile: AppBskyActorDefs.ProfileViewDetailed | undefined
  hasNext: boolean
  isReplying: boolean
}): React.ReactNode => {
  const {_} = useLingui()
  const t = useTheme()

  const onRichTextChange = React.useCallback(
    (richText: RichText) => {
      return dispatch({type: 'setText', index, richText})
    },
    [dispatch, index],
  )

  const onNewLink = React.useCallback((uri: string) => {}, [])
  const onError = React.useCallback((err: string) => {}, [])
  const onPhotoPasted = React.useCallback((uri: string) => {}, [])
  const onPressPublish = React.useCallback(() => {}, [])

  const onFocus = React.useCallback(() => {
    return dispatch({type: 'setActive', index})
  }, [dispatch, index])

  return (
    <View style={[a.flex_row, a.gap_lg, a.px_lg, a.relative]}>
      <View
        style={[
          a.align_center,
          hasNext && a.pb_sm,
          a.gap_sm,
          !active && opacityStyle,
        ]}>
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
          disabled={!active}
          richtext={post.richText}
          placeholder={
            index === 0
              ? isReplying
                ? _(msg`Write your reply`)
                : _(msg`What's up?`)
              : _(msg`Write another post`)
          }
          setRichText={onRichTextChange}
          onNewLink={onNewLink}
          onError={onError}
          onPhotoPasted={onPhotoPasted}
          onPressPublish={onPressPublish}
        />
      </View>

      {!active && (
        <Pressable
          onPress={onFocus}
          style={[
            a.absolute,
            a.inset_0,
            hasNext && a.mb_lg,
            a.mx_lg,
          ]}></Pressable>
      )}
    </View>
  )
}
Post = React.memo(Post)
