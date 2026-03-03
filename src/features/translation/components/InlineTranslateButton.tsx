import {useCallback, useMemo} from 'react'
import {type GestureResponderEvent, View} from 'react-native'
import {AppBskyFeedPost} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {HITSLOP_30} from '#/lib/constants'
import {getPostLanguage, isPostInLanguage} from '#/locale/helpers'
import {useLanguagePrefs} from '#/state/preferences'
import {type ThreadItem} from '#/state/queries/usePostThread/types'
import {atoms as a, native, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {useTranslateOnDevice} from '#/features/translation'
import * as bsky from '#/types/bsky'

export function InlineTranslateButton({
  post,
}: {
  post: Extract<ThreadItem, {type: 'threadPost'}>['value']['post']
}) {
  const t = useTheme()
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const langPrefs = useLanguagePrefs()

  const {translate, clearTranslation, translationState} = useTranslateOnDevice()

  const needsTranslation = useMemo(
    () =>
      Boolean(
        langPrefs.primaryLanguage &&
          !isPostInLanguage(post, [langPrefs.primaryLanguage]),
      ),
    [post, langPrefs.primaryLanguage],
  )

  const sourceLanguage = getPostLanguage(post)

  const onTranslatePress = useCallback(
    (e: GestureResponderEvent) => {
      e.preventDefault()
      void translate(
        post.record.text || '',
        langPrefs.primaryLanguage,
        sourceLanguage,
      )

      if (
        bsky.dangerousIsType<AppBskyFeedPost.Record>(
          post.record,
          AppBskyFeedPost.isRecord,
        )
      ) {
        ax.metric('translate', {
          sourceLanguages: post.record.langs ?? [],
          targetLanguage: langPrefs.primaryLanguage,
          textLength: post.record.text.length,
        })
      }

      return false
    },
    [ax, sourceLanguage, translate, langPrefs, post],
  )

  const onHideTranslation = useCallback(
    (e: GestureResponderEvent) => {
      e.preventDefault()
      clearTranslation()
      return false
    },
    [clearTranslation],
  )

  return (
    needsTranslation && (
      <View style={[a.gap_md, a.pt_md, a.align_start]}>
        {translationState.status === 'loading' ? (
          <View style={[a.flex_row, a.align_center, a.gap_xs]}>
            <Loader size="xs" />
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              <Trans>Translating…</Trans>
            </Text>
          </View>
        ) : translationState.status === 'success' ? (
          <Button
            label={l`Hide translation`}
            onPress={onHideTranslation}
            hoverStyle={native({opacity: 0.5})}
            hitSlop={HITSLOP_30}>
            <Text style={[a.text_sm, {color: t.palette.primary_500}]}>
              <Trans>Hide translation</Trans>
            </Text>
          </Button>
        ) : (
          <Button
            label={l`Translate`}
            onPress={onTranslatePress}
            hoverStyle={native({opacity: 0.5})}
            hitSlop={HITSLOP_30}>
            <Text style={[a.text_sm, {color: t.palette.primary_500}]}>
              <Trans>Translate</Trans>
            </Text>
          </Button>
        )}
      </View>
    )
  )
}
