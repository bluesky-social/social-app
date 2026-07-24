import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import {Pressable, type ScrollView, View} from 'react-native'
import {type AppBskyLabelerDefs, BSKY_LABELER_DID} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {wait} from '#/lib/async/wait'
import {getLabelingServiceTitle} from '#/lib/moderation'
import {useCallOnce} from '#/lib/once'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useMyLabelersQuery} from '#/state/queries/preferences'
import {useProfileBlockMutationQueue} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {CharProgress} from '#/view/com/composer/char-progress/CharProgress'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useGutters, useTheme} from '#/alf'
import * as Admonition from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {useDelayedLoading} from '#/components/hooks/useDelayedLoading'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as Retry} from '#/components/icons/ArrowRotate'
import {
  Check_Stroke2_Corner0_Rounded as CheckThin,
  CheckThick_Stroke2_Corner0_Rounded as Check,
} from '#/components/icons/Check'
import {PaperPlane_Stroke2_Corner0_Rounded as PaperPlane} from '#/components/icons/PaperPlane'
import {PersonX_Stroke2_Corner0_Rounded as PersonX} from '#/components/icons/Person'
import {SquareArrowTopRight_Stroke2_Corner0_Rounded as SquareArrowTopRight} from '#/components/icons/SquareArrowTopRight'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {createStaticClick, InlineLinkText, Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import type * as bsky from '#/types/bsky'
import {useSubmitReportMutation} from './action'
import {
  BSKY_LABELER_ONLY_REPORT_REASONS,
  BSKY_LABELER_ONLY_SUBJECT_TYPES,
  NEW_TO_OLD_REASONS_MAP,
  SUPPORT_PAGE,
} from './const'
import {useCopyForSubject} from './copy'
import {initialState, reducer} from './state'
import {type ReportDialogProps, type ReportSubject} from './types'
import {parseReportSubject} from './utils/parseReportSubject'
import {
  type ReportCategoryConfig,
  type ReportOption,
  useReportOptions,
} from './utils/useReportOptions'

export {type ReportSubject} from './types'
export {useDialogControl as useReportDialogControl} from '#/components/Dialog'

export function useGlobalReportDialogControl() {
  return useGlobalDialogsControlContext().reportDialogControl
}

export function GlobalReportDialog() {
  const {value, control} = useGlobalReportDialogControl()
  return <ReportDialog control={control} subject={value?.subject} />
}

export function ReportDialog(
  props: Omit<ReportDialogProps, 'subject'> & {
    subject?: ReportSubject
  },
) {
  const ax = useAnalytics()
  const subject = useMemo(
    () => (props.subject ? parseReportSubject(props.subject) : undefined),
    [props.subject],
  )
  const propsOnClose = props.onClose
  const onClose = useCallback(() => {
    ax.metric('reportDialog:close', {})
    propsOnClose?.()
  }, [ax, propsOnClose])
  return (
    <Dialog.Outer control={props.control} onClose={onClose}>
      <Dialog.Handle />
      {subject ? <Inner {...props} subject={subject} /> : <Invalid />}
    </Dialog.Outer>
  )
}

/**
 * This should only be shown if the dialog is configured incorrectly by a
 * developer, but nevertheless we should have a graceful fallback.
 */
function Invalid() {
  const {t: l} = useLingui()
  return (
    <Dialog.ScrollableInner label={l`Report dialog`}>
      <Text style={[a.font_bold, a.text_xl, a.leading_snug, a.pb_xs]}>
        <Trans>Invalid report subject</Trans>
      </Text>
      <Text style={[a.text_md, a.leading_snug]}>
        <Trans>
          Something wasn't quite right with the data you're trying to report.
          Please contact support.
        </Trans>
      </Text>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

function Inner(props: ReportDialogProps) {
  const ax = useAnalytics()
  const logger = ax.logger.useChild(ax.logger.Context.ReportDialog)
  const t = useTheme()
  const {t: l} = useLingui()
  const ref = useRef<ScrollView>(null)
  const {
    data: allLabelers,
    isLoading: isLabelerLoading,
    error: labelersLoadError,
    refetch: refetchLabelers,
  } = useMyLabelersQuery({excludeNonConfigurableLabelers: true})
  const isLoading = useDelayedLoading(500, isLabelerLoading)
  const copy = useCopyForSubject(props.subject)
  const {categories, getCategory} = useReportOptions()
  const [state, dispatch] = useReducer(reducer, initialState)

  /**
   * Submission handling
   */
  const {mutateAsync: submitReport} = useSubmitReportMutation()
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  /**
   * Whether the in-flight (or completed) submission was triggered via the
   * "submit and block" button, used to show pending/success state on the
   * correct button.
   */
  const [withBlock, setWithBlock] = useState(false)

  const {currentAccount} = useSession()
  /**
   * The user to offer a block action against: the reported account itself,
   * or the author of a reported post. Other subject types (lists, feeds,
   * chats, etc.) don't get the block shortcut.
   */
  const blockTargetProfile =
    props.subject.type === 'account'
      ? props.subject.profile
      : props.subject.type === 'post'
        ? props.subject.authorProfile
        : undefined
  const canBlockSubject =
    !!blockTargetProfile && blockTargetProfile.did !== currentAccount?.did

  // some reasons ONLY go to Bluesky
  const isBskyOnlyReason = state?.selectedOption?.reason
    ? BSKY_LABELER_ONLY_REPORT_REASONS.has(state.selectedOption.reason)
    : false
  // some subjects ONLY go to Bluesky
  const isBskyOnlySubject = BSKY_LABELER_ONLY_SUBJECT_TYPES.has(
    props.subject.type,
  )

  /**
   * Labelers that support this `subject` and its NSID collection
   */
  const supportedLabelers = useMemo(() => {
    if (!allLabelers) return []
    return allLabelers
      .filter(l => {
        const subjectTypes: string[] | undefined = l.subjectTypes
        if (subjectTypes === undefined) return true
        if (props.subject.type === 'account') {
          return subjectTypes.includes('account')
        } else if (
          props.subject.type === 'convoMessage' ||
          props.subject.type === 'convo'
        ) {
          return subjectTypes.includes('chat')
        } else {
          return subjectTypes.includes('record')
        }
      })
      .filter(l => {
        const collections: string[] | undefined = l.subjectCollections
        if (collections === undefined) return true
        // all chat collections accepted, since only Bluesky handles chats
        if (
          props.subject.type === 'convoMessage' ||
          props.subject.type === 'convo'
        )
          return true
        return collections.includes(props.subject.nsid)
      })
      .filter(l => {
        if (!state.selectedOption) return false
        if (isBskyOnlyReason || isBskyOnlySubject) {
          return l.creator.did === BSKY_LABELER_DID
        }
        const supportedReasonTypes: string[] | undefined = l.reasonTypes
        if (supportedReasonTypes === undefined) return true
        return (
          // supports new reason type
          // supports old reason type (backwards compat)
          supportedReasonTypes.includes(state.selectedOption.reason) ||
          supportedReasonTypes.includes(
            NEW_TO_OLD_REASONS_MAP[state.selectedOption.reason],
          )
        )
      })
  }, [
    props.subject,
    allLabelers,
    state.selectedOption,
    isBskyOnlyReason,
    isBskyOnlySubject,
  ])
  const hasSupportedLabelers = !!supportedLabelers.length
  const hasSingleSupportedLabeler = supportedLabelers.length === 1

  /**
   * We skip the select labeler step if there's only one possible labeler, and
   * that labeler is Bluesky (which is the case for chat reports and certain
   * reason types). We'll use this below to adjust the indexing and skip the
   * step in the UI.
   */
  const isAlwaysBskyLabeler =
    hasSingleSupportedLabeler && (isBskyOnlyReason || isBskyOnlySubject)

  const onSubmit = useCallback(
    async (block?: () => Promise<unknown>) => {
      dispatch({type: 'clearError'})

      logger.info('submitting')

      try {
        setWithBlock(!!block)
        setIsPending(true)
        // wait at least 1s, make it feel substantial
        await wait(
          1e3,
          submitReport({
            subject: props.subject,
            state,
          }),
        )
        setIsSuccess(true)
        ax.metric('reportDialog:success', {
          reason: state.selectedOption?.reason ?? '',
          labeler: state.selectedLabeler?.creator.handle ?? '',
          details: !!state.details,
        })
        // give time for user feedback
        setTimeout(() => {
          props.control.close(() => {
            props.onAfterSubmit?.()
            /*
             * Run the block only after the dialog has fully closed: blocking
             * optimistically removes the subject's posts from feeds, which
             * would unmount this dialog mid-flight if it ran while open. The
             * report has already been sent, so a block failure is surfaced
             * via toast rather than a dialog error state.
             */
            if (block) {
              block().catch((err: Error) => {
                if (err?.name !== 'AbortError') {
                  logger.error('Failed to block account after report', {
                    safeMessage: err.message,
                  })
                  Toast.show(
                    l({message: 'Failed to block account', context: 'toast'}),
                    {
                      type: 'error',
                    },
                  )
                }
              })
            }
          })
        }, 1e3)
      } catch (err) {
        const e = err as Error
        ax.metric('reportDialog:failure', {})
        logger.error(e, {
          source: 'ReportDialog',
        })
        dispatch({
          type: 'setError',
          error: l`Something went wrong. Please try again.`,
        })
      } finally {
        setIsPending(false)
      }
    },
    [logger, submitReport, props, state, ax, l],
  )

  useCallOnce(() => {
    ax.metric('reportDialog:open', {
      subjectType: props.subject.type,
    })
  })()

  return (
    <Dialog.ScrollableInner
      testID="report:dialog"
      label={l`Report dialog`}
      ref={ref}
      style={[a.w_full, {maxWidth: 500}]}>
      <View style={[a.gap_2xl, IS_NATIVE && a.pt_md]}>
        <StepOuter>
          <StepTitle
            index={1}
            title={copy.subtitle}
            activeIndex1={state.activeStepIndex1}
          />
          {isLoading ? (
            <View style={[a.gap_sm]}>
              <OptionCardSkeleton />
              <OptionCardSkeleton />
              <OptionCardSkeleton />
              <OptionCardSkeleton />
              <OptionCardSkeleton />
              {/* Here to capture focus for a hot sec to prevent flash */}
              <Pressable accessible={false} />
            </View>
          ) : labelersLoadError || !allLabelers ? (
            <Admonition.Outer type="error">
              <Admonition.Row>
                <Admonition.Icon />
                <Admonition.Content>
                  <Admonition.Text>
                    <Trans>Something went wrong, please try again</Trans>
                  </Admonition.Text>
                </Admonition.Content>
                <Admonition.Button
                  color="negative_subtle"
                  label={l`Retry loading report options`}
                  onPress={() => void refetchLabelers()}>
                  <ButtonText>
                    <Trans>Retry</Trans>
                  </ButtonText>
                  <ButtonIcon icon={Retry} />
                </Admonition.Button>
              </Admonition.Row>
            </Admonition.Outer>
          ) : (
            <>
              {state.selectedCategory ? (
                <View style={[a.flex_row, a.align_center, a.gap_md]}>
                  <View style={[a.flex_1]}>
                    <CategoryCard option={state.selectedCategory} />
                  </View>
                  <Button
                    testID="report:clearCategory"
                    label={l`Change report category`}
                    size="tiny"
                    variant="solid"
                    color="secondary"
                    shape="round"
                    onPress={() => {
                      dispatch({type: 'clearCategory'})
                    }}>
                    <ButtonIcon icon={X} />
                  </Button>
                </View>
              ) : (
                <View style={[a.gap_sm]}>
                  {categories.map(o => (
                    <CategoryCard
                      key={o.key}
                      option={o}
                      onSelect={() => {
                        dispatch({
                          type: 'selectCategory',
                          option: o,
                          otherOption: getCategory('other').options[0],
                        })
                      }}
                    />
                  ))}

                  {['post', 'account'].includes(props.subject.type) && (
                    <Link
                      to={SUPPORT_PAGE}
                      label={l`Need to report a copyright violation, legal request, or regulatory compliance issue?`}>
                      {({hovered, pressed}) => (
                        <View
                          style={[
                            a.flex_row,
                            a.align_center,
                            a.w_full,
                            a.px_md,
                            a.py_sm,
                            a.rounded_sm,
                            a.border,
                            hovered || pressed
                              ? [t.atoms.border_contrast_high]
                              : [t.atoms.border_contrast_low],
                          ]}>
                          <Text style={[a.flex_1, a.italic, a.leading_snug]}>
                            <Trans>
                              Need to report a copyright violation, legal
                              request, or regulatory compliance issue?
                            </Trans>
                          </Text>
                          <SquareArrowTopRight
                            size="sm"
                            fill={t.atoms.text.color}
                          />
                        </View>
                      )}
                    </Link>
                  )}
                </View>
              )}
            </>
          )}
        </StepOuter>

        <StepOuter>
          <StepTitle
            index={2}
            title={l`Select a reason`}
            activeIndex1={state.activeStepIndex1}
          />
          {state.selectedOption ? (
            <View style={[a.flex_row, a.align_center, a.gap_md]}>
              <View style={[a.flex_1]}>
                <OptionCard option={state.selectedOption} />
              </View>
              <Button
                testID="report:clearReportOption"
                label={l`Change report reason`}
                size="tiny"
                variant="solid"
                color="secondary"
                shape="round"
                onPress={() => {
                  dispatch({type: 'clearOption'})
                }}>
                <ButtonIcon icon={X} />
              </Button>
            </View>
          ) : state.selectedCategory ? (
            <View style={[a.gap_sm]}>
              {getCategory(state.selectedCategory.key).options.map(o => (
                <OptionCard
                  key={o.reason}
                  option={o}
                  onSelect={() => {
                    dispatch({type: 'selectOption', option: o})
                  }}
                />
              ))}
            </View>
          ) : null}
        </StepOuter>

        {isAlwaysBskyLabeler ? (
          <ActionOnce
            check={() => !state.selectedLabeler}
            callback={() => {
              dispatch({
                type: 'selectLabeler',
                labeler: supportedLabelers[0],
              })
            }}
          />
        ) : (
          <StepOuter>
            <StepTitle
              index={3}
              title={l`Select moderation service`}
              activeIndex1={state.activeStepIndex1}
            />
            {state.activeStepIndex1 >= 3 && (
              <>
                {state.selectedLabeler ? (
                  <>
                    {hasSingleSupportedLabeler ? (
                      <LabelerCard labeler={state.selectedLabeler} />
                    ) : (
                      <View style={[a.flex_row, a.align_center, a.gap_md]}>
                        <View style={[a.flex_1]}>
                          <LabelerCard labeler={state.selectedLabeler} />
                        </View>
                        <Button
                          label={l`Change moderation service`}
                          size="tiny"
                          variant="solid"
                          color="secondary"
                          shape="round"
                          onPress={() => {
                            dispatch({type: 'clearLabeler'})
                          }}>
                          <ButtonIcon icon={X} />
                        </Button>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    {hasSupportedLabelers ? (
                      <View style={[a.gap_sm]}>
                        {hasSingleSupportedLabeler ? (
                          <>
                            <LabelerCard labeler={supportedLabelers[0]} />
                            <ActionOnce
                              check={() => !state.selectedLabeler}
                              callback={() => {
                                dispatch({
                                  type: 'selectLabeler',
                                  labeler: supportedLabelers[0],
                                })
                              }}
                            />
                          </>
                        ) : (
                          <>
                            {supportedLabelers.map(l => (
                              <LabelerCard
                                key={l.creator.did}
                                labeler={l}
                                onSelect={() => {
                                  dispatch({type: 'selectLabeler', labeler: l})
                                }}
                              />
                            ))}
                          </>
                        )}
                      </View>
                    ) : (
                      // should never happen in our app
                      <Admonition.Admonition type="warning">
                        <Trans>
                          Unfortunately, none of your subscribed labelers
                          supports this report type.
                        </Trans>
                      </Admonition.Admonition>
                    )}
                  </>
                )}
              </>
            )}
          </StepOuter>
        )}

        <StepOuter>
          <StepTitle
            index={isAlwaysBskyLabeler ? 3 : 4}
            title={l`Submit report`}
            activeIndex1={
              isAlwaysBskyLabeler
                ? state.activeStepIndex1 - 1
                : state.activeStepIndex1
            }
          />
          {state.activeStepIndex1 === 4 && (
            <>
              <View style={[a.pb_xs, a.gap_xs]}>
                <Text style={[a.leading_snug, a.pb_xs]}>
                  <Trans>
                    Your report will be sent to{' '}
                    <Text style={[a.font_semi_bold, a.leading_snug]}>
                      {state.selectedLabeler?.creator.displayName}
                    </Text>
                    .
                  </Trans>{' '}
                  {!state.detailsOpen ? (
                    <InlineLinkText
                      label={l`Add more details (optional)`}
                      {...createStaticClick(() => {
                        dispatch({type: 'showDetails'})
                      })}>
                      <Trans>Add more details (optional)</Trans>
                    </InlineLinkText>
                  ) : null}
                </Text>

                {state.detailsOpen && (
                  <View>
                    <Dialog.Input
                      testID="report:details"
                      multiline
                      value={state.details}
                      onChangeText={details => {
                        dispatch({type: 'setDetails', details})
                      }}
                      label={l`Additional details (limit 300 characters)`}
                      style={{paddingRight: 60}}
                      numberOfLines={4}
                    />
                    <View
                      style={[
                        a.absolute,
                        a.flex_row,
                        a.align_center,
                        a.pr_md,
                        a.pb_sm,
                        {
                          bottom: 0,
                          right: 0,
                        },
                      ]}>
                      <CharProgress count={state.details?.length || 0} />
                    </View>
                  </View>
                )}
              </View>
              <View style={[a.gap_sm]}>
                <Button
                  testID="report:submit"
                  label={l`Submit report`}
                  size="large"
                  variant="solid"
                  color="primary"
                  disabled={isPending || isSuccess}
                  onPress={() => void onSubmit()}>
                  <ButtonText>
                    <Trans>Submit report</Trans>
                  </ButtonText>
                  <ButtonIcon
                    icon={
                      isSuccess && !withBlock
                        ? CheckThin
                        : isPending && !withBlock
                          ? Loader
                          : PaperPlane
                    }
                  />
                </Button>

                {canBlockSubject && blockTargetProfile && (
                  <SubmitAndBlockButton
                    profile={blockTargetProfile}
                    isPending={isPending}
                    isSuccess={isSuccess}
                    withBlock={withBlock}
                    onSubmit={onSubmit}
                  />
                )}
              </View>

              {state.error && (
                <Admonition.Admonition type="error">
                  {state.error}
                </Admonition.Admonition>
              )}
            </>
          )}
        </StepOuter>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

/**
 * Secondary submit button that sends the report and then blocks the reported
 * user. Rendered as a separate component so the profile shadow and block
 * mutation hooks only run when there's a blockable subject.
 */
function SubmitAndBlockButton({
  profile,
  isPending,
  isSuccess,
  withBlock,
  onSubmit,
}: {
  profile: bsky.profile.AnyProfileView
  isPending: boolean
  isSuccess: boolean
  withBlock: boolean
  onSubmit: (block: () => Promise<unknown>) => Promise<void>
}) {
  const {t: l} = useLingui()
  const shadow = useProfileShadow(profile)
  const [queueBlock] = useProfileBlockMutationQueue(shadow)

  // already blocked, nothing to offer
  if (shadow.viewer?.blocking) return null

  return (
    <Button
      testID="report:submitAndBlock"
      label={l`Submit report and block account`}
      size="large"
      variant="solid"
      color="negative"
      disabled={isPending || isSuccess}
      onPress={() => void onSubmit(queueBlock)}>
      <ButtonText>
        <Trans>Submit report and block account</Trans>
      </ButtonText>
      <ButtonIcon
        icon={
          isSuccess && withBlock
            ? CheckThin
            : isPending && withBlock
              ? Loader
              : PersonX
        }
      />
    </Button>
  )
}

function ActionOnce({
  check,
  callback,
}: {
  check: () => boolean
  callback: () => void
}) {
  useEffect(() => {
    if (check()) {
      callback()
    }
  }, [check, callback])
  return null
}

function StepOuter({children}: {children: React.ReactNode}) {
  return <View style={[a.gap_md, a.w_full]}>{children}</View>
}

function StepTitle({
  index,
  title,
  activeIndex1,
}: {
  index: number
  title: string
  activeIndex1: number
}) {
  const t = useTheme()
  const active = activeIndex1 === index
  const completed = activeIndex1 > index
  return (
    <View style={[a.flex_row, a.gap_sm, a.pr_3xl]}>
      <View
        style={[
          a.justify_center,
          a.align_center,
          a.rounded_full,
          a.border,
          {
            width: 24,
            height: 24,
            backgroundColor: active
              ? t.palette.primary_500
              : completed
                ? t.palette.primary_100
                : t.atoms.bg_contrast_25.backgroundColor,
            borderColor: active
              ? t.palette.primary_500
              : completed
                ? t.palette.primary_400
                : t.atoms.border_contrast_low.borderColor,
          },
        ]}>
        {completed ? (
          <Check width={12} />
        ) : (
          <Text
            style={[
              a.font_bold,
              a.text_center,
              t.atoms.text,
              {
                color: active
                  ? 'white'
                  : completed
                    ? t.palette.primary_700
                    : t.atoms.text_contrast_medium.color,
                fontVariant: ['tabular-nums'],
                width: 24,
                height: 24,
                lineHeight: 24,
              },
            ]}>
            {index}
          </Text>
        )}
      </View>

      <Text
        style={[
          a.flex_1,
          a.font_bold,
          a.text_lg,
          a.leading_snug,
          active ? t.atoms.text : t.atoms.text_contrast_medium,
          {
            top: 1,
          },
        ]}>
        {title}
      </Text>
    </View>
  )
}

function CategoryCard({
  option,
  onSelect,
}: {
  option: ReportCategoryConfig
  onSelect?: (option: ReportCategoryConfig) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const gutters = useGutters(['compact'])
  const onPress = useCallback(() => {
    onSelect?.(option)
  }, [onSelect, option])
  return (
    <Button
      testID={`report:category:${option.title}`}
      label={l`Create report for ${option.title}`}
      onPress={onPress}
      disabled={!onSelect}>
      {({hovered, pressed}) => (
        <View
          style={[
            a.w_full,
            gutters,
            a.py_sm,
            a.rounded_sm,
            a.border,
            t.atoms.bg_contrast_25,
            hovered || pressed
              ? [t.atoms.border_contrast_high]
              : [t.atoms.border_contrast_low],
          ]}>
          <Text style={[a.text_md, a.font_semi_bold, a.leading_snug]}>
            {option.title}
          </Text>
          <Text
            style={[a.text_sm, , a.leading_snug, t.atoms.text_contrast_medium]}>
            {option.description}
          </Text>
        </View>
      )}
    </Button>
  )
}

function OptionCard({
  option,
  onSelect,
}: {
  option: ReportOption
  onSelect?: (option: ReportOption) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const gutters = useGutters(['compact'])
  const onPress = useCallback(() => {
    onSelect?.(option)
  }, [onSelect, option])
  return (
    <Button
      testID={`report:option:${option.title}`}
      label={l({
        message: `Create report for ${option.title}`,
        comment:
          'Accessibility label for button to create a moderation report for the selected option',
      })}
      onPress={onPress}
      disabled={!onSelect}>
      {({hovered, pressed}) => (
        <View
          style={[
            a.w_full,
            gutters,
            a.py_sm,
            a.rounded_sm,
            a.border,
            t.atoms.bg_contrast_25,
            hovered || pressed
              ? [t.atoms.border_contrast_high]
              : [t.atoms.border_contrast_low],
          ]}>
          <Text style={[a.text_md, a.font_semi_bold, a.leading_snug]}>
            {option.title}
          </Text>
        </View>
      )}
    </Button>
  )
}

function OptionCardSkeleton() {
  const t = useTheme()
  return (
    <View
      style={[
        a.w_full,
        a.rounded_sm,
        a.border,
        t.atoms.bg_contrast_25,
        t.atoms.border_contrast_low,
        {height: 55}, // magic, based on web
      ]}
    />
  )
}

function LabelerCard({
  labeler,
  onSelect,
}: {
  labeler: AppBskyLabelerDefs.LabelerViewDetailed
  onSelect?: (option: AppBskyLabelerDefs.LabelerViewDetailed) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const onPress = useCallback(() => {
    onSelect?.(labeler)
  }, [onSelect, labeler])
  const title = getLabelingServiceTitle({
    displayName: labeler.creator.displayName,
    handle: labeler.creator.handle,
  })
  return (
    <Button
      testID={`report:labeler:${labeler.creator.handle}`}
      label={l`Send report to ${title}`}
      onPress={onPress}
      disabled={!onSelect}>
      {({hovered, pressed}) => (
        <View
          style={[
            a.w_full,
            a.p_sm,
            a.flex_row,
            a.align_center,
            a.gap_sm,
            a.rounded_md,
            a.border,
            t.atoms.bg_contrast_25,
            hovered || pressed
              ? [t.atoms.border_contrast_high]
              : [t.atoms.border_contrast_low],
          ]}>
          <UserAvatar
            type="labeler"
            size={36}
            avatar={labeler.creator.avatar}
          />
          <View style={[a.flex_1]}>
            <Text style={[a.text_md, a.font_semi_bold, a.leading_snug]}>
              {title}
            </Text>
            <Text
              style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
              <Trans>By {sanitizeHandle(labeler.creator.handle, '@')}</Trans>
            </Text>
          </View>
        </View>
      )}
    </Button>
  )
}
