import {useCallback, useEffect} from 'react'
import {ScrollView, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  SupportCode,
  useCreateSupportLink,
} from '#/lib/hooks/useCreateSupportLink'
import {dateDiff, useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {isAppPassword} from '#/lib/jwt'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {isNative} from '#/platform/detection'
import {useIsBirthdateUpdateAllowed} from '#/state/birthdate'
import {useSession, useSessionApi} from '#/state/session'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {AgeAssuranceAppealDialog} from '#/components/ageAssurance/AgeAssuranceAppealDialog'
import {AgeAssuranceBadge} from '#/components/ageAssurance/AgeAssuranceBadge'
import {AgeAssuranceInitDialog} from '#/components/ageAssurance/AgeAssuranceInitDialog'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import * as Dialog from '#/components/Dialog'
import {BirthDateSettingsDialog} from '#/components/dialogs/BirthDateSettings'
import {DeviceLocationRequestDialog} from '#/components/dialogs/DeviceLocationRequestDialog'
import {Full as Logo} from '#/components/icons/Logo'
import {ShieldCheck_Stroke2_Corner0_Rounded as ShieldIcon} from '#/components/icons/Shield'
import {createStaticClick, SimpleInlineLinkText} from '#/components/Link'
import {Outlet as PortalOutlet} from '#/components/Portal'
import * as Toast from '#/components/Toast'
import {Span, Text} from '#/components/Typography'
import {BottomSheetOutlet} from '#/../modules/bottom-sheet'
import {useAgeAssurance} from '#/ageAssurance'
import {useAgeAssuranceDataContext} from '#/ageAssurance/data'
import {useComputeAgeAssuranceRegionAccess} from '#/ageAssurance/useComputeAgeAssuranceRegionAccess'
import {
  isLegacyBirthdateBug,
  useAgeAssuranceRegionConfig,
} from '#/ageAssurance/util'
import {useDeviceGeolocationApi} from '#/geolocation'

const textStyles = [a.text_md, a.leading_snug]

export function NoAccessScreen() {
  const t = useTheme()
  const {_} = useLingui()
  const {gtPhone} = useBreakpoints()
  const insets = useSafeAreaInsets()
  const birthdateControl = useDialogControl()
  const {data} = useAgeAssuranceDataContext()
  const region = useAgeAssuranceRegionConfig()
  const isBirthdateUpdateAllowed = useIsBirthdateUpdateAllowed()
  const {logoutCurrentAccount} = useSessionApi()
  const createSupportLink = useCreateSupportLink()

  const {currentAccount} = useSession()
  const isUsingAppPassword = isAppPassword(currentAccount?.accessJwt || '')

  const aa = useAgeAssurance()
  const isBlocked = aa.state.status === aa.Status.Blocked
  const isAARegion = !!region
  const hasDeclaredAge = data?.declaredAge !== undefined
  const canUpdateBirthday =
    isBirthdateUpdateAllowed || isLegacyBirthdateBug(data?.birthdate || '')

  useEffect(() => {
    // just counting overall hits here
    logger.metric(`blockedGeoOverlay:shown`, {})
    logger.metric(`ageAssurance:noAccessScreen:shown`, {
      accountCreatedAt: data?.accountCreatedAt || 'unknown',
      isAARegion,
      hasDeclaredAge,
      canUpdateBirthday,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onPressLogout = useCallback(() => {
    if (isWeb) {
      // We're switching accounts, which remounts the entire app.
      // On mobile, this gets us Home, but on the web we also need reset the URL.
      // We can't change the URL via a navigate() call because the navigator
      // itself is about to unmount, and it calls pushState() too late.
      // So we change the URL ourselves. The navigator will pick it up on remount.
      history.pushState(null, '', '/')
    }
    logoutCurrentAccount('AgeAssuranceNoAccessScreen')
  }, [logoutCurrentAccount])

  const birthdateUpdateText = canUpdateBirthday ? (
    <Text style={[textStyles]}>
      <Trans>
        If you believe your birthdate is incorrect, you can update it by{' '}
        <SimpleInlineLinkText
          label={_(msg`Click here to update your birthdate`)}
          style={[textStyles]}
          {...createStaticClick(() => {
            logger.metric('ageAssurance:noAccessScreen:openBirthdateDialog', {})
            birthdateControl.open()
          })}>
          clicking here
        </SimpleInlineLinkText>
        .
      </Trans>
    </Text>
  ) : (
    <Text style={[textStyles]}>
      <Trans>
        If you believe your birthdate is incorrect, please{' '}
        <SimpleInlineLinkText
          to={createSupportLink({code: SupportCode.AA_BIRTHDATE})}
          label={_(msg`Click here to contact our support team`)}
          style={[textStyles]}>
          contact our support team
        </SimpleInlineLinkText>
        .
      </Trans>
    </Text>
  )

  return (
    <>
      <ScrollView
        contentContainerStyle={[
          a.px_2xl,
          {
            paddingTop: isWeb ? a.p_5xl.padding : insets.top + a.p_2xl.padding,
            paddingBottom: 100,
          },
        ]}>
        <View
          style={[
            a.mx_auto,
            a.w_full,
            web({
              maxWidth: 380,
              paddingTop: gtPhone ? '8vh' : undefined,
            }),
            {
              gap: 32,
            },
          ]}>
          <View style={[a.align_start]}>
            <AgeAssuranceBadge />
          </View>

          {hasDeclaredAge ? (
            <>
              {isAARegion ? (
                <>
                  <View style={[a.gap_lg]}>
                    <Text style={[textStyles]}>
                      <Trans>Hey there!</Trans>
                    </Text>
                    <Text style={[textStyles]}>
                      <Trans>
                        You are accessing Bluesky from a region that legally
                        requires us to verify your age before allowing you to
                        access the app.
                      </Trans>
                    </Text>

                    {!isBlocked && birthdateUpdateText}
                  </View>

                  <AccessSection />
                </>
              ) : (
                <View style={[a.gap_lg]}>
                  <Text style={[textStyles]}>
                    <Trans>
                      Unfortunately, the birthdate you have saved to your
                      profile makes you too young to access Bluesky.
                    </Trans>
                  </Text>

                  {birthdateUpdateText}
                </View>
              )}
            </>
          ) : (
            <View style={[a.gap_lg]}>
              <Text style={[textStyles]}>
                <Trans>Hi there!</Trans>
              </Text>
              <Text style={[textStyles]}>
                <Trans>
                  In order to provide an age-appropriate experience, we need to
                  know your birthdate. This is a one-time thing, and your data
                  will be kept private.
                </Trans>
              </Text>
              <Text style={[textStyles]}>
                <Trans>
                  Set your birthdate below and we'll get you back to posting and
                  exploring in no time!
                </Trans>
              </Text>
              <Button
                color="primary"
                size="large"
                label={_(msg`Click here to update your birthdate`)}
                onPress={() => birthdateControl.open()}>
                <ButtonText>
                  <Trans>Add your birthdate</Trans>
                </ButtonText>
              </Button>

              {isUsingAppPassword && (
                <Admonition type="info">
                  <Trans>
                    Hmm, it looks like you're logged in with an{' '}
                    <Span style={[a.italic]}>App Password</Span>. To set your
                    birthdate, you'll need to log in with your main account
                    password, or ask whomever controls this account to do so.
                  </Trans>
                </Admonition>
              )}
            </View>
          )}

          <View style={[a.pt_lg, a.gap_xl]}>
            <Logo width={120} textFill={t.atoms.text.color} />
            <Text style={[a.text_sm, a.italic, t.atoms.text_contrast_medium]}>
              <Trans>
                To log out,{' '}
                <SimpleInlineLinkText
                  label={_(msg`Click here to log out`)}
                  {...createStaticClick(() => {
                    onPressLogout()
                  })}>
                  click here
                </SimpleInlineLinkText>
                .
              </Trans>
            </Text>
          </View>
        </View>
      </ScrollView>

      <BirthDateSettingsDialog control={birthdateControl} />

      {/*
       * While this blocking overlay is up, other dialogs in the shell
       * are not mounted, so it _should_ be safe to use these here
       * without fear of other modals showing up.
       */}
      <BottomSheetOutlet />
      <PortalOutlet />
    </>
  )
}

function AccessSection() {
  const t = useTheme()
  const {_, i18n} = useLingui()
  const control = useDialogControl()
  const appealControl = Dialog.useDialogControl()
  const locationControl = Dialog.useDialogControl()
  const getTimeAgo = useGetTimeAgo()
  const {setDeviceGeolocation} = useDeviceGeolocationApi()
  const computeAgeAssuranceRegionAccess = useComputeAgeAssuranceRegionAccess()

  const aa = useAgeAssurance()
  const {status, lastInitiatedAt} = aa.state
  const isBlocked = status === aa.Status.Blocked
  const hasInitiated = !!lastInitiatedAt
  const timeAgo = lastInitiatedAt
    ? getTimeAgo(lastInitiatedAt, new Date())
    : null
  const diff = lastInitiatedAt
    ? dateDiff(lastInitiatedAt, new Date(), 'down')
    : null

  return (
    <>
      <AgeAssuranceInitDialog control={control} />
      <AgeAssuranceAppealDialog control={appealControl} />

      <View style={[a.gap_xl]}>
        {isBlocked ? (
          <Admonition type="warning">
            <Trans>
              You are currently unable to access Bluesky's Age Assurance flow.
              Please{' '}
              <SimpleInlineLinkText
                label={_(msg`Contact our moderation team`)}
                {...createStaticClick(() => {
                  appealControl.open()
                  logger.metric('ageAssurance:appealDialogOpen', {})
                })}>
                contact our moderation team
              </SimpleInlineLinkText>{' '}
              if you believe this is an error.
            </Trans>
          </Admonition>
        ) : (
          <>
            <View style={[a.gap_md]}>
              <Button
                label={_(msg`Verify now`)}
                size="large"
                color={hasInitiated ? 'secondary' : 'primary'}
                onPress={() => {
                  control.open()
                  logger.metric('ageAssurance:initDialogOpen', {
                    hasInitiatedPreviously: hasInitiated,
                  })
                }}>
                <ButtonIcon icon={ShieldIcon} />
                <ButtonText>
                  {hasInitiated ? (
                    <Trans>Verify again</Trans>
                  ) : (
                    <Trans>Verify now</Trans>
                  )}
                </ButtonText>
              </Button>

              {lastInitiatedAt && timeAgo && diff ? (
                <Text
                  style={[a.text_sm, a.italic, t.atoms.text_contrast_medium]}
                  title={i18n.date(lastInitiatedAt, {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                  })}>
                  {diff.value === 0 ? (
                    <Trans>Last initiated just now</Trans>
                  ) : (
                    <Trans>Last initiated {timeAgo} ago</Trans>
                  )}
                </Text>
              ) : (
                <Text
                  style={[a.text_sm, a.italic, t.atoms.text_contrast_medium]}>
                  <Trans>Age assurance only takes a few minutes</Trans>
                </Text>
              )}
            </View>
          </>
        )}

        <View style={[a.gap_xs]}>
          {isNative && (
            <>
              <Admonition>
                <Trans>
                  Is your location not accurate?{' '}
                  <SimpleInlineLinkText
                    label={_(msg`Confirm your location`)}
                    {...createStaticClick(() => {
                      locationControl.open()
                    })}>
                    Tap here to confirm your location.
                  </SimpleInlineLinkText>{' '}
                </Trans>
              </Admonition>

              <DeviceLocationRequestDialog
                control={locationControl}
                onLocationAcquired={props => {
                  const access = computeAgeAssuranceRegionAccess(
                    props.geolocation,
                  )
                  if (access !== aa.Access.Full) {
                    props.disableDialogAction()
                    props.setDialogError(
                      _(
                        msg`We're sorry, but based on your device's location, you are currently located in a region that requires age assurance.`,
                      ),
                    )
                  } else {
                    props.closeDialog(() => {
                      // set this after close!
                      setDeviceGeolocation(props.geolocation)
                      Toast.show(_(msg`Thanks! You're all set.`), {
                        type: 'success',
                      })
                    })
                  }
                }}
              />
            </>
          )}
        </View>
      </View>
    </>
  )
}
