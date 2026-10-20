import {useCallback, useRef, useState} from 'react'
import {View} from 'react-native'
import {AtUri, isAtUriString, isValidDid} from '@atproto/syntax'
import {moderateProfile} from '@bsky/sdk/moderation'
import {Plural, Trans, useLingui} from '@lingui/react/macro'
import {useFocusEffect} from '@react-navigation/native'
import {countGraphemes} from 'unicode-segmenter/grapheme'

import {MAX_REPORT_REASON_GRAPHEME_LENGTH, webLinks} from '#/lib/constants'
import {isAppLabeler} from '#/lib/moderation'
import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {matchXrpcError} from '#/lib/xrpc-error'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useLabelerInfoQuery} from '#/state/queries/labeler'
import {
  useAppealModerationInboxSubjectMutation,
  useModerationInboxCacheMutation,
  useModerationInboxSubjectQuery,
  useUpdateModerationInboxSeenMutation,
} from '#/state/queries/moderation-inbox'
import {useSession} from '#/state/session'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {NotFoundScreen} from '#/view/screens/NotFound'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {tools} from '#/lexicons'
import {ActionSummaryText} from './components/ActionSummaryText'
import {ContentBlock} from './components/ContentBlock'
import {useActionedSubjectLabels} from './components/hooks/useActionedSubjectLabels'
import {ReportSubjectPreview} from './components/ReportSubjectPreview'
import {getNoticeLabels} from './components/util/noticeLabels'

export function ModerationInboxNoticeDetailsScreen({
  route,
}: NativeStackScreenProps<
  CommonNavigatorParams,
  'ModerationInboxNoticeDetails'
>) {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const {currentAccount, hasSession} = useSession()
  const {mutate: markSeen} = useUpdateModerationInboxSeenMutation({
    silent: true,
  })
  const moderationOpts = useModerationOpts()
  const isEnabled = ax.features.enabled(ax.features.ModerationInboxEnable)
  const moderationService = isValidDid(route.params?.moderationService)
    ? route.params.moderationService
    : undefined
  const rawSubject = route.params?.subject
  const subject = isValidDid(rawSubject)
    ? rawSubject
    : isAtUriString(rawSubject, {strict: false}) &&
        isValidDid(new AtUri(rawSubject).host) &&
        !!new AtUri(rawSubject).collection &&
        !!new AtUri(rawSubject).rkey
      ? rawSubject
      : undefined
  const subjectQuery = useModerationInboxSubjectQuery({
    moderationService,
    subject,
    enabled: isEnabled,
  })
  const {data: labeler} = useLabelerInfoQuery({
    did: moderationService,
    enabled: isEnabled && !!subject && hasSession,
  })
  const serviceName =
    labeler && moderationOpts
      ? createSanitizedDisplayName(
          labeler.creator,
          false,
          moderateProfile(labeler.creator, moderationOpts).ui('displayName'),
        )
      : moderationService && isAppLabeler(moderationService)
        ? l`Bluesky Moderation Service`
        : moderationService
  const data = subjectQuery.data?.pages[0]
  const isLoading = !data && !subjectQuery.isError
  const notFound =
    matchXrpcError(subjectQuery.error, tools.ozone.inbox.getActionedSubject) ===
    'NotFound'
  const canMarkSeen =
    isEnabled &&
    hasSession &&
    !!moderationService &&
    !!subject &&
    !notFound &&
    !!data

  useFocusEffect(
    useCallback(() => {
      if (canMarkSeen) {
        markSeen({sections: ['subjects']})
      }
    }, [canMarkSeen, markSeen]),
  )

  useFocusEffect(
    useCallback(() => {
      if (
        isEnabled &&
        hasSession &&
        moderationService &&
        subject &&
        !notFound
      ) {
        ax.metric('moderation:inbox:viewNotice', {})
      }
    }, [ax, isEnabled, hasSession, moderationService, subject, notFound]),
  )

  if (!isEnabled || !hasSession || !moderationService || !subject || notFound) {
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
            <Text emoji style={[a.text_sm, t.atoms.text_contrast_medium]}>
              {serviceName}
            </Text>
          </Layout.Header.SubtitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content
        contentContainerStyle={
          isLoading ? [a.flex_grow, a.justify_center] : undefined
        }>
        {data ? (
          <NoticeDetails
            key={`${currentAccount?.did}:${moderationService}:${subject}`}
            data={data}
            actions={
              subjectQuery.data?.pages.flatMap(page => page.actions) ?? []
            }
            serviceName={serviceName ?? moderationService}
          />
        ) : isLoading ? (
          <View style={[a.align_center, a.p_5xl]}>
            <Loader size="xl" />
          </View>
        ) : null}
        {subjectQuery.isError ? (
          <ErrorMessage
            message={cleanError(subjectQuery.error)}
            onPressTryAgain={() => void subjectQuery.refetch()}
          />
        ) : null}
        {data && subjectQuery.hasNextPage ? (
          <View style={[a.p_lg, a.align_start]}>
            <Button
              testID="moderationInboxOlderActionsBtn"
              label={l`Load older actions`}
              size="small"
              color="secondary"
              disabled={subjectQuery.isFetchingNextPage}
              onPress={() => void subjectQuery.fetchNextPage()}>
              {subjectQuery.isFetchingNextPage ? (
                <ButtonIcon icon={Loader} />
              ) : null}
              <ButtonText>
                <Trans>Load older actions</Trans>
              </ButtonText>
            </Button>
          </View>
        ) : null}
      </Layout.Content>
    </Layout.Screen>
  )
}

