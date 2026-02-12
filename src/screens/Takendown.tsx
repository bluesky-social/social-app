import {useState} from 'react'
import {View} from 'react-native'
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {type ComAtprotoAdminDefs, ToolsOzoneReportDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'
import {countGraphemes} from 'unicode-segmenter/grapheme'

import {
  BLUESKY_MOD_SERVICE_HEADERS,
  MAX_REPORT_REASON_GRAPHEME_LENGTH,
} from '#/lib/constants'
import {cleanError} from '#/lib/strings/errors'
import {useAgent, useSession, useSessionApi} from '#/state/session'
import {CharProgress} from '#/view/com/composer/char-progress/CharProgress'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {SimpleInlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {P, Text} from '#/components/Typography'
import {IS_WEB} from '#/env'

const COL_WIDTH = 400

export function Takendown() {
  const {_} = useLingui()
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const {gtMobile} = useBreakpoints()
  const {currentAccount} = useSession()
  const {logoutCurrentAccount} = useSessionApi()
  const agent = useAgent()
  const [isAppealling, setIsAppealling] = useState(false)
  const [reason, setReason] = useState('')

  const reasonGraphemeLength = countGraphemes(reason)
  const isOverMaxLength =
    reasonGraphemeLength > MAX_REPORT_REASON_GRAPHEME_LENGTH

  const {
    mutate: submitAppeal,
    isPending,
    isSuccess,
    error,
  } = useMutation({
    mutationFn: async (appealText: string) => {
      if (!currentAccount) throw new Error('No session')
      await agent.com.atproto.moderation.createReport(
        {
          reasonType: ToolsOzoneReportDefs.REASONAPPEAL,
          subject: {
            $type: 'com.atproto.admin.defs#repoRef',
            did: currentAccount.did,
          } satisfies ComAtprotoAdminDefs.RepoRef,
          reason: appealText,
        },
        {
          encoding: 'application/json',
          headers: BLUESKY_MOD_SERVICE_HEADERS,
        },
      )
    },
    onSuccess: () => setReason(''),
  })

  const primaryBtn =
    isAppealling && !isSuccess ? (
      <Button
        color="primary"
        size="large"
        label={_(msg`Submit appeal`)}
        onPress={() => submitAppeal(reason)}
        disabled={isPending || isOverMaxLength}>
        <ButtonText>
          <Trans>Submit Appeal</Trans>
        </ButtonText>
        {isPending && <ButtonIcon icon={Loader} />}
      </Button>
    ) : (
      <Button
        size="large"
        color="secondary_inverted"
        label={_(msg`Sign out`)}
        onPress={() => logoutCurrentAccount('Takendown')}>
        <ButtonText>
          <Trans>Sign Out</Trans>
        </ButtonText>
      </Button>
    )

  const secondaryBtn = isAppealling ? (
    !isSuccess && (
      <Button
        variant="ghost"
        size="large"
        color="secondary"
        label={_(msg`Cancel`)}
        onPress={() => setIsAppealling(false)}>
        <ButtonText>
          <Trans>Cancel</Trans>
        </ButtonText>
      </Button>
    )
  ) : (
    <Button
      variant="ghost"
      size="large"
      color="secondary"
      label={_(msg`Appeal suspension`)}
      onPress={() => setIsAppealling(true)}>
      <ButtonText>
        <Trans>Appeal Suspension</Trans>
      </ButtonText>
    </Button>
  )

  const webLayout = IS_WEB && gtMobile

  return (
    <View style={[a.util_screen_outer, a.flex_1]}>
      <KeyboardAwareScrollView style={[a.flex_1, t.atoms.bg]} centerContent>
        <View
          style={[
            a.flex_row,
            a.justify_center,
            gtMobile ? a.pt_4xl : [a.px_xl, a.pt_4xl],
          ]}>
          <View style={[a.flex_1, {maxWidth: COL_WIDTH, minHeight: COL_WIDTH}]}>
            <View style={[a.pb_xl]}>
              <Logo width={64} />
            </View>

            <Text style={[a.text_4xl, a.font_bold, a.pb_md]}>
              {isAppealling ? (
                <Trans>Appeal suspension</Trans>
              ) : (
                <Trans>Your account has been suspended</Trans>
              )}
            </Text>

            {isAppealling ? (
              <View style={[a.relative, a.w_full, a.mt_xl]}>
                {isSuccess ? (
                  <P style={[t.atoms.text_contrast_medium, a.text_center]}>
                    <Trans>
                      Your appeal has been submitted. If your appeal succeeds,
                      you will receive an email.
                    </Trans>
                  </P>
                ) : (
                  <>
                    <TextField.LabelText>
                      <Trans>Reason for appeal</Trans>
                    </TextField.LabelText>
                    <TextField.Root
                      isInvalid={
                        reasonGraphemeLength >
                          MAX_REPORT_REASON_GRAPHEME_LENGTH || !!error
                      }>
                      <TextField.Input
                        label={_(msg`Reason for appeal`)}
                        defaultValue={reason}
                        onChangeText={setReason}
                        placeholder={_(msg`Why are you appealing?`)}
                        multiline
                        numberOfLines={5}
                        autoFocus
                        style={{paddingBottom: 40, minHeight: 150}}
                        maxLength={MAX_REPORT_REASON_GRAPHEME_LENGTH * 10}
                      />
                    </TextField.Root>
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
                      <CharProgress
                        count={reasonGraphemeLength}
                        max={MAX_REPORT_REASON_GRAPHEME_LENGTH}
                      />
                    </View>
                  </>
                )}
                {error && (
                  <Text
                    style={[
                      a.text_md,
                      a.leading_snug,
                      {color: t.palette.negative_500},
                      a.mt_lg,
                    ]}>
                    {cleanError(error)}
                  </Text>
                )}
              </View>
            ) : (
              <P style={[t.atoms.text_contrast_medium, a.leading_snug]}>
                <Trans>
                  Your account was found to be in violation of the{' '}
                  <SimpleInlineLinkText
                    label={_(msg`Bluesky Social Terms of Service`)}
                    to="https://bsky.social/about/support/tos"
                    style={[a.text_md, a.leading_snug]}>
                    Bluesky Social Terms of Service
                  </SimpleInlineLinkText>
                  . You have been sent an email outlining the specific violation
                  and suspension period, if applicable. You can appeal this
                  decision if you believe it was made in error.
                </Trans>
              </P>
            )}

            {webLayout && (
              <View
                style={[
                  a.w_full,
                  a.flex_row,
                  a.justify_between,
                  a.pt_5xl,
                  {paddingBottom: 200},
                ]}>
                {secondaryBtn}
                {primaryBtn}
              </View>
            )}
          </View>
        </View>
      </KeyboardAwareScrollView>

      {!webLayout && (
        <View
          style={[
            a.align_center,
            t.atoms.bg,
            gtMobile ? a.px_5xl : a.px_xl,
            {paddingBottom: Math.max(insets.bottom, a.pb_5xl.paddingBottom)},
          ]}>
          <View style={[a.w_full, a.gap_sm, {maxWidth: COL_WIDTH}]}>
            {primaryBtn}
            {secondaryBtn}
          </View>
        </View>
      )}
    </View>
  )
}
