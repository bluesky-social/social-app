import {useEffect, useRef, useState} from 'react'
import {Image, View} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {requestPermissionsAsync, saveToLibraryAsync} from 'expo-media-library'
import * as Sharing from 'expo-sharing'
import {InstagramStory} from '@bsky.app/expo-bluesky-swiss-army'
import {Trans, useLingui} from '@lingui/react/macro'

import {HITSLOP_10} from '#/lib/constants'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {usePostQuery} from '#/state/queries/post'
import {atoms as a, useTheme} from '#/alf'
import {useThemeName} from '#/alf/util/useColorModeTheme'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as SegmentedControl from '#/components/forms/SegmentedControl'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon} from '#/components/icons/Arrow'
import {ArrowShareRight_Stroke2_Corner2_Rounded as ShareIcon} from '#/components/icons/ArrowShareRight'
import {Moon_Stroke2_Corner0_Rounded as MoonIcon} from '#/components/icons/Moon'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {InstagramGlyph} from '#/components/ShareDialog/icons'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {type app} from '#/lexicons'
import {captureView, releaseCapturedView} from './capture'
import {StoryImage} from './components/StoryImage'
import {
  FACEBOOK_APP_ID,
  IMAGE_HEIGHT,
  IMAGE_WIDTH,
  type PostImageMode,
  STORY_HEIGHT,
  STORY_WIDTH,
  type StorySky,
} from './const'
import {
  Download_Stroke2_Corner2_Rounded as DownloadIcon,
  Sun_Stroke2_Corner0_Rounded as SunIcon,
} from './icons'
import {useCanSharePostImage} from './useCanSharePostImage'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostImage'>

/** How a share or save ended, unless it threw. */
type Outcome = 'done' | 'notInstalled' | 'noPermission'

/**
 * A post as a shareable picture: previews it on a day or night sky, then
 * sends it to Instagram Stories (`story`) or the system share sheet (`image`),
 * or saves it to Photos.
 */
export function PostImageScreen({route, navigation}: Props) {
  const {name, rkey, mode = 'image'} = route.params
  const t = useTheme()
  const {data: post, isError} = usePostQuery(
    makeRecordUri(name, 'app.bsky.feed.post', rkey),
  )

  return (
    <Layout.Screen>
      {post ? (
        <PostImage post={post} mode={mode} onBack={() => navigation.goBack()} />
      ) : (
        <>
          <Layout.Header.Outer noBottomBorder>
            <Layout.Header.BackButton />
            <Layout.Header.Content />
            <Layout.Header.Slot />
          </Layout.Header.Outer>
          <View style={[a.flex_1, a.align_center, a.justify_center]}>
            {isError ? (
              <Text style={[t.atoms.text_contrast_medium]}>
                <Trans>Couldn’t load this post.</Trans>
              </Text>
            ) : (
              <Loader size="xl" />
            )}
          </View>
        </>
      )}
    </Layout.Screen>
  )
}

