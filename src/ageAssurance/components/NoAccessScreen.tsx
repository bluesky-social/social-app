import {useCallback, useEffect} from 'react'
import {ScrollView, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useSessionApi} from '#/state/session'
import {DeactivateAccountDialog} from '#/screens/Settings/components/DeactivateAccountDialog'
import {DeleteAccountDialog} from '#/screens/Settings/components/DeleteAccountDialog'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {AgeAssuranceBadge} from '#/components/ageAssurance/AgeAssuranceBadge'
import {MuBirthdateDialog} from '#/components/ageAssurance/MuBirthdateDialog'
import {Button, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {DeviceLocationRequestDialog} from '#/components/dialogs/DeviceLocationRequestDialog'
import {Full as Logo} from '#/components/icons/Logo'
import {createStaticClick, SimpleInlineLinkText} from '#/components/Link'
import {Outlet as PortalOutlet} from '#/components/Portal'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {BottomSheetOutlet} from '#/../modules/bottom-sheet'
import {useAgeAssurance} from '#/ageAssurance'
import {useAgeAssuranceDataContext} from '#/ageAssurance/data'
import {useComputeAgeAssuranceRegionAccess} from '#/ageAssurance/useComputeAgeAssuranceRegionAccess'
import {useAgeAssuranceRegionConfig} from '#/ageAssurance/util'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE, IS_WEB} from '#/env'
import {useDeviceGeolocationApi} from '#/geolocation'

const textStyles = [a.text_md, a.leading_snug]

/**
 * mu fork: the age gate. Shown by the shell when access === None. mu does not
 * offer identity verification, so the cases are:
 *
 *  - not declared yet     -> the one-time birthdate prompt (the gate itself)
 *  - declared, under 13   -> blocked everywhere
 *  - declared, below the region minimum age -> blocked in this region
 *  - declared, over the minimum but the region requires *verified* age
 *    assurance (e.g. US-MS) -> not available here (no recourse, only a
 *    wrong-location correction on native)
 */
