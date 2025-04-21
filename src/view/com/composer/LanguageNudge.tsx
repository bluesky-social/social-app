import {useState} from 'react'
import {LayoutAnimation, View} from 'react-native'
import {type AppBskyActorDefs, type RichText} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {urls} from '#/lib/constants'
import {logger} from '#/logger'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {QuoteEmbed} from '../util/post-embeds/QuoteEmbed'

export default function LanguageNudgeDialog({
  control,
  postText,
  replyToUri,
  postAnyway,
  discardReply,
}: {
  control: Dialog.DialogControlProps
  postText: RichText
  replyToUri?: string
  postAnyway: () => void
  discardReply: () => void
}) {
  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      webOptions={{alignCenter: true}}>
      <Dialog.Handle />
      <DialogInner
        postText={postText}
        replyToUri={replyToUri}
        postAnyway={postAnyway}
        discardReply={discardReply}
      />
    </Dialog.Outer>
  )
}

function DialogInner({
  postText,
  replyToUri,
  postAnyway,
  discardReply,
}: {
  postText: RichText
  replyToUri?: string
  postAnyway: () => void
  discardReply: () => void
}) {
  const control = Dialog.useDialogContext()
  const {_} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()
  const profile = useProfileQuery({did: currentAccount?.did})
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  return (
    <Dialog.ScrollableInner
      label={_(msg`Are you sure you want to post this?`)}
      style={web({maxWidth: 500})}
      contentContainerStyle={[a.px_0]}>
      <View style={[a.flex_1, a.gap_md, a.align_center, a.py_lg, a.px_xl]}>
        <View
          style={[
            {
              width: 64,
              height: 64,
              backgroundColor: t.palette.primary_50,
            },
            a.rounded_full,
            a.justify_center,
            a.align_center,
          ]}
          aria-hidden={true}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          {/* No need to translate, it's decorative */}
          <Text
            style={[
              a.leading_tight,
              a.text_xl,
              a.font_bold,
              a.text_center,
              {color: t.palette.primary_500},
            ]}
            maxFontSizeMultiplier={1}
            minimumFontScale={1}>
            @#!
          </Text>
        </View>

        <Text style={[a.text_2xl, a.leading_snug, a.font_bold, a.text_center]}>
          <Trans>Are you sure you want to post this?</Trans>
        </Text>

        <Text
          style={[
            a.text_md,
            a.leading_snug,
            a.text_center,
            t.atoms.text_contrast_high,
          ]}>
          {replyToUri ? (
            <Trans>
              Your reply includes language that might go against our{' '}
              <InlineLinkText
                label={_(msg`Community guidelines`)}
                to={urls.website.support.communityGuidelines}
                style={[a.text_md, a.leading_snug]}>
                community guidelines
              </InlineLinkText>
              .
            </Trans>
          ) : (
            <Trans>
              Your post includes language that might go against our{' '}
              <InlineLinkText
                label={_(msg`Community guidelines`)}
                to={urls.website.support.communityGuidelines}
                style={[a.text_md, a.leading_snug]}>
                community guidelines
              </InlineLinkText>
              .
            </Trans>
          )}
        </Text>

        {profile.data && (
          <View style={[a.w_full, a.pointer_events_none]}>
            <QuoteEmbed
              quote={{
                $type: 'app.bsky.feed.defs#postView',
                uri: `at://${profile.data.did}/app.bsky.feed.post/draft`,
                cid: '',
                author: profile.data as AppBskyActorDefs.ProfileViewBasic,
                record: {
                  $type: 'app.bsky.feed.post',
                  createdAt: new Date().toISOString(),
                  text: postText.text,
                  facets: postText.facets,
                },
                indexedAt: new Date().toISOString(),
              }}
            />
          </View>
        )}

        {feedbackSubmitted ? (
          <Text
            style={[
              a.py_sm,
              a.text_sm,
              a.leading_snug,
              a.text_center,
              t.atoms.text_contrast_medium,
              a.italic,
            ]}>
            Feedback submitted
          </Text>
        ) : (
          <Button
            label={_(msg`Did we get this wrong?`)}
            onPress={() => {
              logger.metric('composer:nudge:feedback', {
                replyTo: replyToUri,
                text: postText.text,
              })
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              )
              setFeedbackSubmitted(true)
            }}
            size="small"
            color="secondary"
            variant="ghost">
            <ButtonText>
              <Trans>Did we get this wrong?</Trans>
            </ButtonText>
          </Button>
        )}
      </View>
      <View
        style={[
          a.flex_1,
          a.pt_xl,
          a.gap_md,
          a.align_stretch,
          a.border_t,
          t.atoms.border_contrast_low,
          a.px_xl,
        ]}>
        <Button
          label={_(msg`Keep editing`)}
          onPress={() => control.close()}
          size="large"
          color="primary"
          variant="solid">
          <ButtonText>
            <Trans>Keep editing</Trans>
          </ButtonText>
        </Button>
        <Button
          label={replyToUri ? _(msg`Discard reply`) : _(msg`Discard post`)}
          onPress={() => control.close(discardReply)}
          size="large"
          color="negative"
          variant="outline">
          <ButtonText>
            {replyToUri ? (
              <Trans>Discard reply</Trans>
            ) : (
              <Trans>Discard post</Trans>
            )}
          </ButtonText>
        </Button>
        <Button
          label={_(msg`Reply anyway`)}
          onPress={() => control.close(postAnyway)}
          size="large"
          color="secondary"
          variant="solid">
          <ButtonText>
            {replyToUri ? (
              <Trans>Reply anyway</Trans>
            ) : (
              <Trans>Post anyway</Trans>
            )}
          </ButtonText>
        </Button>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