function PostImage({
  post,
  mode,
  onBack,
}: {
  post: app.bsky.feed.defs.PostView
  mode: PostImageMode
  onBack: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const insets = useSafeAreaInsets()
  const controlsInset = Math.max(insets.bottom, 16)
  /** Space at the sides of the preview and the controls. */
  const gutter = 24
  const canShare = useCanSharePostImage(post)
  const themeName = useThemeName()
  // Starts on the sky that matches the app's light or dark look
  const [sky, setSky] = useState<StorySky>(
    themeName === 'light' ? 'day' : 'night',
  )
  /** Which action is making the image, so only that button shows busy. */
  const [busy, setBusy] = useState<'share' | 'save' | null>(null)
  /** Set straight away, so a quick second tap can't start another share. */
  const isBusy = useRef(false)
  const storyRef = useRef<React.ComponentRef<typeof View>>(null)
  const [area, setArea] = useState({width: 0, height: 0})
  const scale = Math.min(area.width / STORY_WIDTH, area.height / STORY_HEIGHT)
  /*
   * Hidden until the clouds load, so the sky doesn't fill in after the preview
   * appears, and nothing is shared without them.
   */
  const [isReady, setIsReady] = useState(false)
  const previewOpacity = useSharedValue(0)
  const previewStyle = useAnimatedStyle(() => ({
    opacity: previewOpacity.get(),
  }))
  const onReady = () => {
    setIsReady(true)
    previewOpacity.set(withTiming(1, {duration: 200}))
  }

  /** Draws the story at 1080x1920 and returns the file. */
  const makeImage = () =>
    captureView(storyRef, {width: IMAGE_WIDTH, height: IMAGE_HEIGHT})

  /*
   * The preview shows a freshly drawn image of the story. Shrinking the live
   * story to fit the screen blurs its text, but a drawn image stays sharp. The
   * live story sits underneath until the image is ready. Drawn twice, so
   * photos that load late make it in.
   */
  const [preview, setPreview] = useState<{uri: string; sky: StorySky} | null>(
    null,
  )
  const isLaidOut = scale > 0
  /** The preview file on screen, deleted once it's replaced or we leave. */
  const previewUri = useRef<string | null>(null)
  const showPreview = (uri: string, previewSky: StorySky) => {
    if (previewUri.current) releaseCapturedView(previewUri.current)
    previewUri.current = uri
    setPreview({uri, sky: previewSky})
  }
  useEffect(
    () => () => {
      if (previewUri.current) releaseCapturedView(previewUri.current)
    },
    [],
  )
  useEffect(() => {
    if (!canShare || !isReady) return
    let cancelled = false
    const draw = () => {
      if (!storyRef.current) return
      void captureView(storyRef, {width: IMAGE_WIDTH, height: IMAGE_HEIGHT})
        .then(uri => {
          if (cancelled) releaseCapturedView(uri)
          else showPreview(uri, sky)
        })
        .catch(() => {})
    }
    const timers = [setTimeout(draw, 50), setTimeout(draw, 1200)]
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [canShare, sky, isReady])

  const run = async (
    action: 'share' | 'save',
    task: () => Promise<Outcome>,
    errorMessage: string,
  ) => {
    if (isBusy.current) return
    isBusy.current = true
    setBusy(action)
    const subject = {uri: post.uri, authorDid: post.author.did, mode}
    try {
      const outcome = await task()
      if (outcome !== 'done') {
        ax.metric('share:postImage:failed', {
          ...subject,
          action,
          reason: outcome,
        })
      } else if (action === 'share') {
        ax.metric('share:postImage:share', {...subject, sky})
      } else {
        ax.metric('share:postImage:save', {...subject, sky})
      }
    } catch (error) {
      logger.error('PostImage: share failed', {safeMessage: error})
      ax.metric('share:postImage:failed', {...subject, action, reason: 'error'})
      Toast.show(errorMessage, {type: 'error'})
    } finally {
      isBusy.current = false
      setBusy(null)
    }
  }

  const onShareToInstagram = () =>
    run(
      'share',
      async () => {
        if (!(await InstagramStory.isAvailable())) {
          Toast.show(l`Instagram isn’t installed`, {type: 'error'})
          return 'notInstalled'
        }
        /*
         * The whole image as the background, not the post as a sticker:
         * Instagram picks a sticker's starting size and draws it much smaller
         * than the preview shows.
         */
        await InstagramStory.share({
          appId: FACEBOOK_APP_ID,
          backgroundImage: await makeImage(),
        })
        return 'done'
      },
      l`Couldn’t open Instagram`,
    )

  const onShareImage = () =>
    run(
      'share',
      async () => {
        await Sharing.shareAsync(await makeImage(), {
          mimeType: 'image/png',
          UTI: 'public.png',
        })
        return 'done'
      },
      l`Couldn’t share the image`,
    )

  const onSave = () =>
    run(
      'save',
      async () => {
        // Add-only access is enough to save, and doesn't ask to read Photos
        const permission = await requestPermissionsAsync(true)
        if (!permission.granted) {
          Toast.show(l`Allow access to your photos to save the image`, {
            type: 'error',
          })
          return 'noPermission'
        }
        await saveToLibraryAsync(await makeImage())
        Toast.show(l`Image saved to your photos`, {type: 'success'})
        return 'done'
      },
      l`Couldn’t save the image`,
    )

  return (
    <>
      <Layout.Header.Outer noBottomBorder>
        {/* Black (white in dark mode) icons, rather than the header's gray */}
        <Layout.Header.Slot>
          <Button
            label={l`Go back`}
            size="small"
            variant="ghost"
            color="secondary"
            shape="round"
            onPress={onBack}
            hitSlop={HITSLOP_10}
            style={[a.bg_transparent, {marginLeft: -3}]}>
            <ArrowLeftIcon size="lg" fill={t.atoms.text.color} />
          </Button>
        </Layout.Header.Slot>
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            {mode === 'story'
              ? l({
                  message: 'Instagram Story',
                  comment:
                    'Title of the screen that shares a post to Instagram Stories',
                })
              : l`Share as image`}
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot>
          {canShare && (
            <Button
              testID="postImageSaveBtn"
              label={l`Save the image to your photos`}
              size="small"
              variant="ghost"
              color="secondary"
              shape="round"
              disabled={!isReady || busy !== null}
              onPress={() => void onSave()}
              hitSlop={HITSLOP_10}
              style={[a.bg_transparent, {right: -3}]}>
              {busy === 'save' ? (
                <Loader size="lg" fill={t.atoms.text.color} />
              ) : (
                <DownloadIcon size="lg" fill={t.atoms.text.color} />
              )}
            </Button>
          )}
        </Layout.Header.Slot>
      </Layout.Header.Outer>

      {!canShare ? (
        <View style={[a.flex_1, a.align_center, a.justify_center, a.px_xl]}>
          <Text style={[a.text_center, t.atoms.text_contrast_medium]}>
            <Trans>This post can’t be shared as an image.</Trans>
          </Text>
        </View>
      ) : (
        <>
          <View
            style={[
              a.flex_1,
              a.align_center,
              a.justify_center,
              // Sits the preview 4pt above center
              {paddingBottom: 8},
            ]}>
            {/*
             * The preview is as wide as the buttons below it, unless the
             * screen is too short, then it's as tall as fits.
             */}
            <View
              style={[
                a.absolute,
                {
                  inset: 0,
                  marginHorizontal: gutter,
                  marginTop: 4,
                  marginBottom: 12,
                },
              ]}
              onLayout={e => setArea(e.nativeEvent.layout)}
            />
            {!isReady && <Loader size="xl" style={[a.absolute]} />}
            {isLaidOut && (
              <Animated.View
                style={[
                  a.overflow_hidden,
                  t.atoms.shadow_lg,
                  {
                    width: STORY_WIDTH * scale,
                    height: STORY_HEIGHT * scale,
                    borderRadius: 16,
                    borderCurve: 'continuous',
                  },
                  previewStyle,
                ]}>
                {/*
                 * Shrunk to fit on screen. The capture is the unscaled story,
                 * so it always comes out at 1080x1920. It's a picture, so taps
                 * on it mustn't open the post's links or photos.
                 */}
                <View
                  pointerEvents="none"
                  style={[
                    a.absolute,
                    {
                      top: 0,
                      left: 0,
                      transform: [
                        {translateX: (STORY_WIDTH * scale - STORY_WIDTH) / 2},
                        {
                          translateY: (STORY_HEIGHT * scale - STORY_HEIGHT) / 2,
                        },
                        {scale},
                      ],
                    },
                  ]}>
                  <StoryImage
                    ref={storyRef}
                    post={post}
                    sky={sky}
                    onReady={onReady}
                  />
                </View>
                {preview?.sky === sky && (
                  <Image
                    source={{uri: preview.uri}}
                    accessibilityIgnoresInvertColors
                    style={[
                      a.absolute,
                      {
                        top: 0,
                        left: 0,
                        width: STORY_WIDTH * scale,
                        height: STORY_HEIGHT * scale,
                      },
                    ]}
                  />
                )}
              </Animated.View>
            )}
          </View>

          <View
            style={[
              a.gap_md,
              a.pt_sm,
              {paddingBottom: controlsInset, paddingHorizontal: gutter},
            ]}>
            <SegmentedControl.Root
              type="radio"
              label={l`Background`}
              // Sized to its content, not stretched, in this column
              style={[{flex: 0}]}
              value={sky}
              onChange={setSky}>
              <SegmentedControl.Item
                value="day"
                label={l({
                  message: 'Day',
                  comment: 'Story background option: a daytime blue sky',
                })}>
                <SegmentedControl.ItemIcon icon={SunIcon} />
                <SegmentedControl.ItemText>
                  <Trans comment="Story background option: a daytime blue sky">
                    Day
                  </Trans>
                </SegmentedControl.ItemText>
              </SegmentedControl.Item>
              <SegmentedControl.Item
                value="night"
                label={l({
                  message: 'Night',
                  comment: 'Story background option: a starry night sky',
                })}>
                <SegmentedControl.ItemIcon icon={MoonIcon} />
                <SegmentedControl.ItemText>
                  <Trans comment="Story background option: a starry night sky">
                    Night
                  </Trans>
                </SegmentedControl.ItemText>
              </SegmentedControl.Item>
            </SegmentedControl.Root>

            {mode === 'story' ? (
              <Button
                testID="postImageInstagramBtn"
                label={l`Share to your Instagram Story`}
                size="large"
                color="primary"
                disabled={!isReady || busy !== null}
                onPress={() => void onShareToInstagram()}>
                <ButtonIcon icon={busy === 'share' ? Loader : InstagramGlyph} />
                <ButtonText>
                  <Trans>Share to Instagram</Trans>
                </ButtonText>
              </Button>
            ) : (
              <Button
                testID="postImageShareBtn"
                label={l`Share the image`}
                size="large"
                color="primary"
                disabled={!isReady || busy !== null}
                onPress={() => void onShareImage()}>
                <ButtonIcon icon={busy === 'share' ? Loader : ShareIcon} />
                <ButtonText>
                  <Trans>Share</Trans>
                </ButtonText>
              </Button>
            )}
          </View>
        </>
      )}
    </>
  )
}