function NoticeDetails({
  data,
  actions,
  serviceName,
}: {
  data: tools.ozone.inbox.getActionedSubject.$OutputBody
  actions: tools.ozone.inbox.defs.ActionView[]
  serviceName: string
}) {
  const t = useTheme()
  const {i18n, t: l} = useLingui()
  const ax = useAnalytics()
  const appealDialogControl = Dialog.useDialogControl()
  const labels = getNoticeLabels(data)
  const actionLabels = useActionedSubjectLabels({
    src: data.src,
    subject: data.subject,
    enforcement: data.enforcement,
    latestAction: data.actions[0],
  })
  const policies = data.actions[0]?.policies ?? []
  const canAppeal = data.availableActions?.includes('appeal') ?? false
  const isAccount = 'did' in data.subject
  const appealedAction = actions.find(
    action =>
      !action.reversedAt &&
      [
        'contentRemoved',
        'accountSuspended',
        'accountTakedown',
        'labelApplied',
      ].includes(action.type),
  )

  return (
    <>
      <View style={[a.p_lg, a.gap_lg]}>
        <ActionSummaryText
          header={i18n._(labels.header)}
          date={labels.date ? new Date(labels.date) : undefined}>
          {labels.appealResolved ? (
            i18n._(labels.appealSummary)
          ) : data.appeal?.state === 'pending' ? (
            <Trans>
              Your appeal has been submitted and is awaiting review.
            </Trans>
          ) : data.actions[0]?.type === 'contentRemoved' &&
            !data.actions[0]?.reversedAt ? (
            <Trans>
              {serviceName} removed your content for violating our{' '}
              <InlineLinkText
                to={webLinks.community}
                label={l`Read our Community Guidelines`}
                style={[a.text_md]}>
                Community Guidelines
              </InlineLinkText>
              .
            </Trans>
          ) : undefined}
        </ActionSummaryText>
        <ContentBlock header={i18n._(labels.blockHeader)}>
          <ReportSubjectPreview report={data} allowOwnRecordSnapshot />
          {(data.actions[0]?.type === 'labelApplied' ||
            data.actions[0]?.type === 'labelRemoved') &&
          actionLabels?.summary ? (
            <Text emoji style={[a.text_sm]}>
              {actionLabels.summary}
            </Text>
          ) : null}
          {policies.length ? (
            <View style={[a.gap_2xs]}>
              <Text style={[a.text_sm, t.atoms.text_contrast_high]}>
                <Trans>
                  <Plural
                    value={policies.length}
                    one="Rule violated:"
                    other="Rules violated:"
                  />
                </Trans>
              </Text>
              {policies.map(policy => (
                <Text key={policy.key} emoji style={[a.text_md]}>
                  <InlineLinkText
                    to={policy.link}
                    label={policy.displayName}
                    style={[a.text_md]}>
                    {policy.displayName}
                  </InlineLinkText>
                </Text>
              ))}
            </View>
          ) : null}
          {canAppeal ? (
            <View style={[a.gap_2xs]}>
              <Text style={[a.text_sm, t.atoms.text_contrast_high]}>
                {isAccount ? (
                  <Trans>
                    You can submit one account appeal at a time. A different
                    moderator will review the appeal.
                  </Trans>
                ) : (
                  <Trans>
                    You can appeal once per decision. A different moderator will
                    review the appeal.
                  </Trans>
                )}{' '}
                <Trans>
                  For more information about our appeals and redress process,
                  please see our{' '}
                  <InlineLinkText
                    to={webLinks.tos}
                    label={l`Read our Terms of Service`}
                    style={[a.text_sm]}>
                    Terms of Service
                  </InlineLinkText>
                  .
                </Trans>
              </Text>
              <View style={[a.align_start, a.mt_2xs]}>
                <Button
                  testID="moderationInboxAppealBtn"
                  label={l`Appeal this decision`}
                  size="tiny"
                  variant="outline"
                  color="secondary"
                  onPress={() => {
                    ax.metric('moderation:inbox:startAppeal', {
                      type: appealedAction?.type,
                    })
                    appealDialogControl.open()
                  }}>
                  <ButtonText>
                    <Trans>Appeal this decision</Trans>
                  </ButtonText>
                </Button>
              </View>
            </View>
          ) : data.appeal?.state === 'expired' ? (
            <Text style={[a.text_sm, t.atoms.text_contrast_high]}>
              <Trans>The appeal window has closed.</Trans>
            </Text>
          ) : null}
        </ContentBlock>
      </View>
      <AppealDialog
        control={appealDialogControl}
        data={{...data, actions}}
        appealedAction={appealedAction}
      />
    </>
  )
}

