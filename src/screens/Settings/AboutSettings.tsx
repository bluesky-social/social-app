import {useMemo} from 'react'
import {Platform} from 'react-native'
import {setStringAsync} from 'expo-clipboard'
import * as FileSystem from 'expo-file-system'
import {Image} from 'expo-image'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {useMutation} from '@tanstack/react-query'
import {Statsig} from 'statsig-react-native-expo'

import {appVersion, BUNDLE_DATE, bundleInfo} from '#/lib/app-info'
import {STATUS_PAGE_URL} from '#/lib/constants'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {isAndroid, isIOS, isNative} from '#/platform/detection'
import * as Toast from '#/view/com/util/Toast'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {Atom_Stroke2_Corner0_Rounded as AtomIcon} from '#/components/icons/Atom'
import {BroomSparkle_Stroke2_Corner2_Rounded as BroomSparkleIcon} from '#/components/icons/BroomSparkle'
import {CodeLines_Stroke2_Corner2_Rounded as CodeLinesIcon} from '#/components/icons/CodeLines'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import {Newspaper_Stroke2_Corner2_Rounded as NewspaperIcon} from '#/components/icons/Newspaper'
import {Wrench_Stroke2_Corner2_Rounded as WrenchIcon} from '#/components/icons/Wrench'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {useDemoMode} from '#/storage/hooks/demo-mode'
import {useDevMode} from '#/storage/hooks/dev-mode'
import {OTAInfo} from './components/OTAInfo'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'AboutSettings'>
export function AboutSettingsScreen({}: Props) {
  const {_, i18n} = useLingui()
  const [devModeEnabled, setDevModeEnabled] = useDevMode()
  const [demoModeEnabled, setDemoModeEnabled] = useDemoMode()
  const stableID = useMemo(() => Statsig.getStableID(), [])

  const {mutate: onClearImageCache, isPending: isClearingImageCache} =
    useMutation({
      mutationFn: async () => {
        const freeSpaceBefore = await FileSystem.getFreeDiskStorageAsync()
        await Image.clearDiskCache()
        const freeSpaceAfter = await FileSystem.getFreeDiskStorageAsync()
        const spaceDiff = freeSpaceBefore - freeSpaceAfter
        return spaceDiff * -1
      },
      onSuccess: sizeDiffBytes => {
        if (isAndroid) {
          Toast.show(
            _(
              msg({
                message: `Image cache cleared, freed ${i18n.number(
                  Math.abs(sizeDiffBytes / 1024 / 1024),
                  {
                    notation: 'compact',
                    style: 'unit',
                    unit: 'megabyte',
                  },
                )}`,
                comment: `Android-only toast message which includes amount of space freed using localized number formatting`,
              }),
            ),
          )
        } else {
          Toast.show(_(msg`Image cache cleared`))
        }
      },
    })

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>About</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.LinkItem
            to="https://bsky.social/about/support/tos"
            label={_(msg`Terms of Service`)}>
            <SettingsList.ItemIcon icon={NewspaperIcon} />
            <SettingsList.ItemText>
              <Trans>Terms of Service</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            to="https://bsky.social/about/support/privacy-policy"
            label={_(msg`Privacy Policy`)}>
            <SettingsList.ItemIcon icon={NewspaperIcon} />
            <SettingsList.ItemText>
              <Trans>Privacy Policy</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            to={STATUS_PAGE_URL}
            label={_(msg`Status Page`)}>
            <SettingsList.ItemIcon icon={GlobeIcon} />
            <SettingsList.ItemText>
              <Trans>Status Page</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          <SettingsList.Divider />
          <SettingsList.LinkItem to="/sys/log" label={_(msg`System log`)}>
            <SettingsList.ItemIcon icon={CodeLinesIcon} />
            <SettingsList.ItemText>
              <Trans>System log</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>
          {isNative && (
            <SettingsList.PressableItem
              onPress={() => onClearImageCache()}
              label={_(msg`Clear image cache`)}
              disabled={isClearingImageCache}>
              <SettingsList.ItemIcon icon={BroomSparkleIcon} />
              <SettingsList.ItemText>
                <Trans>Clear image cache</Trans>
              </SettingsList.ItemText>
              {isClearingImageCache && <SettingsList.ItemIcon icon={Loader} />}
            </SettingsList.PressableItem>
          )}
          <SettingsList.PressableItem
            label={_(msg`Version ${appVersion}`)}
            accessibilityHint={_(msg`Copies build version to clipboard`)}
            onLongPress={() => {
              const newDevModeEnabled = !devModeEnabled
              setDevModeEnabled(newDevModeEnabled)
              Toast.show(
                newDevModeEnabled
                  ? _(
                      msg({
                        message: 'Developer mode enabled',
                        context: 'toast',
                      }),
                    )
                  : _(
                      msg({
                        message: 'Developer mode disabled',
                        context: 'toast',
                      }),
                    ),
              )
            }}
            onPress={() => {
              setStringAsync(
                `Build version: ${appVersion}; Bundle info: ${bundleInfo}; Bundle date: ${BUNDLE_DATE}; Platform: ${Platform.OS}; Platform version: ${Platform.Version}; Anonymous ID: ${stableID}`,
              )
              Toast.show(_(msg`Copied build version to clipboard`))
            }}>
            <SettingsList.ItemIcon icon={WrenchIcon} />
            <SettingsList.ItemText>
              <Trans>Version {appVersion}</Trans>
            </SettingsList.ItemText>
            <SettingsList.BadgeText>{bundleInfo}</SettingsList.BadgeText>
          </SettingsList.PressableItem>
          {devModeEnabled && (
            <>
              <OTAInfo />
              {isIOS && (
                <SettingsList.PressableItem
                  onPress={() => {
                    const newDemoModeEnabled = !demoModeEnabled
                    setDemoModeEnabled(newDemoModeEnabled)
                    Toast.show(
                      'Demo mode ' +
                        (newDemoModeEnabled ? 'enabled' : 'disabled'),
                    )
                  }}
                  label={
                    demoModeEnabled ? 'Disable demo mode' : 'Enable demo mode'
                  }
                  disabled={isClearingImageCache}>
                  <SettingsList.ItemIcon icon={AtomIcon} />
                  <SettingsList.ItemText>
                    {demoModeEnabled ? 'Disable demo mode' : 'Enable demo mode'}
                  </SettingsList.ItemText>
                </SettingsList.PressableItem>
              )}
            </>
          )}
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}
