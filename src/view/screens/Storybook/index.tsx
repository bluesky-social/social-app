import React from 'react'
import {ScrollView, View} from 'react-native'
import {deleteAsync} from 'expo-file-system'
import {saveToLibraryAsync} from 'expo-media-library'

import {useSetThemePrefs} from '#/state/shell'
import {useVideoLibraryPermission} from 'lib/hooks/usePermissions'
import {isIOS, isWeb} from 'platform/detection'
import {CenteredView} from '#/view/com/util/Views'
import * as Toast from 'view/com/util/Toast'
import {ListContained} from 'view/screens/Storybook/ListContained'
import {atoms as a, ThemeProvider, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {HLSDownloadView} from '../../../../modules/expo-bluesky-swiss-army'
import {Breakpoints} from './Breakpoints'
import {Buttons} from './Buttons'
import {Dialogs} from './Dialogs'
import {Forms} from './Forms'
import {Icons} from './Icons'
import {Links} from './Links'
import {Menus} from './Menus'
import {Shadows} from './Shadows'
import {Spacing} from './Spacing'
import {Theming} from './Theming'
import {Typography} from './Typography'

export function Storybook() {
  if (isWeb) return <StorybookInner />

  return (
    <ScrollView>
      <StorybookInner />
    </ScrollView>
  )
}

function StorybookInner() {
  const t = useTheme()
  const {setColorMode, setDarkTheme} = useSetThemePrefs()
  const [showContainedList, setShowContainedList] = React.useState(false)
  const hlsDownloadRef = React.useRef<HLSDownloadView>(null)

  const {requestVideoAccessIfNeeded} = useVideoLibraryPermission()

  return (
    <CenteredView style={[t.atoms.bg]}>
      <View style={[a.p_xl, a.gap_5xl, {paddingBottom: 100}]}>
        <HLSDownloadView
          ref={hlsDownloadRef}
          downloaderUrl={
            isIOS
              ? 'http://localhost:19006/video-download'
              : 'http://10.0.2.2:19006/video-download'
          }
          onSuccess={async e => {
            const uri = e.nativeEvent.uri
            const permsRes = await requestVideoAccessIfNeeded()
            if (!permsRes) return

            await saveToLibraryAsync(uri)
            try {
              deleteAsync(uri)
            } catch (err) {
              console.error('Failed to delete file', err)
            }
            Toast.show('Video saved to library')
          }}
          onStart={() => console.log('Download is starting')}
          onError={e => console.log(e.nativeEvent.message)}
          onProgress={e => console.log(e.nativeEvent.progress)}
        />
        <Button
          variant="solid"
          color="primary"
          size="small"
          onPress={async () => {
            hlsDownloadRef.current?.startDownloadAsync(
              'https://lumi.jazco.dev/watch/did:plc:q6gjnaw2blty4crticxkmujt/Qmc8w93UpTa2adJHg4ZhnDPrBs1EsbzrekzPcqF5SwusuZ/playlist.m3u8?download=true',
            )
          }}
          label="Video download test">
          <ButtonText>Video download test</ButtonText>
        </Button>
        {!showContainedList ? (
          <>
            <View style={[a.flex_row, a.align_start, a.gap_md]}>
              <Button
                variant="outline"
                color="primary"
                size="small"
                label='Set theme to "system"'
                onPress={() => setColorMode('system')}>
                <ButtonText>System</ButtonText>
              </Button>
              <Button
                variant="solid"
                color="secondary"
                size="small"
                label='Set theme to "light"'
                onPress={() => setColorMode('light')}>
                <ButtonText>Light</ButtonText>
              </Button>
              <Button
                variant="solid"
                color="secondary"
                size="small"
                label='Set theme to "dim"'
                onPress={() => {
                  setColorMode('dark')
                  setDarkTheme('dim')
                }}>
                <ButtonText>Dim</ButtonText>
              </Button>
              <Button
                variant="solid"
                color="secondary"
                size="small"
                label='Set theme to "dark"'
                onPress={() => {
                  setColorMode('dark')
                  setDarkTheme('dark')
                }}>
                <ButtonText>Dark</ButtonText>
              </Button>
            </View>

            <Dialogs />
            <ThemeProvider theme="light">
              <Theming />
            </ThemeProvider>
            <ThemeProvider theme="dim">
              <Theming />
            </ThemeProvider>
            <ThemeProvider theme="dark">
              <Theming />
            </ThemeProvider>

            <Typography />
            <Spacing />
            <Shadows />
            <Buttons />
            <Icons />
            <Links />
            <Forms />
            <Dialogs />
            <Menus />
            <Breakpoints />

            <Button
              variant="solid"
              color="primary"
              size="large"
              label="Switch to Contained List"
              onPress={() => setShowContainedList(true)}>
              <ButtonText>Switch to Contained List</ButtonText>
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="solid"
              color="primary"
              size="large"
              label="Switch to Storybook"
              onPress={() => setShowContainedList(false)}>
              <ButtonText>Switch to Storybook</ButtonText>
            </Button>
            <ListContained />
          </>
        )}
      </View>
    </CenteredView>
  )
}