export function NoAccessScreen() {
  const t = useTheme()
  const {_} = useLingui()
  const ax = useAnalytics()
  const {gtPhone} = useBreakpoints()
  const insets = useSafeAreaInsets()
  const birthdateControl = useDialogControl()
  const deactivateAccountControl = useDialogControl()
  const deleteAccountControl = useDialogControl()
  const {data} = useAgeAssuranceDataContext()
  const region = useAgeAssuranceRegionConfig()
  const {logoutCurrentAccount} = useSessionApi()

  const aa = useAgeAssurance()
  const isAARegion = !!region
  const hasDeclaredAge = data?.declaredAge !== undefined

  useEffect(() => {
    ax.metric(`ageAssurance:noAccessScreen:shown`, {
      accountCreatedAt: data?.accountCreatedAt || 'unknown',
      isAARegion,
      hasDeclaredAge,
      canUpdateBirthday: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onPressLogout = useCallback(() => {
    if (IS_WEB) {
      // We're switching accounts, which remounts the entire app. We change the
      // URL ourselves since the navigator is about to unmount.
      history.pushState(null, '', '/')
    }
    logoutCurrentAccount('AgeAssuranceNoAccessScreen')
  }, [logoutCurrentAccount])

  const updateBirthdate = (
    <Text style={textStyles}>
      <Trans>
        If your birthdate is wrong, you can{' '}
        <SimpleInlineLinkText
          label={_(msg`Update your birthdate`)}
          style={textStyles}
          {...createStaticClick(() => {
            ax.metric('ageAssurance:noAccessScreen:openBirthdateDialog', {})
            birthdateControl.open()
          })}>
          update it here
        </SimpleInlineLinkText>
        .
      </Trans>
    </Text>
  )

  return (
    <>
      <View style={[a.util_screen_outer, a.flex_1]}>
        <ScrollView
          contentContainerStyle={[
            a.px_2xl,
            {
              paddingTop: IS_WEB
                ? a.p_5xl.padding
                : insets.top + a.p_2xl.padding,
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
              {gap: 32},
            ]}>
            <View style={[a.align_start]}>
              <AgeAssuranceBadge />
            </View>

            {!hasDeclaredAge ? (
              <View style={[a.gap_lg]}>
                <Text style={textStyles}>
                  <Trans>Hi there!</Trans>
                </Text>
                <Text style={textStyles}>
                  <Trans>
                    To give you an age-appropriate experience, we need to know
                    your birthdate. This is a one-time thing, and your data
                    stays private.
                  </Trans>
                </Text>
                <Button
                  color="primary"
                  size="large"
                  label={_(msg`Add your birthdate`)}
                  onPress={() => birthdateControl.open()}>
                  <ButtonText>
                    <Trans>Add your birthdate</Trans>
                  </ButtonText>
                </Button>
                <Admonition type="tip">
                  <Trans>
                    For organizational accounts, use the birthdate of the person
                    who is responsible for the account.
                  </Trans>
                </Admonition>
              </View>
            ) : !aa.flags.isOverAppMinAccessAge ? (
              <View style={[a.gap_lg]}>
                <Text style={textStyles}>
                  <Trans>You must be at least 13 years old to use mu.</Trans>
                </Text>
                {updateBirthdate}
              </View>
            ) : isAARegion && !aa.flags.isOverRegionMinAccessAge ? (
              <View style={[a.gap_lg]}>
                <Text style={textStyles}>
                  <Trans>
                    Your declared age is below the minimum required to use mu in
                    your region.
                  </Trans>
                </Text>
                {updateBirthdate}
              </View>
            ) : (
              <View style={[a.gap_lg]}>
                <Text style={textStyles}>
                  <Trans>
                    mu isn't available in your region, which legally requires
                    verified age assurance.
                  </Trans>
                </Text>
                {updateBirthdate}
                {IS_NATIVE && <LocationCorrection />}
              </View>
            )}

            <View style={[a.pt_lg, a.gap_xl, {maxWidth: 280}]}>
              <Logo width={120} textFill={t.atoms.text.color} />
              <Text
                style={[
                  a.text_sm,
                  a.italic,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>
                  To log out,{' '}
                  <SimpleInlineLinkText
                    label={_(msg`Click here to log out`)}
                    {...createStaticClick(() => {
                      onPressLogout()
                    })}
                    style={[a.italic]}>
                    click here
                  </SimpleInlineLinkText>
                  . Or if you’d prefer, you can{' '}
                  <SimpleInlineLinkText
                    label={_(msg`Click here to delete your account`)}
                    {...createStaticClick(() => {
                      ax.metric(
                        'ageAssurance:noAccessScreen:openDeleteAccountDialog',
                        {},
                      )
                      deleteAccountControl.open()
                    })}
                    style={[a.italic]}>
                    delete your account
                  </SimpleInlineLinkText>
                  .
                </Trans>
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      <MuBirthdateDialog control={birthdateControl} />
      <DeactivateAccountDialog control={deactivateAccountControl} />
      <DeleteAccountDialog
        control={deleteAccountControl}
        deactivateDialogControl={deactivateAccountControl}
      />

      {/*
       * While this blocking overlay is up, other dialogs in the shell are not
       * mounted, so it _should_ be safe to use these here without fear of other
       * modals showing up.
       */}
      <BottomSheetOutlet />
      <PortalOutlet />
    </>
  )
}

/**
 * Native-only escape hatch: if the user's detected region is wrong, let them
 * re-resolve it via GPS. Only lifts the gate if the corrected location is in an
 * unregulated region (access === Full).
 */
function LocationCorrection() {
  const {_} = useLingui()
  const locationControl = useDialogControl()
  const {setDeviceGeolocation} = useDeviceGeolocationApi()
  const computeAccess = useComputeAgeAssuranceRegionAccess()
  const aa = useAgeAssurance()

  return (
    <>
      <Admonition>
        <Trans>
          Is your location wrong?{' '}
          <SimpleInlineLinkText
            label={_(msg`Update your location`)}
            {...createStaticClick(() => {
              locationControl.open()
            })}>
            Update it with GPS.
          </SimpleInlineLinkText>
        </Trans>
      </Admonition>

      <DeviceLocationRequestDialog
        control={locationControl}
        onLocationAcquired={props => {
          const access = computeAccess(props.geolocation)
          if (access !== aa.Access.Full) {
            props.disableDialogAction()
            props.setDialogError(
              _(
                msg`Based on your device's location, you're still in a region that requires age assurance.`,
              ),
            )
          } else {
            props.closeDialog(() => {
              setDeviceGeolocation(props.geolocation)
              Toast.show(_(msg`Thanks! You're all set.`), {type: 'success'})
            })
          }
        }}
      />
    </>
  )
}
