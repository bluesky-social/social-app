import {useCallback} from 'react'
import {View} from 'react-native'
import {isValidDid} from '@atproto/syntax'
import {moderateProfile} from '@bsky/sdk/moderation'
import {Trans, useLingui} from '@lingui/react/macro'
import {useFocusEffect} from '@react-navigation/native'

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
  useModerationInboxReportQuery,
  useUpdateModerationInboxSeenMutation,
} from '#/state/queries/moderation-inbox'
import {useSession} from '#/state/session'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {NotFoundScreen} from '#/view/screens/NotFound'
import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {useReportOptions} from '#/components/moderation/ReportDialog/utils/useReportOptions'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {com, tools} from '#/lexicons'
import {ContentBlock} from './components/ContentBlock'
import {ReportActionSummary} from './components/ReportActionSummary'
import {ReportSubjectPreview} from './components/ReportSubjectPreview'

export function ModerationInboxReportDetailsScreen({
  route,
}: NativeStackScreenProps<
  CommonNavigatorParams,
  'ModerationInboxReportDetails'
>) {
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const {hasSession} = useSession()
  const {mutate: markSeen} = useUpdateModerationInboxSeenMutation({
    silent: true,
  })
  const moderationOpts = useModerationOpts()
  const isEnabled = ax.features.enabled(ax.features.ModerationInboxEnable)
  const moderationService = isValidDid(route.params.moderationService)
    ? route.params.moderationService
    : undefined
  const parsedId = Number(route.params.id)
  const id =
    Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : undefined
  const reportQuery = useModerationInboxReportQuery({
    moderationService,
    id,
    enabled: isEnabled,
  })
  const {data: labeler} = useLabelerInfoQuery({
    did: moderationService,
    enabled: isEnabled && id !== undefined,
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
  const isLoading = !reportQuery.isError && !reportQuery.data

  const notFound =
    matchXrpcError(reportQuery.error, tools.ozone.inbox.getReport) ===
    'NotFound'
  const canMarkSeen =
    isEnabled &&
    hasSession &&
    !!moderationService &&
    id !== undefined &&
    !reportQuery.isError &&
    !!reportQuery.data

  useFocusEffect(
    useCallback(() => {
      if (canMarkSeen) {
        markSeen({sections: ['reports']})
      }
    }, [canMarkSeen, markSeen]),
  )

  useFocusEffect(
    useCallback(() => {
      if (isEnabled && moderationService && id !== undefined && !notFound) {
        ax.metric('moderation:inbox:viewReport', {})
      }
    }, [ax, isEnabled, moderationService, id, notFound]),
  )

  if (!isEnabled || !moderationService || id === undefined || notFound) {
    return <NotFoundScreen />
  }

  return (
    <Layout.Screen testID="moderationInboxReportDetailsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            <Trans>Your report</Trans>
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
        {reportQuery.isError ? (
          <ErrorMessage
            message={cleanError(reportQuery.error)}
            onPressTryAgain={() => void reportQuery.refetch()}
          />
        ) : reportQuery.data ? (
          <ReportDetails data={reportQuery.data} />
        ) : (
          <View style={[a.align_center, a.p_5xl]}>
            <Loader size="xl" />
          </View>
        )}
      </Layout.Content>
    </Layout.Screen>
  )
}

function ReportDetails({
  data: {report, resolution},
}: {
  data: tools.ozone.inbox.getReport.$OutputBody
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {categories, getCategory} = useReportOptions()
  const reasonType =
    report.reasonType === com.atproto.moderation.defs.reasonSpam.value
      ? tools.ozone.report.defs.reasonMisleadingSpam.value
      : report.reasonType
  const selectedReason = categories
    .flatMap(category => category.options)
    .find(option => option.reason === reasonType)
  const fallbackReasonLabels = new Map<string, string>([
    [
      com.atproto.moderation.defs.reasonViolation.value,
      getCategory('ruleBreaking').title,
    ],
    [
      com.atproto.moderation.defs.reasonMisleading.value,
      getCategory('misleading').title,
    ],
    [
      com.atproto.moderation.defs.reasonSexual.value,
      getCategory('sexualAdultContent').title,
    ],
    [
      com.atproto.moderation.defs.reasonRude.value,
      getCategory('harassmentHate').title,
    ],
    [com.atproto.moderation.defs.reasonOther.value, getCategory('other').title],
    [com.atproto.moderation.defs.reasonAppeal.value, l`Appeal`],
    [tools.ozone.report.defs.reasonAppeal.value, l`Appeal`],
  ])
  const reasonLabel =
    selectedReason?.title ??
    fallbackReasonLabels.get(report.reasonType) ??
    l`Unknown report reason`
  const note = report.reason

  return (
    <View style={[a.p_lg, a.gap_lg]}>
      <ReportActionSummary report={report} resolution={resolution} />

      <ContentBlock header={l`What you reported`}>
        <ReportSubjectPreview report={report} />

        <View style={[a.gap_2xs]}>
          <Text style={[a.text_sm, t.atoms.text_contrast_high]}>
            <Trans>Reason:</Trans>
          </Text>
          <Text emoji style={[a.text_md]}>
            {reasonLabel}
          </Text>
        </View>

        {note ? (
          <View style={[a.gap_2xs]}>
            <Text style={[a.text_sm, t.atoms.text_contrast_high]}>
              <Trans>Your note:</Trans>
            </Text>
            <Text emoji style={[a.text_md]}>
              <Trans>“{note}”</Trans>
            </Text>
          </View>
        ) : null}
      </ContentBlock>
    </View>
  )
}
