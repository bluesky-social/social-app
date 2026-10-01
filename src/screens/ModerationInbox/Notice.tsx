import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {countGraphemes} from 'unicode-segmenter/grapheme'

import {MAX_REPORT_REASON_GRAPHEME_LENGTH} from '#/lib/constants'
import {NotFoundScreen} from '#/view/screens/NotFound'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {ActionSummaryText} from './components/ActionSummaryText'
import {ContentBlock} from './components/ContentBlock'
import {SubjectPreview} from './components/SubjectPreview'
import {Timeline} from './components/Timeline'

const ANTI_HARASSMENT =
  'https://bsky.social/about/support/community-guidelines#:~:text=coordinated%20harassment%20campaigns.-,Anti%2DHarassment,-%3A%20We%20create%20space'

export function ModerationInboxNoticeDetailsScreen() {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const appealDialogControl = Dialog.useDialogControl()

  const isEnabled = ax.features.enabled(ax.features.ModerationInboxEnable)

  if (!isEnabled) {
    return <NotFoundScreen />
  }

  return (
    <Layout.Screen testID="moderationInboxSubjectDetailsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            <Trans>Notice</Trans>
          </Layout.Header.TitleText>
          <Layout.Header.SubtitleText>
            <Trans>Bluesky Moderation Service</Trans>
          </Layout.Header.SubtitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content>
        <View style={[a.p_lg, a.gap_lg]}>
          <ActionSummaryText header={l`Your post was removed`}>
            <Trans>
              Bluesky Moderation Service removed a post from Bluesky for
              violating our{' '}
              <InlineLinkText
                to="https://bsky.social/about/support/community-guidelines"
                label={l`Read our Community Guidelines`}
                style={[a.text_md]}>
                Community Guidelines
              </InlineLinkText>
              .
            </Trans>
          </ActionSummaryText>

          <ContentBlock header={l`Your post`}>
            <SubjectPreview />

            <View style={[a.gap_2xs]}>
              <Text style={[a.text_sm, t.atoms.text_contrast_high]}>
                <Trans>Rule violated:</Trans>
              </Text>
              <Text style={[a.text_md]}>
                <Trans>
                  <InlineLinkText
                    to={ANTI_HARASSMENT}
                    label={l`Community Guidelines: Harassment`}
                    style={[a.text_md]}>
                    Community Guidelines: Harassment
                  </InlineLinkText>
                </Trans>
              </Text>
            </View>

            <View style={[a.gap_2xs]}>
              <Text style={[a.text_sm, t.atoms.text_contrast_high]}>
                <Trans>
                  You can appeal once per decision. A different moderator will
                  review the appeal.
                </Trans>
              </Text>
              <View style={[a.align_start, a.mt_2xs]}>
                <Button
                  testID="moderationInboxAppealBtn"
                  label={l`Appeal this decision`}
                  size="tiny"
                  variant="outline"
                  color="secondary"
                  onPress={appealDialogControl.open}>
                  <ButtonText>
                    <Trans>Appeal this decision</Trans>
                  </ButtonText>
                </Button>
              </View>
            </View>
          </ContentBlock>

          <Timeline
            items={[{title: l`Post created`}, {title: l`Post removed`}]}
          />
        </View>
      </Layout.Content>

      <AppealDialog control={appealDialogControl} />
    </Layout.Screen>
  )
}

function AppealDialog({control}: {control: Dialog.DialogControlProps}) {
  const t = useTheme()
  const {i18n, t: l} = useLingui()
  const [details, setDetails] = useState('')

  const detailsLength = countGraphemes(details)
  const isOverLimit = detailsLength > MAX_REPORT_REASON_GRAPHEME_LENGTH
  const isSubmitDisabled = details.trim().length === 0 || isOverLimit
  const counterAccessibilityLabel = l`${detailsLength} of ${MAX_REPORT_REASON_GRAPHEME_LENGTH} characters used`

  const cancelButton = () => (
    <Button
      testID="moderationInboxAppealCancelBtn"
      label={l`Cancel appeal`}
      size="small"
      variant="ghost"
      color="primary"
      onPress={() => control.close()}>
      <ButtonText style={[a.text_md]}>
        <Trans>Cancel</Trans>
      </ButtonText>
    </Button>
  )

  const submitButton = () => (
    <Button
      testID="moderationInboxAppealSubmitBtn"
      label={l`Submit appeal`}
      size="small"
      color="primary"
      disabled={isSubmitDisabled}
      onPress={() => control.close()}>
      <ButtonText>
        <Trans>Submit</Trans>
      </ButtonText>
    </Button>
  )

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={l`Appeal this decision`}
        contentContainerStyle={[a.px_0, a.pt_0]}
        header={
          <Dialog.Header renderLeft={cancelButton} renderRight={submitButton}>
            <Dialog.HeaderText>
              <Trans>Appeal</Trans>
            </Dialog.HeaderText>
          </Dialog.Header>
        }>
        <View style={[a.p_lg, a.gap_lg]}>
          <Text style={[a.text_md]}>
            <Trans>
              Tell us why you believe this decision was a mistake. We will
              review your appeal along with the original content. You can appeal
              once per moderation decision.
            </Trans>
          </Text>
          <Text style={[a.text_md]}>
            <Trans>
              For more information about our appeals and redress process, please
              see our{' '}
              <InlineLinkText
                to="https://bsky.social/about/support/tos"
                label={l`Read our Terms of Service`}
                style={[a.text_md]}>
                Terms of Service
              </InlineLinkText>
              .
            </Trans>
          </Text>

          <View style={[a.gap_2xs]}>
            <View style={[a.flex_row, a.align_center, a.justify_between]}>
              <Text style={[a.text_sm, t.atoms.text_contrast_high]}>
                <Trans>Reason for appeal</Trans>
              </Text>
              <Text
                accessibilityLabel={counterAccessibilityLabel}
                accessibilityHint=""
                style={[
                  a.text_sm,
                  isOverLimit
                    ? {color: t.palette.negative_500}
                    : t.atoms.text_contrast_medium,
                  {fontVariant: ['tabular-nums']},
                ]}>
                {i18n.number(detailsLength)}/
                {i18n.number(MAX_REPORT_REASON_GRAPHEME_LENGTH)}
              </Text>
            </View>
            <Dialog.Input
              testID="moderationInboxAppealInput"
              label={l`Reason for appeal`}
              defaultValue=""
              onChangeText={setDetails}
              autoFocus
              multiline
              numberOfLines={3}
              isInvalid={isOverLimit}
              maxLength={MAX_REPORT_REASON_GRAPHEME_LENGTH * 10}
            />
          </View>
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