function AppealDialog({
  control,
  data,
  appealedAction,
}: {
  control: Dialog.DialogControlProps
  data: tools.ozone.inbox.getActionedSubject.$OutputBody
  appealedAction: tools.ozone.inbox.defs.ActionView | undefined
}) {
  const t = useTheme()
  const {i18n, t: l} = useLingui()
  const ax = useAnalytics()
  const [details, setDetails] = useState('')
  const submitting = useRef(false)
  const appeal = useAppealModerationInboxSubjectMutation(data.src)
  const invalidateInbox = useModerationInboxCacheMutation()
  const errorCode = matchXrpcError(
    appeal.error,
    tools.ozone.inbox.appealActionedSubject,
  )
  let errorMessage: string
  switch (errorCode) {
    case 'AlreadyAppealed':
      errorMessage = l`This subject has already been appealed.`
      break
    case 'AppealWindowExpired':
      errorMessage = l`The appeal window has closed.`
      break
    case 'NotAppealable':
      errorMessage = l`This subject can no longer be appealed.`
      break
    case 'InvalidAppealSubject':
      errorMessage = l`This content could not be appealed. Please reload the notice and try again.`
      break
    default:
      errorMessage = l`Failed to submit appeal. Please try again.`
      break
  }

  const detailsLength = countGraphemes(details)
  const isOverLimit = detailsLength > MAX_REPORT_REASON_GRAPHEME_LENGTH
  const isSubmitDisabled =
    details.trim().length === 0 ||
    isOverLimit ||
    appeal.isPending ||
    !data.availableActions?.includes('appeal') ||
    !!errorCode

  const onSubmit = async () => {
    if (submitting.current || isSubmitDisabled) return
    submitting.current = true
    try {
      const updatedSubject = await appeal.mutateAsync({
        subject: data.subject,
        reason: details.trim(),
        action: appealedAction
          ? {
              $type: 'tools.ozone.inbox.appealActionedSubject#actionRef',
              id: appealedAction.id,
            }
          : undefined,
      })
      ax.metric('moderation:inbox:submitAppeal', {
        type: appealedAction?.type,
      })
      control.close(() => {
        void invalidateInbox(updatedSubject)
        Toast.show(l`Appeal submitted`)
      })
    } catch {
      // The mutation reports unexpected errors; the dialog keeps the reason.
      submitting.current = false
    }
  }
  const counterAccessibilityLabel = l`${detailsLength} of ${MAX_REPORT_REASON_GRAPHEME_LENGTH} characters used`

  const cancelButton = () => (
    <Button
      testID="moderationInboxAppealCancelBtn"
      label={l`Cancel appeal`}
      size="small"
      color="secondary"
      variant="ghost"
      disabled={appeal.isPending}
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
      onPress={() => void onSubmit()}>
      {appeal.isPending ? <ButtonIcon icon={Loader} /> : null}
      <ButtonText>
        <Trans>Submit</Trans>
      </ButtonText>
    </Button>
  )

  return (
    <Dialog.Outer
      control={control}
      onClose={() => {
        appeal.reset()
        setDetails('')
        submitting.current = false
      }}
      nativeOptions={{preventDismiss: appeal.isPending}}
      webOptions={{
        onBackgroundPress: () => {
          if (!submitting.current) control.close()
        },
      }}>
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
              review your appeal along with the original content.
            </Trans>
          </Text>

          {appeal.isError ? (
            <Admonition type="error">{errorMessage}</Admonition>
          ) : null}
          {errorCode ? (
            <Button
              label={l`Reload notice`}
              size="small"
              color="secondary"
              onPress={() =>
                control.close(() => {
                  void invalidateInbox()
                })
              }>
              <ButtonText>
                <Trans>Reload notice</Trans>
              </ButtonText>
            </Button>
          ) : null}
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
              value={details}
              onChangeText={setDetails}
              editable={!appeal.isPending}
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
