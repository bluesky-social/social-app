import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import {Text} from '../com/util/text/Text'
import {observer} from 'mobx-react-lite'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import * as waverlylib from 'lib/waverly-api/index'
import * as Toast from '../com/util/Toast'
import {cleanError} from 'lib/strings/errors'
import {colors, s} from 'lib/styles'
import {SelectPhotoBtn} from 'view/com/composer/photos/SelectPhotoBtn'
import {OpenCameraBtn} from 'view/com/composer/photos/OpenCameraBtn'
import {GalleryModel} from 'state/models/media/gallery'
import {Gallery} from 'view/com/composer/photos/Gallery'
import {useExternalLinkFetch} from 'view/com/composer/useExternalLinkFetch'
import {ExternalEmbed} from 'view/com/composer/ExternalEmbed'
import {isExternalUrl} from 'lib/strings/url-helpers'

// TODO Issues:
// Cannot scroll to bottom with keyboard open

export const ComposeBlog = observer(function ComposeBlog() {
  // TODO:POST Analytics
  const store = useStores()
  const pal = usePalette('default')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingState, setProcessingState] = useState('')
  const [error, setError] = useState('')
  const [blogText, setBlogText] = useState('')
  const [group, setGroup] = useState('')

  const gallery = useMemo(() => new GalleryModel(store), [store])

  const [extUrl, setExtUrl] = useState('')
  const {extLink, setExtLink} = useExternalLinkFetch({setQuote: () => {}})

  useEffect(() => {
    if (isExternalUrl(extUrl)) setExtLink({uri: extUrl, isLoading: true})
    else setExtLink(undefined)
  }, [extUrl, setExtLink])

  const resetState = useCallback(() => {
    setBlogText('')
    setGroup('')
    gallery.images.forEach(i => gallery.remove(i))
    setExtLink(undefined)
  }, [gallery, setExtLink])

  const onPressPublish = useCallback(async () => {
    if (isProcessing) {
      return
    }

    setError('')

    setIsProcessing(true)

    let createdBlog
    try {
      // TODO:POST: Temp disable
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      createdBlog = await waverlylib.post(store, {
        rawText: blogText,
        groupDid: group,
        image: gallery.images ? gallery.images[0] : undefined,
        extLink,
        onStateChange: setProcessingState,
      })
      setProcessingState('')
      setIsProcessing(false)
      resetState()
    } catch (e: any) {
      setError(cleanError(e.message))
      setIsProcessing(false)
      return
    }

    // TODO:POST
    // await store.me.mainFeed.addPostToTop(createdPost.uri)

    Toast.show(`Your post has been published`)
  }, [
    blogText,
    extLink,
    gallery.images,
    group,
    isProcessing,
    resetState,
    store,
  ])

  const canPost = useMemo(
    () => group.length > 0 && blogText.trim().length > 0,
    [blogText, group.length],
  )

  const canSelectImages = useMemo(() => gallery.size < 1, [gallery.size])

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.outer}>
      <ScrollView
        style={[s.flex1]}
        contentContainerStyle={s.pb20}
        showsVerticalScrollIndicator={false}>
        {error !== '' && (
          <View style={styles.errorLine}>
            <Text style={[s.red4, s.flex1]}>{error}</Text>
          </View>
        )}
        <View style={[pal.border, styles.textInputLayout]}>
          <TextInput
            value={group}
            placeholder={'Enter group identifier'}
            onChangeText={t => setGroup(t)}
            accessible={true}
            accessibilityLabel="Select group"
            accessibilityHint={`Select group identifier`}
            style={s.flex1}
          />
        </View>
        <View style={styles.divider} />
        <View
          style={[pal.border, styles.textInputLayout, styles.blogInputLayout]}>
          <TextInput
            value={blogText}
            style={s.flex1}
            multiline
            placeholder={'Write your post'}
            onChangeText={t => setBlogText(t)}
            accessible={true}
            accessibilityLabel="Write Waverly Mini Blog"
            accessibilityHint={`Compose Waverly Mini Blog`}
          />
        </View>
        <View style={styles.divider} />
        <View style={[pal.border, styles.textInputLayout]}>
          <TextInput
            value={extUrl}
            placeholder={'Enter link'}
            onChangeText={t => setExtUrl(t)}
            accessible={true}
            accessibilityLabel="Enter link"
            accessibilityHint={`Select external link`}
            style={s.flex1}
          />
        </View>
        <View style={styles.divider} />
        <View style={[styles.bottomBar]}>
          {canSelectImages ? (
            <>
              <SelectPhotoBtn gallery={gallery} />
              <OpenCameraBtn gallery={gallery} />
            </>
          ) : null}
        </View>
        {isProcessing ? (
          <View style={[pal.btn, styles.processingLine]}>
            <Text style={pal.text}>{processingState}</Text>
          </View>
        ) : undefined}
        <Gallery gallery={gallery} />
        {gallery.isEmpty && extLink && (
          <ExternalEmbed
            link={extLink}
            onRemove={() => setExtLink(undefined)}
          />
        )}
        <View style={styles.divider} />
        {isProcessing ? (
          <View style={styles.postBtn}>
            <ActivityIndicator />
          </View>
        ) : canPost ? (
          <Pressable
            accessibilityRole="button"
            onPress={onPressPublish}
            style={styles.postBtn}
            disabled={!canPost}>
            <Text type="post-text" style={pal.textInverted}>
              {'Publish'}
            </Text>
          </Pressable>
        ) : (
          <View style={[styles.postBtn, pal.btn]}>
            <Text style={[pal.textLight, s.f16, s.bold]}>Publish</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
})

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'column',
    flex: 1,
    height: '100%',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 15,
  },
  errorLine: {
    flexDirection: 'row',
    backgroundColor: colors.red1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginVertical: 6,
  },
  textInputLayout: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    height: 55,
  },
  blogInputLayout: {height: 300},
  processingLine: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 6,
  },
  postBtn: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 6,
    height: 55,
    backgroundColor: colors.brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {height: 12},
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
